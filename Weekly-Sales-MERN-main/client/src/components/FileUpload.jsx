import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, CheckCircle, X, FileText, FileSpreadsheet, AlertCircle, CheckCheck, AlertTriangle, ScanSearch } from 'lucide-react';
import './FileUpload.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function FileUpload({ setRawData, setHistoricalData, detectedSheets, setDetectedSheets }) {
  const [uploadMode, setUploadMode] = useState('separate'); // 'separate' or 'combined'
  const [nswFile, setNswFile] = useState(null);
  const [qldFile, setQldFile] = useState(null);
  const [waFile, setWaFile] = useState(null);
  const [combinedFile, setCombinedFile] = useState(null);
  const [historicalFile, setHistoricalFile] = useState(null);
  
  const [uploadStatus, setUploadStatus] = useState(null);
  const [historicalStatus, setHistoricalStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [autoDetectedConfig, setAutoDetectedConfig] = useState(null);

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  // CSV Dropzones
  const onDropNSW = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setNswFile(acceptedFiles[0]);
  }, []);

  const onDropQLD = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setQldFile(acceptedFiles[0]);
  }, []);

  const onDropWA = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setWaFile(acceptedFiles[0]);
  }, []);

  const onDropCombined = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setCombinedFile(file);
      // Note: Sheet detection happens on backend during parsing
      // No need to detect sheets in frontend
    }
  }, [setDetectedSheets]);

  const onDropHistorical = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setHistoricalFile(acceptedFiles[0]);
  }, []);

  const nswDropzone = useDropzone({ onDrop: onDropNSW, accept: { 'text/csv': ['.csv'] }, multiple: false });
  const qldDropzone = useDropzone({ onDrop: onDropQLD, accept: { 'text/csv': ['.csv'] }, multiple: false });
  const waDropzone = useDropzone({ onDrop: onDropWA, accept: { 'text/csv': ['.csv'] }, multiple: false });
  const combinedDropzone = useDropzone({ 
    onDrop: onDropCombined, 
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }, 
    multiple: false 
  });
  const historicalDropzone = useDropzone({ 
    onDrop: onDropHistorical, 
    accept: { 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }, 
    multiple: false 
  });

  // Upload CSV files
  const handleUploadCSV = async () => {
    if (!nswFile || !qldFile || !waFile) {
      setUploadStatus({ type: 'warning', message: 'Please upload all 3 CSV files to proceed' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('nsw', nswFile);
      formData.append('qld', qldFile);
      formData.append('wa', waFile);

      const response = await axios.post(`${API_BASE_URL}/api/upload/csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout
      });

      setRawData(response.data.rows);
      
      // Auto-detect configuration from uploaded data
      const data = response.data.rows;
      const detectedBranches = [...new Set(data.map(r => r.Branch).filter(Boolean))];
      const detectedCustomers = [...new Set(data.map(r => r.Customer).filter(Boolean))];
      const detectedYears = [...new Set(data.map(r => {
        const date = new Date(r['Issue Date']);
        return date.getFullYear();
      }).filter(Boolean))].sort();
      
      setAutoDetectedConfig({
        branches: detectedBranches.join(', '),
        totalRecords: data.length,
        customers: detectedCustomers.length,
        yearRange: detectedYears.length > 0 ? `${detectedYears[0]} - ${detectedYears[detectedYears.length - 1]}` : 'N/A',
        dateFormat: 'DD/MM/YYYY (detected)'
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully loaded ${response.data.rows.length} records` 
      });
    } catch (error) {
      console.error('CSV upload error:', error);
      let errorMessage = 'Failed to  upload CSV files';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - files may be too large';
      } else if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }
      
      setUploadStatus({ 
        type: 'error', 
        message: `Error: ${errorMessage}` 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Combined file (CSV or Excel)
  const handleUploadCombined = async () => {
    if (!combinedFile) {
      setUploadStatus({ type: 'warning', message: 'Please upload a file to proceed' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('combined', combinedFile);

      const response = await axios.post(`${API_BASE_URL}/api/upload/csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      setRawData(response.data.rows);
      
      // Auto-detect configuration from uploaded data
      const data = response.data.rows;
      const detectedBranches = [...new Set(data.map(r => r.Branch).filter(Boolean))];
      const detectedCustomers = [...new Set(data.map(r => r.Customer).filter(Boolean))];
      const detectedYears = [...new Set(data.map(r => {
        const date = new Date(r['Issue Date']);
        return date.getFullYear();
      }).filter(Boolean))].sort();
      
      setAutoDetectedConfig({
        branches: detectedBranches.join(', '),
        totalRecords: data.length,
        customers: detectedCustomers.length,
        yearRange: detectedYears.length > 0 ? `${detectedYears[0]} - ${detectedYears[detectedYears.length - 1]}` : 'N/A',
        dateFormat: 'DD/MM/YYYY (detected)'
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully loaded ${response.data.rows.length} records` 
      });
    } catch (error) {
      console.error('Combined upload error:', error);
      let errorMessage = 'Failed to upload file';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - file may be too large';
      } else if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }
      
      setUploadStatus({ 
        type: 'error', 
        message: `Error: ${errorMessage}` 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Unified Upload Handler - uploads both CSV and Historical data
  const handleUploadAll = async () => {
    console.log('=== Starting Upload ===');
    console.log('Upload Mode:', uploadMode);
    console.log('Files:', { nswFile, qldFile, waFile, combinedFile, historicalFile: historicalFile?.name });
    
    setIsUploading(true);
    setUploadStatus(null);
    setHistoricalStatus(null);

    try {
      // Step 1: Upload CSV data (separate or combined)
      let csvFormData = new FormData();
      
      if (uploadMode === 'separate') {
        if (!nswFile || !qldFile || !waFile) {
          setUploadStatus({ type: 'warning', message: 'Please upload all 3 CSV files' });
          setIsUploading(false);
          return;
        }
        csvFormData.append('nsw', nswFile);
        csvFormData.append('qld', qldFile);
        csvFormData.append('wa', waFile);
      } else {
        if (!combinedFile) {
          setUploadStatus({ type: 'warning', message: 'Please upload a combined file' });
          setIsUploading(false);
          return;
        }
        csvFormData.append('combined', combinedFile);
      }

      console.log('Uploading CSV data...');
      // Upload CSV/Sales data
      const csvResponse = await axios.post(`${API_BASE_URL}/api/upload/csv`, csvFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      console.log('CSV Response:', csvResponse.data);
      setRawData(csvResponse.data.rows);
      
      // Auto-detect configuration from uploaded data
      const data = csvResponse.data.rows;
      const detectedBranches = [...new Set(data.map(r => r.Branch).filter(Boolean))];
      const detectedCustomers = [...new Set(data.map(r => r.Customer).filter(Boolean))];
      const detectedYears = [...new Set(data.map(r => {
        const date = new Date(r['Issue Date']);
        return date.getFullYear();
      }).filter(Boolean))].sort();
      
      setAutoDetectedConfig({
        branches: detectedBranches.join(', '),
        totalRecords: data.length,
        customers: detectedCustomers.length,
        yearRange: detectedYears.length > 0 ? `${detectedYears[0]} - ${detectedYears[detectedYears.length - 1]}` : 'N/A',
        dateFormat: 'DD/MM/YYYY (detected)'
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully loaded ${csvResponse.data.rows.length} records` 
      });

      // Step 2: Upload Historical data if provided
      if (historicalFile) {
        console.log('Uploading historical data...');
        const historicalFormData = new FormData();
        historicalFormData.append('historical', historicalFile);

        const historicalResponse = await axios.post(`${API_BASE_URL}/api/upload/historical`, historicalFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        });

        console.log('Historical Response:', historicalResponse.data);
        setHistoricalData(historicalResponse.data.rows);
        setHistoricalStatus({ 
          type: 'success', 
          message: `Successfully loaded ${historicalResponse.data.rows.length} historical records` 
        });
      }
      
      console.log('=== Upload Complete ===');
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to upload files';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - files may be too large';
      } else if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }
      
      setUploadStatus({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* Upload Mode Selector */}
      <div className="file-upload-section">
        <h3><Upload size={12} /> Upload Mode</h3>
        <div className="upload-mode-selector">
          <label className="radio-option">
            <input
              type="radio"
              name="uploadMode"
              value="separate"
              checked={uploadMode === 'separate'}
              onChange={(e) => setUploadMode(e.target.value)}
            />
            <span>Separate CSVs</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="uploadMode"
              value="combined"
              checked={uploadMode === 'combined'}
              onChange={(e) => setUploadMode(e.target.value)}
            />
            <span>Combined CSV/Excel</span>
          </label>
        </div>
      </div>

      {/* Separate CSV Upload Section */}
      {uploadMode === 'separate' && (
        <div className="file-upload-section">
          <h3><FileText size={12} /> Sales Data (CSV)</h3>
          <div className="file-upload-items-grid">
          {/* NSW */}
          <div className="file-upload-item">
            <div 
              {...nswDropzone.getRootProps()} 
              className={`dropzone ${nswDropzone.isDragActive ? 'active' : ''} ${nswFile ? 'uploaded' : ''}`}
            >
              <input {...nswDropzone.getInputProps()} />
              <div className="dropzone-content">
                {nswFile ? <CheckCircle size={20} color="#4caf50" /> : <Upload size={20} />}
                <span className="dropzone-text">
                  {nswFile ? 'NSW CSV' : 'NSW CSV'}
                </span>
              </div>
            </div>
            {nswFile && (
              <div className="file-info">
                <span className="file-name">{nswFile.name}</span>
                <span className="file-size">{formatFileSize(nswFile.size)}</span>
                <button 
                  className="remove-file-btn"
                  onClick={() => setNswFile(null)}
                  aria-label="Remove NSW file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* QLD */}
          <div className="file-upload-item">
            <div 
              {...qldDropzone.getRootProps()} 
              className={`dropzone ${qldDropzone.isDragActive ? 'active' : ''} ${qldFile ? 'uploaded' : ''}`}
            >
              <input {...qldDropzone.getInputProps()} />
              <div className="dropzone-content">
                {qldFile ? <CheckCircle size={20} color="#4caf50" /> : <Upload size={20} />}
                <span className="dropzone-text">
                  {qldFile ? 'QLD CSV' : 'QLD CSV'}
                </span>
              </div>
            </div>
            {qldFile && (
              <div className="file-info">
                <span className="file-name">{qldFile.name}</span>
                <span className="file-size">{formatFileSize(qldFile.size)}</span>
                <button 
                  className="remove-file-btn"
                  onClick={() => setQldFile(null)}
                  aria-label="Remove QLD file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* WA */}
          <div className="file-upload-item">
            <div 
              {...waDropzone.getRootProps()} 
              className={`dropzone ${waDropzone.isDragActive ? 'active' : ''} ${waFile ? 'uploaded' : ''}`}
            >
              <input {...waDropzone.getInputProps()} />
              <div className="dropzone-content">
                {waFile ? <CheckCircle size={20} color="#4caf50" /> : <Upload size={20} />}
                <span className="dropzone-text">
                  {waFile ? 'WA CSV' : 'WA CSV'}
                </span>
              </div>
            </div>
            {waFile && (
              <div className="file-info">
                <span className="file-name">{waFile.name}</span>
                <span className="file-size">{formatFileSize(waFile.size)}</span>
                <button 
                  className="remove-file-btn"
                  onClick={() => setWaFile(null)}
                  aria-label="Remove WA file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Historical Excel */}
          <div className="file-upload-item">
            <label className="upload-label"><FileSpreadsheet size={12} /> Historical Excel (Optional)</label>
            <div 
              {...historicalDropzone.getRootProps()} 
              className={`dropzone ${historicalDropzone.isDragActive ? 'active' : ''} ${historicalFile ? 'uploaded' : ''}`}
            >
              <input {...historicalDropzone.getInputProps()} />
              <div className="dropzone-content">
                {historicalFile ? <CheckCircle size={20} color="#4caf50" /> : <Upload size={20} />}
                <span className="dropzone-text">
                  {historicalFile ? 'Excel file' : 'Historical Excel'}
                </span>
              </div>
            </div>
            {historicalFile && (
              <div className="file-info">
                <span className="file-name">{historicalFile.name}</span>
                <span className="file-size">{formatFileSize(historicalFile.size)}</span>
                <button 
                  className="remove-file-btn"
                  onClick={() => setHistoricalFile(null)}
                  aria-label="Remove historical file"
                >
                </button>
              </div>
            )}
          </div>
          </div>

          <button 
            className="upload-button" 
            onClick={handleUploadAll}
            disabled={(!nswFile || !qldFile || !waFile) || isUploading}
          >
            {isUploading ? 'Processing...' : 'Load Data'}
          </button>

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.type}`}>
              {uploadStatus.message}
            </div>
          )}

          {historicalStatus && (
            <div className={`upload-status ${historicalStatus.type}`}>
              {historicalStatus.message}
            </div>
          )}
          
          {/* Auto-Detected Configuration */}
          {autoDetectedConfig && (
            <div className="auto-detected-config">
          <h4><ScanSearch size={12} /> Auto-Detected Configuration</h4>
              <div className="config-details">
                <div className="config-item">
                  <span className="config-label">Branches:</span>
                  <div className="config-value-pills">
                    {autoDetectedConfig.branches.split(',').map((branch, idx) => (
                      <span key={idx} className="value-pill">{branch.trim()}</span>
                    ))}
                  </div>
                </div>
                <div className="config-item">
                  <span className="config-label">Total Records:</span>
                  <span className="config-value">{autoDetectedConfig.totalRecords.toLocaleString()}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Unique Customers:</span>
                  <span className="config-value">{autoDetectedConfig.customers.toLocaleString()}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Year Range:</span>
                  <span className="config-value value-pill">{autoDetectedConfig.yearRange}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Date Format:</span>
                  <span className="config-value value-pill">{autoDetectedConfig.dateFormat}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Combined Upload Section */}
      {uploadMode === 'combined' && (
        <div className="file-upload-section">
          <h3><FileText size={12} /> Combined File</h3>
          
          <div className="file-upload-items-grid">
            <div className="file-upload-item">
              <label className="upload-label"><FileText size={12} /> Sales File (CSV or Excel)</label>
              <div 
                {...combinedDropzone.getRootProps()} 
                className={`dropzone ${combinedDropzone.isDragActive ? 'active' : ''} ${combinedFile ? 'uploaded' : ''}`}
              >
                <input {...combinedDropzone.getInputProps()} />
                <div className="dropzone-content">
                  {combinedFile ? <CheckCircle size={18} /> : <Upload size={18} />}
                  <span className="dropzone-text">
                    {combinedFile ? 'File uploaded' : 'Drop CSV or Excel file'}
                  </span>
                </div>
              </div>
              {combinedFile && (
                <div className="file-info">
                  <span className="file-name">{combinedFile.name}</span>
                  <span className="file-size">{formatFileSize(combinedFile.size)}</span>
                  <button 
                    className="remove-file-btn"
                    onClick={() => {
                      setCombinedFile(null);
                      setDetectedSheets([]);
                    }}
                    aria-label="Remove combined file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Detected Sheets Info */}
            {detectedSheets && detectedSheets.length > 0 && (
              <div className="detected-sheets-info">
                <AlertCircle size={13} className="info-icon" />
                <span>Sheets: {detectedSheets.join(', ')}</span>
              </div>
            )}

            {/* Historical Excel */}
            <div className="file-upload-item">
              <label className="upload-label"><FileSpreadsheet size={12} /> Historical Excel (Optional)</label>
              <div 
                {...historicalDropzone.getRootProps()} 
                className={`dropzone ${historicalDropzone.isDragActive ? 'active' : ''} ${historicalFile ? 'uploaded' : ''}`}
              >
                <input {...historicalDropzone.getInputProps()} />
                <div className="dropzone-content">
                  {historicalFile ? <CheckCircle size={18} /> : <Upload size={18} />}
                  <span className="dropzone-text">
                    {historicalFile ? 'Excel loaded' : 'Historical Excel'}
                  </span>
                </div>
              </div>
              {historicalFile && (
                <div className="file-info">
                  <span className="file-name">{historicalFile.name}</span>
                  <span className="file-size">{formatFileSize(historicalFile.size)}</span>
                  <button 
                    className="remove-file-btn"
                    onClick={() => setHistoricalFile(null)}
                    aria-label="Remove historical file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            className="upload-button" 
            onClick={handleUploadAll}
            disabled={!combinedFile || isUploading}
          >
            {isUploading ? 'Processing...' : 'Load Data'}
          </button>

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.type}`}>
              {uploadStatus.message}
            </div>
          )}

          {historicalStatus && (
            <div className={`upload-status ${historicalStatus.type}`}>
              {historicalStatus.message}
            </div>
          )}
          
          {/* Auto-Detected Configuration */}
          {autoDetectedConfig && (
            <div className="auto-detected-config">
          <h4><ScanSearch size={12} /> Auto-Detected Configuration</h4>
              <div className="config-details">
                <div className="config-item">
                  <span className="config-label">Branches:</span>
                  <div className="config-value-pills">
                    {autoDetectedConfig.branches.split(',').map((branch, idx) => (
                      <span key={idx} className="value-pill">{branch.trim()}</span>
                    ))}
                  </div>
                </div>
                <div className="config-item">
                  <span className="config-label">Total Records:</span>
                  <span className="config-value">{autoDetectedConfig.totalRecords.toLocaleString()}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Unique Customers:</span>
                  <span className="config-value">{autoDetectedConfig.customers.toLocaleString()}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Year Range:</span>
                  <span className="config-value value-pill">{autoDetectedConfig.yearRange}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Date Format:</span>
                  <span className="config-value value-pill">{autoDetectedConfig.dateFormat}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
