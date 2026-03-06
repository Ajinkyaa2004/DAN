const express = require('express');
const multer = require('multer');
const { parseAndMergeBranchCsvs, parseCombinedFile } = require('../utils/csvParser');
const { parseHistoricalExcel } = require('../utils/historicalParser');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// POST /api/upload/csv
// Supports two modes:
// 1. Separate files: nsw, qld, wa (CSV files)
// 2. Combined file: combined (CSV or Excel file with Branch column)
router.post(
  '/upload/csv',
  upload.fields([
    { name: 'nsw', maxCount: 1 },
    { name: 'qld', maxCount: 1 },
    { name: 'wa', maxCount: 1 },
    { name: 'combined', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('=== CSV Upload Request ===');
      const nswFile = (req.files.nsw && req.files.nsw[0]) || undefined;
      const qldFile = (req.files.qld && req.files.qld[0]) || undefined;
      const waFile = (req.files.wa && req.files.wa[0]) || undefined;
      const combinedFile = (req.files.combined && req.files.combined[0]) || undefined;

      console.log('Files received:', {
        nsw: nswFile?.originalname,
        qld: qldFile?.originalname,
        wa: waFile?.originalname,
        combined: combinedFile?.originalname
      });

      let mergedRows = [];

      // Check if combined file is uploaded
      if (combinedFile) {
        console.log('Processing combined file:', combinedFile.originalname);
        mergedRows = await parseCombinedFile(combinedFile);
        console.log('Combined file parsed successfully, rows:', mergedRows.length);
      } else if (nswFile || qldFile || waFile) {
        // Check if all three separate files are uploaded
        if (!nswFile || !qldFile || !waFile) {
          return res.status(400).json({
            error: 'Please upload all 3 CSV files: NSW, QLD, and WA.',
          });
        }
        console.log('Processing separate CSV files');
        mergedRows = await parseAndMergeBranchCsvs({ nswFile, qldFile, waFile });
        console.log('Separate files parsed successfully, rows:', mergedRows.length);
      } else {
        return res.status(400).json({
          error: 'Please upload either a combined file or all 3 separate CSV files.',
        });
      }

      // Log branch distribution for debugging
      const branchCounts = {};
      mergedRows.forEach(row => {
        branchCounts[row.Branch] = (branchCounts[row.Branch] || 0) + 1;
      });

      console.log('=== CSV Upload Success ===');
      console.log(`📊 Branch distribution:`, branchCounts);
      return res.json({ rows: mergedRows });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error parsing CSV upload:', err);
      console.error('Error stack:', err.stack);
      return res.status(500).json({ error: err.message || 'Failed to parse files.' });
    }
  },
);

// POST /api/upload/historical
// Field: historical (Excel file)
router.post(
  '/upload/historical',
  upload.single('historical'),
  (req, res) => {
    try {
      console.log('=== Historical Upload Request ===');
      console.log('File received:', req.file?.originalname);

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'Historical Excel file is required.' });
      }

      const rows = parseHistoricalExcel(req.file.buffer);
      console.log('Historical file parsed successfully, rows:', rows.length);
      console.log('=== Historical Upload Success ===');
      return res.json({ rows });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error parsing historical Excel:', err);
      console.error('Error stack:', err.stack);
      return res.status(500).json({ error: err.message || 'Failed to parse historical Excel file.' });
    }
  },
);

module.exports = router;

