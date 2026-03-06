// Proper CSV test with correct parsing
const fs = require('fs');
const { parse } = require('csv-parse/sync');

console.log('Reading CSV file...\n');
const csvContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');

// Parse CSV properly
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const header = Object.keys(records[0]);
console.log('Column headers:', header);
console.log('\nTotal data rows:', records.length);

// Find the Entity Name and Total columns
const entityCol = header.find(h => h.toLowerCase().includes('entity') || h === 'Entity Name') || header[0];
const totalCol = header.find(h => h.toLowerCase() === 'total') || 'Total';

console.log('\nUsing columns:');
console.log('  Entity:', entityCol);
console.log('  Revenue:', totalCol);

// Branch detection simulation
const branchPattern = /\(([A-Z]{2,3})\)/;
const detectedBranches = new Set();
let rowsWithCodes = 0;
let rowsWithoutCodes = 0;

records.forEach(row => {
  const entity = String(row[entityCol] || '').trim();
  const match = entity.match(branchPattern);
  if (match && match[1]) {
    detectedBranches.add(match[1]);
    rowsWithCodes++;
  } else if (entity) {
    rowsWithoutCodes++;
  }
});

const branches = Array.from(detectedBranches);
if (rowsWithoutCodes > 0) {
  branches.push('__NO_CODE__');
}

console.log(`\nBranch detection result:`);
console.log(`  Detected branches: [${branches.join(', ')}]`);
console.log(`  Rows with explicit codes: ${rowsWithCodes}`);
console.log(`  Rows without codes: ${rowsWithoutCodes}`);

// Simulate 3-file upload (same file 3 times)
const uploads = ['NSW', 'QLD', 'WA'];
const explicitBranches = branches.filter(b => b !== '__NO_CODE__');

console.log(`\nSimulating combined file upload (3x):`);
console.log(`  Explicit branches: [${explicitBranches.join(', ')}]`);

const results = {};

uploads.forEach(expectedBranch => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing ${expectedBranch} iteration`);
  console.log('='.repeat(60));
  
  let included = [];
  let filtered = [];
  let invalid = 0;
  
  records.forEach((row, idx) => {
    const entity = String(row[entityCol] || '').trim();
    const revenueStr = String(row[totalCol] || '0').replace(/[,$]/g, '').trim();
    const revenue = parseFloat(revenueStr);
    
    // Skip invalid revenue
    if (isNaN(revenue) || revenue <= 0) {
      invalid++;
      return;
    }
    
    // Extract branch code
    const match = entity.match(branchPattern);
    let extractedBranch = null;
    let hasExplicitCode = false;
    
    if (match && match[1]) {
      extractedBranch = match[1].toUpperCase();
      hasExplicitCode = true;
    } else if (entity) {
      hasExplicitCode = false;
    }
    
    // Filtering logic (EXACT copy from csv-parser.ts)
    let shouldInclude = false;
    
    if (hasExplicitCode && extractedBranch) {
      // Row has explicit code - include only if matches
      shouldInclude = extractedBranch === expectedBranch.toUpperCase();
    } else if (!hasExplicitCode) {
      // Row has NO explicit code
      const currentBranchHasCode = explicitBranches.some(b => b.toUpperCase() === expectedBranch.toUpperCase());
      shouldInclude = !currentBranchHasCode;
    }
    
    if (shouldInclude) {
      included.push({ idx, entity, revenue, code: extractedBranch || 'NONE' });
    } else {
      filtered.push({ idx, entity, revenue, code: extractedBranch || 'NONE' });
    }
  });
  
  const includedRevenue = included.reduce((sum, r) => sum + r.revenue, 0);
  const filteredRevenue = filtered.reduce((sum, r) => sum + r.revenue, 0);
  
  results[expectedBranch] = {
    included: included.length,
    includedRevenue,
    filtered: filtered.length,
    filteredRevenue,
    invalid
  };
  
  console.log(`\nResults for ${expectedBranch}:`);
  console.log(`  ✅ Included: ${included.length} rows, $${includedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  ⊘  Filtered: ${filtered.length} rows, $${filteredRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  ❌ Invalid: ${invalid} rows`);
  
  console.log(`\nFirst 3 included rows:`);
  included.slice(0, 3).forEach(r => {
    console.log(`    Row ${r.idx + 1}: "${r.entity}" | $${r.revenue} | Code: ${r.code}`);
  });
  
  console.log(`\nFirst 3 filtered rows:`);
  filtered.slice(0, 3).forEach(r => {
    console.log(`    Row ${r.idx + 1}: "${r.entity}" | $${r.revenue} | Code: ${r.code}`);
  });
});

console.log(`\n${'='.repeat(60)}`);
console.log('FINAL SUMMARY');
console.log('='.repeat(60));

Object.entries(results).forEach(([branch, data]) => {
  const expectedValues = {
    'NSW': { rows: 3883, revenue: 11038302.25 },
    'QLD': { rows: 4343, revenue: 11921434.46 },
    'WA': { rows: 54553, revenue: 205392579.14 }
  };
  
  const expected = expectedValues[branch];
  const rowDiff = data.included - expected.rows;
  const revDiff = data.includedRevenue - expected.revenue;
  
  console.log(`\n${branch}:`);
  console.log(`  Actual:   ${data.included} rows, $${data.includedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  Expected: ${expected.rows} rows, $${expected.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  Diff:     ${rowDiff > 0 ? '+' : ''}${rowDiff} rows, ${revDiff > 0 ? '+' : ''}$${Math.abs(revDiff).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${revDiff < 0 ? 'MISSING' : 'EXTRA'}`);
});

const totalActual = Object.values(results).reduce((sum, r) => sum + r.includedRevenue, 0);
const totalExpected = 11038302.25 + 11921434.46 + 205392579.14;
console.log(`\nTotal across all branches:`);
console.log(`  Actual:   $${totalActual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
console.log(`  Expected: $${totalExpected.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
console.log(`  Diff:     $${(totalActual - totalExpected).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
