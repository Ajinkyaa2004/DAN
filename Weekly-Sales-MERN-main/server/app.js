const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase payload limit for large datasets
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Weekly sales API is running' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test GET route works!' });
});

app.post('/api/test', (req, res) => {
  res.json({ message: 'Test POST route works!' });
});

// API routes
app.use('/api', uploadRoutes);
app.use('/api', analysisRoutes);

// Fallback for unknown routes (useful during development)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

// Export for testing/other uses
module.exports = app;
