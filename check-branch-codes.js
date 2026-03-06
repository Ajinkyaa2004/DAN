// Find all unique branch codes in the CSV
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const branchPattern = /\(([A-Z]{2,3})\)/;
const branchCounts = {};

records.forEach(row => {
  const entity = String(row['Entity Name'] || '').trim();
  const match = entity.match(branchPattern);
  
  if (match && match[1]) {
    const code = match[1];
    branchCounts[code] = (branchCounts[code] || 0) + 1;
  } else if (entity) {
    branchCounts['__NO_CODE__'] = (branchCounts['__NO_CODE__'] || 0) + 1;
  }
});

console.log('Branch code distribution:');
Object.entries(branchCounts).sort(([a], [b]) => a.localeCompare(b)).forEach(([code, count]) => {
  console.log(`  ${code}: ${count.toLocaleString()} rows`);
});

const total = Object.values(branchCounts).reduce((sum, c) => sum + c, 0);
console.log(`\nTotal: ${total.toLocaleString()} rows`);
console.log(`Expected: ${records.length.toLocaleString()} rows`);
console.log(`Missing: ${records.length - total} rows`);
