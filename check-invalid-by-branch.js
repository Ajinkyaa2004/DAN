// Find which branch the invalid revenue rows belong to
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const branchPattern = /\(([A-Z]{2,3})\)/;
const invalidByBranch = {};

records.forEach((row, idx) => {
  const entity = String(row['Entity Name'] || '').trim();
  const revenueStr = String(row['Total'] || '0').replace(/[,$]/g, '').trim();
  const revenue = parseFloat(revenueStr);
  
  if (isNaN(revenue) || revenue <= 0) {
    const match = entity.match(branchPattern);
    let branch;
    
    if (match && match[1]) {
      branch = match[1];
    } else if (entity) {
      branch = '__NO_CODE__ (WA)';
    } else {
      branch = '__EMPTY__';
    }
    
    if (!invalidByBranch[branch]) {
      invalidByBranch[branch] = [];
    }
    
    invalidByBranch[branch].push({
      row: idx + 1,
      entity,
      revenue: revenueStr
    });
  }
});

console.log('Invalid revenue rows by branch:\n');
Object.entries(invalidByBranch).forEach(([branch, rows]) => {
  console.log(`${branch}: ${rows.length} rows`);
  console.log('  Sample rows:');
  rows.slice(0, 3).forEach(r => {
    console.log(`    Row ${r.row}: Entity="${r.entity}" Revenue="${r.revenue}"`);
  });
  console.log('');
});

const totalInvalid = Object.values(invalidByBranch).reduce((sum, rows) => sum + rows.length, 0);
console.log(`Total invalid rows: ${totalInvalid}`);
