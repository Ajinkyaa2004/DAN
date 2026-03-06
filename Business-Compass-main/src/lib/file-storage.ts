/**
 * IndexedDB helper for storing large file data
 * Uses IndexedDB instead of sessionStorage to handle larger files without quota issues
 */

const DB_NAME = 'DansSalesAnalysis';
const STORE_NAME = 'pendingFiles';
const DB_VERSION = 1;

interface FileData {
  id: string;
  file: File;
  branch: string;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Store files in IndexedDB
 */
export async function storeFiles(files: Array<{ file: File; branch: string }>): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  // Clear existing data first
  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onerror = () => reject(clearRequest.error);
    clearRequest.onsuccess = () => resolve();
  });

  // Store each file
  for (let i = 0; i < files.length; i++) {
    const { file, branch } = files[i];
    const fileData: FileData = {
      id: `file_${i}`,
      file,
      branch
    };

    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(fileData);
      addRequest.onerror = () => reject(addRequest.error);
      addRequest.onsuccess = () => resolve();
    });
  }

  db.close();
}

/**
 * Retrieve files from IndexedDB
 */
export async function retrieveFiles(): Promise<Array<{ file: File; branch: string }>> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise<Array<{ file: File; branch: string }>>((resolve, reject) => {
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results: FileData[] = request.result;
      const files = results.map(({ file, branch }) => ({ file, branch }));
      resolve(files);
    };
  }).finally(() => {
    db.close();
  });
}

/**
 * Clear all files from IndexedDB
 */
export async function clearFiles(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise<void>((resolve, reject) => {
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  }).finally(() => {
    db.close();
  });
}
