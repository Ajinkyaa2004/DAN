// Check the revenue for duplicate invoice 53242
const fs = require('fs');
const { parse } = require('csv-parse/sync');

console.log('=== ANALYZING DUPLICATE INVOICE 53242 ===\n');

// Check NSW.csv
console.log('NSW.csv:');
const nswContent = fs.readFileSync('NSW.csv', 'utf8');
const nswRecords = parse(nswContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const nswInv53242 = nswRecords.filter(row => String(row['Invoice ID']).trim() === '53242');
console.log(`  Found ${nswInv53242.length} occurrence(s) of invoice 53242`);
nswInv53242.forEach((row, idx) => {
  console.log(`    Occurrence ${idx + 1}:`);
  console.log(`      Total: $${row['Total']}`);
  console.log(`      Outstanding: $${row['Outstanding']}`);
  console.log(`      Issue Date: ${row['Issue Date']}`);
});

// Check combined CSV
console.log('\nRAW_ALL BRANCES_COMBINED.csv (NSW rows):');
const combinedContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');
const combinedRecords = parse(combinedContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const branchPattern = /\(([A-Z]{2,3})\)/;
const combinedInv53242 = combinedRecords.filter((row, idx) => {
  const entity = String(row['Entity Name'] || '').trim();
  const invoiceId = String(row['Invoice ID']).trim();
  const match = entity.match(branchPattern);
  const branch = match && match[1] ? match[1] : null;
  
  return invoiceId === '53242' && branch === 'NSW';
});

console.log(`  Found ${combinedInv53242.length} occurrence(s) of invoice 53242 in NSW rows`);
combinedInv53242.forEach((row, idx) => {
  const rowNum = combinedRecords.findIndex(r => 
    r['Invoice ID'] === row['Invoice ID'] && 
    r['Total'] === row['Total'] &&
    r['Issue Date'] === row['Issue Date']
  ) + 1;
  
  console.log(`    Occurrence ${idx + 1} (Row ${rowNum}):`);
  console.log(`      Total: $${row['Total']}`);
  console.log(`      Outstanding: $${row['Outstanding']}`);
  console.log(`      Issue Date: ${row['Issue Date']}`);
  console.log(`      Entity: ${row['Entity Name']}`);
});

// Calculate revenue difference
const nswTotal = nswInv53242.reduce((sum, row) => {
  const val = parseFloat(String(row['Total']).replace(/[,$]/g, ''));
  return sum + (isNaN(val) ? 0 : val);
}, 0);

const combinedTotal = combinedInv53242.reduce((sum, row) => {
  const val = parseFloat(String(row['Total']).replace(/[,$]/g, ''));
  return sum + (isNaN(val) ? 0 : val);
}, 0);

console.log('\nRevenue comparison for invoice 53242:');
console.log(`  NSW.csv total for this invoice: $${nswTotal.toFixed(2)}`);
console.log(`  Combined CSV total for this invoice (all duplicates): $${combinedTotal.toFixed(2)}`);
console.log(`  After deduplication (keeping 1): $${(combinedTotal / combinedInv53242.length).toFixed(2)} (average)`);

// Calculate the full NSW revenue difference
const nswRevenue = nswRecords.reduce((sum, row) => {
  const val = parseFloat(String(row['Total']).replace(/[,$]/g, ''));
  return sum + (isNaN(val) || val <= 0 ? 0 : val);
}, 0);

const combinedNswRevenue = combinedRecords.reduce((sum, row) => {
  const entity = String(row['Entity Name'] || '').trim();
  const match = entity.match(branchPattern);
  const branch = match && match[1] ? match[1] : null;
  
  if (branch !== 'NSW') return sum;
  
  const val = parseFloat(String(row['Total']).replace(/[,$]/g, ''));
  return sum + (isNaN(val) || val <= 0 ? 0 : val);
}, 0);

console.log('\nFull NSW revenue comparison:');
console.log(`  NSW.csv: $${nswRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
console.log(`  Combined CSV (with duplicates): $${combinedNswRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
console.log(`  Difference: $${(combinedNswRevenue - nswRevenue).toLocaleString('en-US', {minimumFractionDigits: 2})}`);
