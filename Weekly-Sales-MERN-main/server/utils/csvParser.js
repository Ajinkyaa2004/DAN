const { Readable } = require('stream');
const csv = require('csv-parser');

// Column names must match the Streamlit app's expected schema
const COLUMNS = [
  'Entity Name',
  'Branch Region',
  'Branch',
  'Division',
  'Due Date',
  'Top Level Customer ID',
  'Top Level Customer Name',
  'Customer ID',
  'Customer',
  'Billing Group ID',
  'Billing Group',
  'Invoice ID',
  'Invoice #',
  'Issue Date',
  'Total',
  'Outstanding',
  'Delivery',
  'Status',
  'Year',
  'Month',
  'Week'
];

function parseDateDayFirst(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return value;
    return null;
  }

  if (typeof value === 'number') {
    // Excel date serial number
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!Number.isNaN(date.getTime())) return date;
  }

  // Handle common formats like DD/MM/YYYY or D/M/YYYY
  const str = String(value).trim();
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const [day, month, year] = parts.map((p) => parseInt(p, 10));
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  // Fallback to native Date parsing
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function getYearFromDate(date) {
  return date instanceof Date ? date.getFullYear() : null;
}

function getMonthPeriod(date) {
  if (!(date instanceof Date)) return null;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Extract branch from a string (e.g., Entity Name, sheet name, or Branch column value)
 * Looks for NSW, QLD, or WA in the string
 */
function detectBranchFromString(str) {
  if (!str) return null;
  
  const normalized = String(str).toUpperCase();
  
  if (normalized.includes('NSW')) return 'NSW';
  if (normalized.includes('QLD')) return 'QLD';
  if (normalized.includes('WA') && !normalized.includes('WAR')) return 'WA'; // Avoid matching "WARRANTY", "AWARD", etc.
  
  return null;
}

function normalizeRow(rawRow, branchLabel) {
  const row = {};

  COLUMNS.forEach((col) => {
    const value = rawRow[col];
    row[col] = typeof value === 'string' ? value.trim() : value;
  });

  // Determine Branch: try multiple columns in order of preference
  let finalBranch = branchLabel;
  
  // 1. Try provided branchLabel (from function parameter)
  if (!finalBranch || finalBranch.trim() === '') {
    // 2. Try Entity Name column
    finalBranch = detectBranchFromString(rawRow['Entity Name']);
  }
  
  // 3. Try Branch column from raw data
  if (!finalBranch) {
    finalBranch = detectBranchFromString(rawRow.Branch || rawRow.branch);
  }
  
  // 4. Try Customer column (might have "Company Name WA/NSW/QLD")
  if (!finalBranch && rawRow.Customer) {
    finalBranch = detectBranchFromString(rawRow.Customer);
  }
  
  // 5. Try 'Top Level Customer Name' column
  if (!finalBranch && rawRow['Top Level Customer Name']) {
    finalBranch = detectBranchFromString(rawRow['Top Level Customer Name']);
  }
  
  // 6. Try Invoice # column (might have NSW/QLD/WA prefix like "NSW3984")
  if (!finalBranch && rawRow['Invoice #']) {
    finalBranch = detectBranchFromString(rawRow['Invoice #']);
  }
  
  row.Branch = finalBranch || 'UNKNOWN';

  const issueDate = parseDateDayFirst(row['Issue Date']);
  const totalStr = row.Total != null ? String(row.Total).replace(/,/g, '').trim() : '';
  const total = totalStr ? Number.parseFloat(totalStr) : NaN;

  row.IssueDate = issueDate;
  row.Year = getYearFromDate(issueDate);
  row.Month = getMonthPeriod(issueDate);
  row.Total = Number.isNaN(total) ? null : total;

  return row;
}

function filterValidRows(rows) {
  return rows.filter(
    (row) =>
      row.IssueDate instanceof Date &&
      !Number.isNaN(row.IssueDate.getTime()) &&
      typeof row.Branch === 'string' &&
      row.Branch.trim() !== '' &&
      typeof row.Total === 'number' &&
      !Number.isNaN(row.Total),
  );
}

function parseCsvBuffer(buffer, branchLabel) {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      resolve([]);
      return;
    }

    const rows = [];
    const stream = Readable.from(buffer.toString('utf8'));

    stream
      .pipe(
        csv({
          headers: COLUMNS,
          skipLines: 0,
        }),
      )
      .on('data', (data) => {
        rows.push(normalizeRow(data, branchLabel));
      })
      .on('end', () => {
        resolve(filterValidRows(rows));
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Parse and merge NSW, QLD, and WA CSV buffers.
 * Each argument is an optional multer file object (may be undefined).
 */
async function parseAndMergeBranchCsvs({ nswFile, qldFile, waFile }) {
  const [nswRows, qldRows, waRows] = await Promise.all([
    parseCsvBuffer(nswFile && nswFile.buffer, 'NSW'),
    parseCsvBuffer(qldFile && qldFile.buffer, 'QLD'),
    parseCsvBuffer(waFile && waFile.buffer, 'WA'),
  ]);

  return [...nswRows, ...qldRows, ...waRows];
}

/**
 * Parse a combined CSV or Excel file that already has a Branch column.
 * For CSV: expects all COLUMNS to be present including a Branch column
 * For Excel: reads all sheets and combines them
 */
async function parseCombinedFile(file) {
  if (!file || !file.buffer) {
    throw new Error('No file provided');
  }

  const fileName = file.originalname || '';
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  if (isExcel) {
    // Use XLSX to parse Excel file
    const XLSX = require('xlsx');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const allRows = [];

    console.log('📋 Excel sheets found:', workbook.SheetNames);

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

      console.log(`\n🔍 Processing sheet: "${sheetName}"`);
      console.log(`   Rows in sheet: ${jsonData.length}`);
      
      // Log first row to see column structure
      if (jsonData.length > 0) {
        const firstRow = jsonData[0];
        console.log(`   Columns found:`, Object.keys(firstRow));
        console.log(`   Sample Branch value:`, firstRow.Branch || firstRow.branch || '(no Branch column)');
      }

      // Normalize each row
      jsonData.forEach((rawRow, index) => {
        // For combined files, let normalizeRow detect branch from Entity Name or Branch column
        // Don't force a branchLabel based on sheet name unless it's clearly a branch sheet
        let branchLabel = null;
        
        // First check if Branch column has a value
        if (rawRow.Branch && String(rawRow.Branch).trim() !== '') {
          branchLabel = detectBranchFromString(rawRow.Branch);
        }
        
        // If no Branch column value, try Entity Name
        if (!branchLabel && rawRow['Entity Name']) {
          branchLabel = detectBranchFromString(rawRow['Entity Name']);
        }
        
        // Fallback: try sheet name (for separate branch sheets)
        if (!branchLabel) {
          branchLabel = detectBranchFromString(sheetName);
        }
        
        // Log first few branch detections for debugging
        if (index < 3) {
          console.log(`   Row ${index}: Entity="${rawRow['Entity Name']?.substring(0, 30)}", Branch col="${rawRow.Branch || '(empty)'}", Detected="${branchLabel}"`);
        }

        const normalizedRow = normalizeRow(rawRow, branchLabel);
        allRows.push(normalizedRow);
      });
    }

    return filterValidRows(allRows);
  } else {
    // Parse as CSV with Branch column
    return new Promise((resolve, reject) => {
      const rows = [];
      const stream = Readable.from(file.buffer.toString('utf8'));

      stream
        .pipe(csv())
        .on('data', (data) => {
          // Let normalizeRow detect branch from Entity Name or Branch column
          // Don't hardcode UNKNOWN here
          let branchLabel = null;
          
          // Try Branch column first
          if (data.Branch && String(data.Branch).trim() !== '') {
            branchLabel = detectBranchFromString(data.Branch);
          }
          
          // If empty, try Entity Name column
          if (!branchLabel && data['Entity Name']) {
            branchLabel = detectBranchFromString(data['Entity Name']);
          }
          
          rows.push(normalizeRow(data, branchLabel));
        })
        .on('end', () => {
          resolve(filterValidRows(rows));
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}

module.exports = {
  COLUMNS,
  parseAndMergeBranchCsvs,
  parseCombinedFile,
};

