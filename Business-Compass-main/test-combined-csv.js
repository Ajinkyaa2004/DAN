const fs = require('fs');
const Papa = require('papaparse');

console.log('\n🔍 TESTING COMBINED CSV DETECTION\n');
console.log('='.repeat(60));

// Read the combined CSV file
const csvContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf-8');
const parsed = Papa.parse(csvContent, { header: true });

console.log(`\n📊 Total rows: ${parsed.data.length.toLocaleString()}`);

// Check Entity Name column
const entityNameCol = 'Entity Name';
const entityNameValues = new Map();
let rowsWithNSW = 0;
let rowsWithQLD = 0;
let rowsWithoutCode = 0;

parsed.data.forEach(row => {
  const entityName = String(row[entityNameCol] || '').trim();
  if (!entityName) return;
  
  entityNameValues.set(entityName, (entityNameValues.get(entityName) || 0) + 1);
  
  // Extract branch code
  const match = entityName.match(/\(([A-Z]{2,3})\)/);
  if (match && match[1]) {
    if (match[1] === 'NSW') rowsWithNSW++;
    else if (match[1] === 'QLD') rowsWithQLD++;
  } else {
    rowsWithoutCode++;
  }
});

console.log('\n📋 Entity Name Distribution:');
Array.from(entityNameValues.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([name, count]) => {
    console.log(`  ${name}: ${count.toLocaleString()} rows`);
  });

console.log('\n🔤 Branch Code Extraction Results:');
console.log(`  NSW (explicit code): ${rowsWithNSW.toLocaleString()} rows`);
console.log(`  QLD (explicit code): ${rowsWithQLD.toLocaleString()} rows`);
console.log(`  WA (no code): ${rowsWithoutCode.toLocaleString()} rows`);
console.log(`  Total: ${(rowsWithNSW + rowsWithQLD + rowsWithoutCode).toLocaleString()} rows`);

console.log('\n✅ Expected Behavior:');
console.log('  - System detects Entity Name column with embedded codes');
console.log('  - NSW rows: 3,883 (explicit "(NSW)" code)');
console.log('  - QLD rows: 4,343 (explicit "(QLD)" code)');
console.log('  - WA rows: 54,553 (no code → default to WA)');
console.log('  - Total: 62,779 data rows');

console.log('\n' + '='.repeat(60) + '\n');
