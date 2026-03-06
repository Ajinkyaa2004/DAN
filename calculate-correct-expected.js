// Calculate correct expected values excluding invalid revenues
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const branchPattern = /\(([A-Z]{2,3})\)/;
const branchData = {
  'NSW': { totalRevenue: 0, validRows: 0, invalidRows: 0, invalidRevenue: 0 },
  'QLD': { totalRevenue: 0, validRows: 0, invalidRows: 0, invalidRevenue: 0 },
  'WA': { totalRevenue: 0, validRows: 0, invalidRows: 0, invalidRevenue: 0 }
};

records.forEach((row, idx) => {
  const entity = String(row['Entity Name'] || '').trim();
  const revenueStr = String(row['Total'] || '0').replace(/[,$]/g, '').trim();
  const revenue = parseFloat(revenueStr);
  
  const match = entity.match(branchPattern);
  let branch;
  
  if (match && match[1]) {
    branch = match[1];
  } else if (entity) {
    branch = 'WA';
  } else {
    return; // Skip empty entities
  }
  
  if (isNaN(revenue) || revenue <= 0) {
    branchData[branch].invalidRows++;
    branchData[branch].invalidRevenue += (revenue || 0);
  } else {
    branchData[branch].validRows++;
    branchData[branch].totalRevenue += revenue;
  }
});

console.log('CORRECT EXPECTED VALUES (excluding invalid revenues):\n');
Object.entries(branchData).forEach(([branch, data]) => {
  console.log(`${branch}:`);
  console.log(`  Valid rows:      ${data.validRows.toLocaleString()}`);
  console.log(`  Valid revenue:   $${data.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  Invalid rows:    ${data.invalidRows} rows (excluded)`);
  console.log(`  Invalid revenue: $${data.invalidRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (excluded)`);
  console.log('');
});

const totalValidRevenue = Object.values(branchData).reduce((sum, d) => sum + d.totalRevenue, 0);
const totalValidRows = Object.values(branchData).reduce((sum, d) => sum + d.validRows, 0);
console.log(`Total valid: ${totalValidRows.toLocaleString()} rows, $${totalValidRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);

// Now compare with filtering results
console.log('\n' + '='.repeat(60));
console.log('COMPARISON WITH FILTERING TEST RESULTS:');
console.log('='.repeat(60) + '\n');

const filteringResults = {
  'NSW': { rows: 3883, revenue: 11038302.25 },
  'QLD': { rows: 4281, revenue: 12029248.73 },
  'WA': { rows: 54550, revenue: 205400302.22 }
};

Object.entries(branchData).forEach(([branch, expected]) => {
  const actual = filteringResults[branch];
  const rowDiff = actual.rows - expected.validRows;
  const revDiff = actual.revenue - expected.totalRevenue;
  
  console.log(`${branch}:`);
  console.log(`  Expected: ${expected.validRows} rows, $${expected.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  Actual:   ${actual.rows} rows, $${actual.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  
  if (rowDiff === 0 && Math.abs(revDiff) < 0.01) {
    console.log(`  ✅ MATCH!`);
  } else {
    console.log(`  ❌ MISMATCH: ${rowDiff} rows, $${revDiff.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} revenue difference`);
  }
  console.log('');
});
