/**
 * Utility to fetch files from shared storage backend
 * Used for auto-loading pre-uploaded data from unified landing page
 */

const SHARED_STORAGE_URL = process.env.REACT_APP_SHARED_STORAGE_URL || 'http://localhost:8080';

/**
 * Fetch session metadata from shared storage
 */
export async function fetchSessionMetadata(sessionId) {
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
export async function fetchFileFromSharedStorage(sessionId, filename) {
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
 * Fetch all files for a session and forward to analysis endpoints
 */
export async function fetchAndProcessSessionFiles(sessionId, setRawData, setHistoricalData) {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Fetch session metadata
    const session = await fetchSessionMetadata(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    console.log('📦 Fetching pre-uploaded files from shared storage...');
    
    // Create FormData for CSV files
    const csvFormData = new FormData();
    
    if (session.uploadMode === 'combined') {
      // Combined mode
      const combinedFile = await fetchFileFromSharedStorage(sessionId, 'combined');
      if (combinedFile) {
        csvFormData.append('combined', combinedFile);
      }
    } else {
      // Separate mode
      const nswFile = await fetchFileFromSharedStorage(sessionId, 'nsw');
      const qldFile = await fetchFileFromSharedStorage(sessionId, 'qld');
      const waFile = await fetchFileFromSharedStorage(sessionId, 'wa');
      
      if (nswFile) csvFormData.append('nsw', nswFile);
      if (qldFile) csvFormData.append('qld', qldFile);
      if (waFile) csvFormData.append('wa', waFile);
    }
    
    // Upload CSV files to Weekly Sales backend
    console.log('📤 Forwarding CSV files to analysis...');
    const csvResponse = await fetch(`${API_BASE_URL}/api/upload/csv`, {
      method: 'POST',
      body: csvFormData,
    });
    
    if (!csvResponse.ok) {
      throw new Error('Failed to process CSV files');
    }
    
    const csvData = await csvResponse.json();
    setRawData(csvData.rows);
    console.log('✅ CSV data loaded:', csvData.rows.length, 'records');
    
    // Check for historical file
    if (session.files.historical) {
      console.log('📤 Forwarding historical file...');
      const historicalFile = await fetchFileFromSharedStorage(sessionId, 'historical');
      
      if (historicalFile) {
        const historicalFormData = new FormData();
        historicalFormData.append('historical', historicalFile);
        
        const historicalResponse = await fetch(`${API_BASE_URL}/api/upload/historical`, {
          method: 'POST',
          body: historicalFormData,
        });
        
        if (historicalResponse.ok) {
          const historicalData = await historicalResponse.json();
          setHistoricalData(historicalData.rows);
          console.log('✅ Historical data loaded:', historicalData.rows.length, 'records');
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error processing session files:', error);
    return false;
  }
}
