import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  BarChart3,
  TrendingUp,
  Loader,
  Database,
  Info
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const BUSINESS_COMPASS_URL = process.env.REACT_APP_BUSINESS_COMPASS_URL || 'http://localhost:3000';
const SALES_ANALYSIS_URL = process.env.REACT_APP_SALES_ANALYSIS_URL || 'http://localhost:3002';

function App() {
  const [uploadMode, setUploadMode] = useState('combined'); // 'combined' or 'separate'
  const [nswFile, setNswFile] = useState(null);
  const [qldFile, setQldFile] = useState(null);
  const [waFile, setWaFile] = useState(null);
  const [combinedFile, setCombinedFile] = useState(null);
  const [historicalFile, setHistoricalFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Dropzone callbacks
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
    if (acceptedFiles.length > 0) setCombinedFile(acceptedFiles[0]);
  }, []);

  const onDropHistorical = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setHistoricalFile(acceptedFiles[0]);
  }, []);

  // Dropzone configurations
  const nswDropzone = useDropzone({ 
    onDrop: onDropNSW, 
    accept: { 'text/csv': ['.csv'] }, 
    multiple: false 
  });
  
  const qldDropzone = useDropzone({ 
    onDrop: onDropQLD, 
    accept: { 'text/csv': ['.csv'] }, 
    multiple: false 
  });
  
  const waDropzone = useDropzone({ 
    onDrop: onDropWA, 
    accept: { 'text/csv': ['.csv'] }, 
    multiple: false 
  });
  
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

  // Remove file handlers
  const removeFile = (fileType) => {
    switch(fileType) {
      case 'nsw': setNswFile(null); break;
      case 'qld': setQldFile(null); break;
      case 'wa': setWaFile(null); break;
      case 'combined': setCombinedFile(null); break;
      case 'historical': setHistoricalFile(null); break;
      default: break;
    }
  };

  // Validate files
  const validateFiles = () => {
    if (uploadMode === 'combined') {
      if (!combinedFile) {
        return { valid: false, message: 'Please upload a combined CSV/Excel file' };
      }
    } else {
      if (!nswFile || !qldFile || !waFile) {
        return { valid: false, message: 'Please upload all 3 branch CSV files (NSW, QLD, WA)' };
      }
    }
    
    // Historical file is optional but recommended
    if (!historicalFile) {
      return { valid: true, warning: 'Historical data not uploaded. Some features may be limited.' };
    }
    
    return { valid: true };
  };

  // Handle upload
  const handleUpload = async () => {
    const validation = validateFiles();
    
    if (!validation.valid) {
      setUploadStatus({ type: 'error', message: validation.message });
      return;
    }

    if (validation.warning) {
      setUploadStatus({ type: 'warning', message: validation.warning });
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Uploading files...' });

    try {
      const formData = new FormData();
      formData.append('uploadMode', uploadMode);

      if (uploadMode === 'combined') {
        formData.append('combined', combinedFile);
      } else {
        formData.append('nsw', nswFile);
        formData.append('qld', qldFile);
        formData.append('wa', waFile);
      }

      if (historicalFile) {
        formData.append('historical', historicalFile);
      }

      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 second timeout
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setUploadStatus({ 
          type: 'success', 
          message: `Files uploaded successfully!`
        });
        
        // Store session ID in localStorage for easy access
        localStorage.setItem('dashboardSessionId', response.data.sessionId);
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload files';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - files may be too large';
      } else if (error.response) {
        errorMessage = error.response.data?.error || error.message;
      } else if (error.request) {
        errorMessage = 'Cannot connect to backend. Please ensure the server is running.';
      }
      
      setUploadStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  // Open dashboard in new tab
  const openDashboard = (dashboardType) => {
    if (!sessionId) {
      setUploadStatus({ type: 'error', message: 'Please upload files first!' });
      return;
    }

    const url = dashboardType === 'business-compass' 
      ? `${BUSINESS_COMPASS_URL}/setup?sessionId=${sessionId}` 
      : `${SALES_ANALYSIS_URL}?sessionId=${sessionId}`;
    
    window.open(url, '_blank');
  };

  // Check if files are ready
  const filesReady = uploadMode === 'combined' 
    ? combinedFile !== null 
    : (nswFile && qldFile && waFile);

  return (
    <div className="app-container">
      <div className="landing-page">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <Database size={24} />
          </div>
          <h1 className="header-title">DAN Dashboard Suite</h1>
          <p className="header-subtitle">Upload your data once, analyze across multiple dashboards</p>
        </div>

        {/* Upload Mode Toggle */}
        <div className="upload-mode-toggle">
          <button 
            className={`mode-btn ${uploadMode === 'combined' ? 'active' : ''}`}
            onClick={() => setUploadMode('combined')}
          >
            <FileSpreadsheet size={16} />
            Combined File
          </button>
          <button 
            className={`mode-btn ${uploadMode === 'separate' ? 'active' : ''}`}
            onClick={() => setUploadMode('separate')}
          >
            <FileText size={16} />
            Separate Files
          </button>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          {uploadMode === 'combined' ? (
            <div className="dropzone-container">
              <div 
                {...combinedDropzone.getRootProps()} 
                className={`dropzone ${combinedFile ? 'has-file' : ''}`}
              >
                <input {...combinedDropzone.getInputProps()} />
                {combinedFile ? (
                  <div className="file-info">
                    <FileSpreadsheet size={20} />
                    <span>{combinedFile.name}</span>
                    <button 
                      className="remove-btn" 
                      onClick={(e) => { e.stopPropagation(); removeFile('combined'); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-placeholder">
                    <Upload size={28} />
                    <p>Drop combined CSV/Excel file here</p>
                    <span>or click to browse</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="dropzone-grid">
              {/* NSW */}
              <div 
                {...nswDropzone.getRootProps()} 
                className={`dropzone ${nswFile ? 'has-file' : ''}`}
              >
                <input {...nswDropzone.getInputProps()} />
                {nswFile ? (
                  <div className="file-info">
                    <FileText size={20} />
                    <span>{nswFile.name}</span>
                    <button 
                      className="remove-btn" 
                      onClick={(e) => { e.stopPropagation(); removeFile('nsw'); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-placeholder">
                    <Upload size={28} />
                    <p>NSW CSV</p>
                  </div>
                )}
              </div>

              {/* QLD */}
              <div 
                {...qldDropzone.getRootProps()} 
                className={`dropzone ${qldFile ? 'has-file' : ''}`}
              >
                <input {...qldDropzone.getInputProps()} />
                {qldFile ? (
                  <div className="file-info">
                    <FileText size={20} />
                    <span>{qldFile.name}</span>
                    <button 
                      className="remove-btn" 
                      onClick={(e) => { e.stopPropagation(); removeFile('qld'); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-placeholder">
                    <Upload size={24} />
                    <p>QLD CSV</p>
                  </div>
                )}
              </div>

              {/* WA */}
              <div 
                {...waDropzone.getRootProps()} 
                className={`dropzone ${waFile ? 'has-file' : ''}`}
              >
                <input {...waDropzone.getInputProps()} />
                {waFile ? (
                  <div className="file-info">
                    <FileText size={20} />
                    <span>{waFile.name}</span>
                    <button 
                      className="remove-btn" 
                      onClick={(e) => { e.stopPropagation(); removeFile('wa'); }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-placeholder">
                    <Upload size={28} />
                    <p>WA CSV</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historical File */}
          <div className="historical-section">
            <h3>
              <FileSpreadsheet size={14} />
              Historical Data (Optional)
            </h3>
            <div 
              {...historicalDropzone.getRootProps()} 
              className={`dropzone ${historicalFile ? 'has-file' : ''}`}
            >
              <input {...historicalDropzone.getInputProps()} />
              {historicalFile ? (
                <div className="file-info">
                  <FileSpreadsheet size={20} />
                  <span>{historicalFile.name}</span>
                  <button 
                    className="remove-btn" 
                    onClick={(e) => { e.stopPropagation(); removeFile('historical'); }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <Upload size={28} />
                  <p>Drop historical Excel file here</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <button 
            className="upload-btn"
            onClick={handleUpload}
            disabled={!filesReady || isUploading}
          >
            {isUploading ? (
              <>
                <Loader size={18} className="spinner" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Files
              </>
            )}
          </button>

          {/* Status Message */}
          {uploadStatus && (
            <div className={`status-message ${uploadStatus.type}`}>
              {uploadStatus.type === 'success' && <CheckCircle size={16} />}
              {uploadStatus.type === 'error' && <AlertCircle size={16} />}
              {uploadStatus.type === 'warning' && <AlertCircle size={16} />}
              {uploadStatus.type === 'info' && <Loader size={16} className="spinner" />}
              <span>{uploadStatus.message}</span>
            </div>
          )}
        </div>

        {/* Dashboard Buttons */}
        {sessionId && (
          <div className="dashboard-buttons">
            <button 
              className="dashboard-btn business-compass"
              onClick={() => openDashboard('business-compass')}
            >
              <BarChart3 size={20} />
              <div>
                <h4>Business Compass</h4>
                <p>Strategic business insights</p>
              </div>
            </button>
            <button 
              className="dashboard-btn sales-analysis"
              onClick={() => openDashboard('sales-analysis')}
            >
              <TrendingUp size={20} />
              <div>
                <h4>Sales Analysis</h4>
                <p>Detailed sales trends</p>
              </div>
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h3>
            <Info size={14} />
            How to Use
          </h3>
          <ol>
            <li>Choose upload mode: Combined file or Separate files (NSW, QLD, WA)</li>
            <li>Upload your CSV files and optional historical data</li>
            <li>Click "Upload Files" to process your data</li>
            <li>Select which dashboard to analyze your data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
