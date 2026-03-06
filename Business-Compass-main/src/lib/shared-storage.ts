/**
 * Utility to fetch files from shared storage backend
 * Used for auto-loading pre-uploaded data from unified landing page
 */

const SHARED_STORAGE_URL = process.env.NEXT_PUBLIC_SHARED_STORAGE_URL || 'http://localhost:8080';

export interface SharedStorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface SharedStorageSession {
  uploadMode: 'separate' | 'combined';
  timestamp: string;
  files: {
    [key: string]: {
      originalname: string;
      mimetype: string;
      size: number;
    };
  };
}

/**
 * Fetch session metadata from shared storage
 */
export async function fetchSessionMetadata(sessionId: string): Promise<SharedStorageSession | null> {
  try {
    const response = await fetch(`${SHARED_STORAGE_URL}/api/session/${sessionId}`);
    
    if (!response.ok) {
      console.error('Session not found or expired');
      return null;
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching session metadata:', error);
    return null;
  }
}

/**
 * Download a specific file from shared storage
 */
export async function fetchFileFromSharedStorage(
  sessionId: string,
  filename: string
): Promise<File | null> {
  try {
    const response = await fetch(
      `${SHARED_STORAGE_URL}/api/session/${sessionId}/file/${filename}`
    );
    
    if (!response.ok) {
      console.error(`File ${filename} not found in session`);
      return null;
    }
    
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const originalFilename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : filename;
    
    return new File([blob], originalFilename, { type: blob.type });
  } catch (error) {
    console.error(`Error fetching file ${filename}:`, error);
    return null;
  }
}

/**
 * Fetch all files for a session
 */
export async function fetchSessionFiles(
  sessionId: string
): Promise<{ files: Array<{ file: File; branch: string }>; uploadMode: string } | null> {
  try {
    // First get session metadata
    const session = await fetchSessionMetadata(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Download each file
    const files: Array<{ file: File; branch: string }> = [];
    
    for (const [key, metadata] of Object.entries(session.files)) {
      const file = await fetchFileFromSharedStorage(sessionId, key);
      
      if (file) {
        // Map file keys to branch names
        let branch = key.toUpperCase();
        if (key === 'combined') {
          branch = 'COMBINED';
        } else if (key === 'historical') {
          branch = 'HISTORICAL';
        }
        
        files.push({ file, branch });
      }
    }
    
    return {
      files,
      uploadMode: session.uploadMode
    };
  } catch (error) {
    console.error('Error fetching session files:', error);
    return null;
  }
}
