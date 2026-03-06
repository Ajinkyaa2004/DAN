// Check for duplicate Invoice IDs within branches
const fs = require('fs');
const { parse } = require('csv-parse/sync');

console.log('=== CHECKING SEPARATE CSV FILES ===\n');

['NSW.csv', 'QLD.csv', 'WA.csv'].forEach(filename => {
  const csvContent = fs.readFileSync(filename, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  const invoiceIds = new Map();
  const duplicates = [];
  
  records.forEach((row, idx) => {
    const invoiceId = String(row['Invoice ID'] || '').trim();
    if (invoiceId) {
      if (invoiceIds.has(invoiceId)) {
        duplicates.push({
          invoice: invoiceId,
          firstRow: invoiceIds.get(invoiceId),
          dupRow: idx + 1
        });
      } else {
        invoiceIds.set(invoiceId, idx + 1);
      }
    }
  });
  
  console.log(`${filename}:`);
  console.log(`  Total rows: ${records.length}`);
  console.log(`  Unique invoices: ${invoiceIds.size}`);
  console.log(`  Duplicates: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log(`  Sample duplicates:`);
    duplicates.slice(0, 3).forEach(d => {
      console.log(`    Invoice ${d.invoice}: rows ${d.firstRow} and ${d.dupRow}`);
    });
  }
  console.log('');
});

console.log('\n=== CHECKING COMBINED CSV ===\n');

const combined = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');
const combinedRecords = parse(combined, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const branchPattern = /\(([A-Z]{2,3})\)/;
const branchInvoices = {
  'NSW': new Map(),
  'QLD': new Map(),
  'WA': new Map()
};

combinedRecords.forEach((row, idx) => {
  const entity = String(row['Entity Name'] || '').trim();
  const invoiceId = String(row['Invoice ID'] || '').trim();
  
  if (!invoiceId) return;
  
  const match = entity.match(branchPattern);
  let branch;
  
  if (match && match[1]) {
    branch = match[1];
  } else if (entity) {
    branch = 'WA';
  } else {
    return;
  }
  
  if (!branchInvoices[branch].has(invoiceId)) {
    branchInvoices[branch].set(invoiceId, []);
  }
  branchInvoices[branch].get(invoiceId).push(idx + 1);
});

Object.entries(branchInvoices).forEach(([branch, invoices]) => {
  const duplicates = Array.from(invoices.entries()).filter(([id, rows]) => rows.length > 1);
  
  console.log(`${branch} (from combined CSV):`);
  console.log(`  Total invoices: ${invoices.size}`);
  console.log(`  Duplicate invoices: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.log(`  Sample duplicates:`);
    duplicates.slice(0, 3).forEach(([id, rows]) => {
      console.log(`    Invoice ${id}: ${rows.length} occurrences at rows ${rows.join(', ')}`);
    });
  }
  console.log('');
});
