// Test script to simulate branch filtering logic

const fs = require('fs');

// Read CSV file
const csvContent = fs.readFileSync('RAW_ALL BRANCES_COMBINED.csv', 'utf8');
const lines = csvContent.split('\n');
const header = lines[0].split(',');

console.log('CSV Header:', header);
console.log('\nTotal lines:', lines.length - 1);

// Find Entity Name column index
const entityCol = 0; // First column is Entity Name
const revenueCol = 14; // 15th column (0-indexed14) is Total

// Simulate detected branches
const detectedBranches = ['NSW', 'QLD', '__NO_CODE__'];
const explicitBranches = detectedBranches.filter(b => b !== '__NO_CODE__');

console.log('\nDetected branches:', detectedBranches);
console.log('Explicit branches:', explicitBranches);

// Process each branch iteration
const branches = ['NSW', 'QLD', 'WA'];
const branchPattern = /\(([A-Z]{2,3})\)/;

const results = {};

branches.forEach(branch => {
  console.log(`\n========== Processing ${branch} iteration ==========`);
  
  let includedCount = 0;
  let includedRevenue = 0;
  let filteredCount = 0;
  let filteredRevenue = 0;
  let invalidCount = 0;
  
  const samples = { included: [], filtered: [] };
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split(',');
    const entityName = String(cols[entityCol] || '').replace(/"/g, '').trim();
    const revenue = parseFloat(cols[revenueCol] || '0');
    
    // Skip invalid revenue
    if (revenue <= 0) {
      invalidCount++;
      continue;
    }
    
    // Extract branch code
    const match = entityName.match(branchPattern);
    let extractedBranch = null;
    let hasExplicitCode = false;
    
    if (match && match[1]) {
      extractedBranch = match[1].toUpperCase();
      hasExplicitCode = true;
    } else if (entityName) {
      hasExplicitCode = false;
    }
    
    // Determine if should include
    let shouldInclude = false;
    
    if (hasExplicitCode && extractedBranch) {
      shouldInclude = extractedBranch === branch.toUpperCase();
    } else if (!hasExplicitCode) {
      const currentBranchHasCode = explicitBranches.some(b => b.toUpperCase() === branch.toUpperCase());
      shouldInclude = !currentBranchHasCode;
    }
    
    if (shouldInclude) {
      includedCount++;
      includedRevenue += revenue;
      
      if (samples.included.length < 3) {
        samples.included.push({ row: i, entity: entityName, revenue, extractedBranch });
      }
    } else {
      filteredCount++;
      filteredRevenue += revenue;
      
      if (samples.filtered.length < 3) {
        samples.filtered.push({ row: i, entity: entityName, revenue, extractedBranch });
      }
    }
  }
  
  results[branch] = {
    included: includedCount,
    includedRevenue,
    filtered: filteredCount,
    filteredRevenue,
    invalid: invalidCount
  };
  
  console.log(`\nIncluded: ${includedCount} rows, $${includedRevenue.toFixed(2)}`);
  console.log(`Filtered: ${filteredCount} rows, $${filteredRevenue.toFixed(2)}`);
  console.log(`Invalid: ${invalidCount} rows`);
  
  console.log(`\nSample included rows:`);
  samples.included.forEach(s => {
    console.log(`  Row ${s.row}: "${s.entity}" → $${s.revenue} (code: ${s.extractedBranch || 'NONE'})`);
  });
  
  console.log(`\nSample filtered rows:`);
  samples.filtered.forEach(s => {
    console.log(`  Row ${s.row}: "${s.entity}" → $${s.revenue} (code: ${s.extractedBranch || 'NONE'})`);
  });
});

console.log('\n\n========== FINAL RESULTS ==========');
Object.entries(results).forEach(([branch, data]) => {
  console.log(`\n${branch}:`);
  console.log(`  Included: ${data.included} rows, $${data.includedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  console.log(`  Filtered: ${data.filtered} rows, $${data.filteredRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
});

const totalIncluded = Object.values(results).reduce((sum, d) => sum + d.includedRevenue, 0);
console.log(`\nTotal revenue across all branches: $${totalIncluded.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
