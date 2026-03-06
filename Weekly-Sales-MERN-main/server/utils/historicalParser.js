const XLSX = require('xlsx');

/**
 * Detect if a column header looks like a financial year (e.g., "18/19", "2018/19")
 */
function isFinancialYearHeader(val) {
  return typeof val === 'string' && val.includes('/');
}

function toNumberOrNull(value) {
  if (value == null) return null;
  const str = String(value).replace(/,/g, '').trim();
  if (!str) return null;
  const num = Number.parseFloat(str);
  return Number.isNaN(num) ? null : num;
}

function parseWeekLabelToNumber(weekLabel) {
  if (!weekLabel) return null;
  const str = String(weekLabel);
  const match = str.match(/Week\s+(\d+)/i);
  if (!match) return null;
  const num = Number.parseInt(match[1], 10);
  return Number.isNaN(num) ? null : num;
}

/**
 * Port of load_historical_sales_data from app.py.
 * Accepts a single Excel buffer and returns an array of:
 * { Week, FinancialYear, Total, Branch }
 * 
 * Dynamically reads ALL sheets in the workbook (no hardcoded sheet names)
 */
function parseHistoricalExcel(buffer) {
  if (!buffer) return [];

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const allRows = [];

  // Iterate over ALL sheets in the workbook dynamically
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!Array.isArray(rawData) || rawData.length < 3) return;

    const headerRow0 = rawData[0] || [];

    // indices of header cells that look like financial years (contain '/')
    const salesYearIndices = headerRow0
      .map((val, idx) => ({ val, idx }))
      .filter(({ val }) => isFinancialYearHeader(val))
      .map(({ idx }) => idx);

    if (!salesYearIndices.length) return;

    const dataColumnsToSelect = [0, ...salesYearIndices];

    // Build column names: Week + financial years
    const yearColumnNames = salesYearIndices.map((idx) => String(headerRow0[idx]).trim());

    // Data rows start from index 2 (third row)
    const dataRows = rawData.slice(2);

    dataRows.forEach((row) => {
      const selected = dataColumnsToSelect.map((colIndex) => row[colIndex]);
      const [weekLabel, ...yearValues] = selected;

      // Filter out summary rows like "Q1 Total", "Totals", etc.
      const weekNumber = parseWeekLabelToNumber(weekLabel);
      if (!weekNumber) return;

      yearValues.forEach((val, idx) => {
        const total = toNumberOrNull(val);
        if (total == null) return;

        allRows.push({
          Week: weekNumber,
          FinancialYear: yearColumnNames[idx],
          Total: total,
          Branch: sheetName,
        });
      });
    });
  });

  return allRows;
}

module.exports = {
  parseHistoricalExcel,
};

