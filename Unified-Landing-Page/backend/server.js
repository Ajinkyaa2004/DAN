const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// In-memory storage for uploaded files (for simplicity and easy deployment)
// For production, consider using Redis or a database
const fileStorage = new Map();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// CORS configuration - use environment variable in production
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : '*';

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shared storage backend is running',
    activeSessions: fileStorage.size
  });
});

// Upload files endpoint
app.post('/api/upload', upload.fields([
  { name: 'nsw', maxCount: 1 },
  { name: 'qld', maxCount: 1 },
  { name: 'wa', maxCount: 1 },
  { name: 'combined', maxCount: 1 },
  { name: 'historical', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('=== File Upload Request ===');

    const sessionId = uuidv4();
    const files = {};

    // Store uploaded files in memory
    if (req.files) {
      if (req.files.nsw) {
        files.nsw = {
          buffer: req.files.nsw[0].buffer,
          originalname: req.files.nsw[0].originalname,
          mimetype: req.files.nsw[0].mimetype,
          size: req.files.nsw[0].size
        };
      }
      if (req.files.qld) {
        files.qld = {
          buffer: req.files.qld[0].buffer,
          originalname: req.files.qld[0].originalname,
          mimetype: req.files.qld[0].mimetype,
          size: req.files.qld[0].size
        };
      }
      if (req.files.wa) {
        files.wa = {
          buffer: req.files.wa[0].buffer,
          originalname: req.files.wa[0].originalname,
          mimetype: req.files.wa[0].mimetype,
          size: req.files.wa[0].size
        };
      }
      if (req.files.combined) {
        files.combined = {
          buffer: req.files.combined[0].buffer,
          originalname: req.files.combined[0].originalname,
          mimetype: req.files.combined[0].mimetype,
          size: req.files.combined[0].size
        };
      }
      if (req.files.historical) {
        files.historical = {
          buffer: req.files.historical[0].buffer,
          originalname: req.files.historical[0].originalname,
          mimetype: req.files.historical[0].mimetype,
          size: req.files.historical[0].size
        };
      }
    }

    // Store with session ID
    fileStorage.set(sessionId, {
      files,
      uploadMode: req.body.uploadMode || 'separate',
      timestamp: new Date().toISOString(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    console.log(`Session ${sessionId} created with files:`, Object.keys(files));

    res.json({
      success: true,
      sessionId,
      uploadedFiles: Object.keys(files),
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get files by session ID
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!fileStorage.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found or expired'
    });
  }

  const session = fileStorage.get(sessionId);

  // Check if expired
  if (Date.now() > session.expiresAt) {
    fileStorage.delete(sessionId);
    return res.status(410).json({
      success: false,
      error: 'Session expired'
    });
  }

  // Return file metadata (not buffers)
  const metadata = {
    uploadMode: session.uploadMode,
    timestamp: session.timestamp,
    files: {}
  };

  Object.keys(session.files).forEach(key => {
    metadata.files[key] = {
      originalname: session.files[key].originalname,
      mimetype: session.files[key].mimetype,
      size: session.files[key].size
    };
  });

  res.json({
    success: true,
    session: metadata
  });
});

// Download specific file from session
app.get('/api/session/:sessionId/file/:filename', (req, res) => {
  const { sessionId, filename } = req.params;

  if (!fileStorage.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  const session = fileStorage.get(sessionId);

  if (!session.files[filename]) {
    return res.status(404).json({
      success: false,
      error: 'File not found in session'
    });
  }

  const file = session.files[filename];

  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
  res.send(file.buffer);
});

// Get all files as FormData (for forwarding to dashboards)
app.post('/api/session/:sessionId/forward', (req, res) => {
  const { sessionId } = req.params;

  if (!fileStorage.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  const session = fileStorage.get(sessionId);

  // Return files as JSON with base64 encoded buffers
  const filesData = {};
  Object.keys(session.files).forEach(key => {
    filesData[key] = {
      data: session.files[key].buffer.toString('base64'),
      originalname: session.files[key].originalname,
      mimetype: session.files[key].mimetype
    };
  });

  res.json({
    success: true,
    uploadMode: session.uploadMode,
    files: filesData
  });
});

// Cleanup expired sessions every hour
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;

  for (const [sessionId, session] of fileStorage.entries()) {
    if (now > session.expiresAt) {
      fileStorage.delete(sessionId);
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired sessions`);
  }
}, 60 * 60 * 1000); // Every hour

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Shared storage backend running on port ${PORT}`);
  console.log(`📦 Health check: http://localhost:${PORT}/health`);
});

// Export for other uses
module.exports = app;
