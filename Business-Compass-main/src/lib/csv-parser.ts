import type { AnalysisResponse } from "./types";
import { formatCurrency } from "./formatters";
import { CASH_THRESHOLDS, CONCENTRATION_THRESHOLDS, EXPANSION_THRESHOLDS, VALIDATION_THRESHOLDS } from "./constants";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * CSV/XLSX Parser and Transformer
 * Parses uploaded files and transforms them based on selected template
 */

interface ParsedRow {
  [key: string]: string | number;
}

export interface ColumnDetectionResult {
  revenueCol: string | null;
  dateCol: string | null;
  customerCol: string | null;
  customerNameCol?: string | null;
  outstandingCol?: string | null;
  paymentStatusCol?: string | null;
  paymentDateCol?: string | null;
  paidAmountCol?: string | null;
  segmentCols: string[];
  allColumns: string[];
  needsManualSelection: boolean;
}

/**
 * Normalize column name for flexible matching
 */
function normalizeColumnName(col: string): string {
  return col
    .toLowerCase()
    .trim()
    .replace(/[\$\-_\(\)\[\]\{\}]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Clean numeric value from string (remove currency, commas, spaces, etc)
 */
function cleanNumericValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  
  // Remove currency symbols ($), commas, spaces, and trim
  const cleaned = value
    .replace(/[\$€£¥₹,\s]/g, '')
    .trim();
  
  // Use Number() for proper conversion
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Extract branch code from entity/company name
 * Examples:
 *   "Connect Resources Pty Ltd" -> "WA"
 *   "Connect Resources (NSW) Pty Ltd" -> "NSW"
 *   "Connect Resources (QLD) Pty Ltd" -> "QLD"
 *   "Some Company (VIC) Ltd" -> "VIC"
 */
function extractBranchCode(branchValue: string): string {
  if (!branchValue) return branchValue;
  
  const trimmed = String(branchValue).trim();
  
  // Pattern 1: Extract code from parentheses like "(NSW)", "(QLD)", "(WA)"
  const branchPattern = /\(([A-Z]{2,3})\)/;
  const match = trimmed.match(branchPattern);
  
  if (match && match[1]) {
    // Found explicit branch code in parentheses
    return match[1];
  }
  
  // Pattern 2: Check if the value is already a branch code (2-3 uppercase letters)
  if (/^[A-Z]{2,3}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Pattern 3: If no explicit code and it's a company name, check against known patterns
  // "Connect Resources Pty Ltd" without (STATE) code typically means WA (head office)
  // This handles the case where one branch doesn't have a state identifier
  const lowerValue = trimmed.toLowerCase();
  
  // Australian state codes that might appear without parentheses
  const statePatterns = [
    { code: 'NSW', patterns: ['new south wales', ' nsw ', 'nsw pty', 'nsw ltd'] },
    { code: 'QLD', patterns: ['queensland', ' qld ', 'qld pty', 'qld ltd'] },
    { code: 'VIC', patterns: ['victoria', ' vic ', 'vic pty', 'vic ltd'] },
    { code: 'WA', patterns: ['western australia', ' wa ', 'wa pty', 'wa ltd'] },
    { code: 'SA', patterns: ['south australia', ' sa ', 'sa pty', 'sa ltd'] },
    { code: 'TAS', patterns: ['tasmania', ' tas ', 'tas pty', 'tas ltd'] },
    { code: 'NT', patterns: ['northern territory', ' nt ', 'nt pty', 'nt ltd'] },
    { code: 'ACT', patterns: ['australian capital', ' act ', 'act pty', 'act ltd'] },
  ];
  
  for (const { code, patterns } of statePatterns) {
    if (patterns.some(pattern => lowerValue.includes(pattern))) {
      return code;
    }
  }
  
  // Pattern 4: If it's a base company name without any state identifier,
  // return as-is (will be handled by context - typically head office/WA)
  // But first check if it's a known "no code" pattern
  if (lowerValue === 'connect resources pty ltd') {
    return 'WA';
  }
  if (lowerValue.includes('pty') || lowerValue.includes('ltd') || lowerValue.includes('limited')) {
    // This is a company name without explicit state - return 'WA' as requested
    return 'WA';
  }
  
  // Default: return original value
  return trimmed;
}

/**
 * Parse date string handling multiple formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, ISO)
 * Returns null if date cannot be parsed
 */
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const str = String(dateStr).trim();
  
  // Try ISO format or standard Date() parsing first
  let date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY format (common in AU/UK/EU)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1]);
    const month = parseInt(ddmmyyyyMatch[2]);
    const year = parseInt(ddmmyyyyMatch[3]);
    
    // Check if it's likely DD/MM/YYYY (day > 12 or month <= 12 and seems reasonable)
    if (day > 12 || (month <= 12 && day <= 31)) {
      // Try as DD/MM/YYYY
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime()) && date.getDate() === day) {
        return date;
      }
    }
    
    // Fall back to MM/DD/YYYY
    if (month <= 12 && day <= 31) {
      date = new Date(year, day - 1, month);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Try YYYY/MM/DD or YYYY-MM-DD
  const yyyymmddMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1]);
    const month = parseInt(yyyymmddMatch[2]);
    const day = parseInt(yyyymmddMatch[3]);
    date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

/**
 * Parse CSV file to JSON using PapaParse
 */
export async function parseCSV(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings, we'll clean later
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        if (!results.data || results.data.length === 0) {
          reject(new Error('CSV file is empty or invalid'));
          return;
        }

        // Clean the data
        console.log('📄 PapaParse raw results.data.length:', results.data.length);
        
        const cleanedData = results.data.map((row: any) => {
          const cleanRow: ParsedRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            if (cleanKey) {
              cleanRow[cleanKey] = row[key];
            }
          });
          return cleanRow;
        }).filter(row => Object.keys(row).length > 0);

        console.log('✅ After cleaning, cleanedData.length:', cleanedData.length);
        resolve(cleanedData);
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Parse XLSX file to JSON using xlsx library
 */
export async function parseXLSX(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read Excel file'));
          return;
        }

        // Read the workbook
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file has no sheets'));
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Format values as strings
          defval: '', // Default value for empty cells
        });

        if (jsonData.length === 0) {
          reject(new Error('Excel sheet is empty'));
          return;
        }

        // Clean the data to match ParsedRow format
        console.log('📄 XLSX raw jsonData.length:', jsonData.length);

        
        const cleanedData = jsonData.map((row: any) => {
          const cleanRow: ParsedRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim();
            if (cleanKey) {
              cleanRow[cleanKey] = row[key];
            }
          });
          return cleanRow;
        }).filter(row => Object.keys(row).length > 0);

        console.log('✅ After cleaning, cleanedData.length:', cleanedData.length);
        resolve(cleanedData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    // Read as ArrayBuffer (binary) - NOT as text!
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse multi-sheet Excel file with branch assignment based on sheet names
 * Expected sheet names: 'WA', 'QLD', 'NSW', 'HISTORICAL'
 * Returns array of data with branch identifier added to each row
 */
export async function parseMultiSheetXLSX(
  file: File,
  expectedSheets?: string[]
): Promise<Array<{ data: ParsedRow[]; branch: string }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read Excel file'));
          return;
        }

        // Read the workbook
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('Excel file has no sheets'));
          return;
        }

        console.log('📊 Multi-sheet Excel detected');
        console.log('Available sheets:', workbook.SheetNames);
        
        // Default branch sheets to look for
        const branchSheets = expectedSheets || ['WA', 'QLD', 'NSW'];
        const results: Array<{ data: ParsedRow[]; branch: string }> = [];
        
        // Process each expected sheet
        for (const sheetName of branchSheets) {
          // Try exact match first, then case-insensitive
          let actualSheetName = workbook.SheetNames.find(s => s === sheetName);
          if (!actualSheetName) {
            actualSheetName = workbook.SheetNames.find(
              s => s.toLowerCase() === sheetName.toLowerCase()
            );
          }
          
          if (!actualSheetName) {
            console.warn(`⚠️  Sheet "${sheetName}" not found, skipping`);
            continue;
          }
          
          const worksheet = workbook.Sheets[actualSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: '',
          });

          if (jsonData.length === 0) {
            console.warn(`⚠️  Sheet "${actualSheetName}" is empty, skipping`);
            continue;
          }

          // Clean the data
          const cleanedData = jsonData.map((row: any) => {
            const cleanRow: ParsedRow = {};
            Object.keys(row).forEach(key => {
              const cleanKey = key.trim();
              if (cleanKey) {
                cleanRow[cleanKey] = row[key];
              }
            });
            return cleanRow;
          }).filter(row => Object.keys(row).length > 0);

          console.log(`✅ Sheet "${actualSheetName}": ${cleanedData.length} rows`);
          
          results.push({
            data: cleanedData,
            branch: sheetName, // Use the expected branch name (normalized)
          });
        }
        
        if (results.length === 0) {
          reject(new Error(`No valid sheets found. Expected: ${branchSheets.join(', ')}`));
          return;
        }
        
        console.log(`✅ Successfully parsed ${results.length} sheets from Excel file`);
        resolve(results);
      } catch (error) {
        reject(new Error(`Failed to parse multi-sheet Excel: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect if a value looks like a date
 */
function looksLikeDate(value: any): boolean {
  if (typeof value !== 'string') return false;
  // Check for common date patterns
  return /\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(value);
}

/**
 * Detect if data already has a Branch column with values
 * Returns: { hasBranchColumn: boolean, branchColumnName: string | null, branches: string[] }
 */
export function detectBranchColumn(data: ParsedRow[]): {
  hasBranchColumn: boolean;
  branchColumnName: string | null;
  branches: string[];
  coverage: number; // Percentage of rows with branch data
  isEmbedded?: boolean; // True if branches are embedded in text (e.g., "Company (NSW)")
  originalColumnName?: string; // Original column name when isEmbedded=true
} {
  if (data.length === 0) {
    return { hasBranchColumn: false, branchColumnName: null, branches: [], coverage: 0 };
  }

  // Look for columns that might be branch identifiers
  const branchKeywords = ['branch', 'region', 'state', 'location', 'area', 'zone', 'office'];
  const columns = Object.keys(data[0]);
  
  console.log('\n🔍 BRANCH COLUMN DETECTION - Analyzing columns...');
  
  let bestMatch: { col: string; coverage: number; branches: Set<string> } | null = null;
  
  for (const col of columns) {
    const normalized = normalizeColumnName(col);
    
    // Check if column name matches branch keywords
    const matchesKeyword = branchKeywords.some(keyword => normalized.includes(keyword));
    
    if (matchesKeyword) {
      // Check how many rows have non-empty values in this column
      const nonEmptyValues = data
        .map(row => String(row[col]).trim())
        .filter(val => val && val !== '' && val !== 'null' && val !== 'undefined');
      
      const coverage = nonEmptyValues.length / data.length;
      const uniqueBranches = new Set(nonEmptyValues);
      
      // Prioritize exact "branch" matches over partial matches like "branch region"
      const isExactBranch = normalized === 'branch';
      
      console.log(`   Checking column "${col}":`);
      console.log(`     - Normalized: "${normalized}" ${isExactBranch ? '(EXACT MATCH!)' : ''}`);
      console.log(`     - Non-empty values: ${nonEmptyValues.length} / ${data.length} rows (${(coverage * 100).toFixed(1)}%)`);
      console.log(`     - Unique values: ${uniqueBranches.size}`);
      if (uniqueBranches.size > 0 && uniqueBranches.size <= VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MAX) {
        console.log(`     - Sample values: ${Array.from(uniqueBranches).slice(0, 5).join(', ')}`);
      }
      
      // Consider it a valid branch column if:
      // 1. At least 50% of rows have values
      // 2. Has between 2-10 unique values (reasonable for branch count)
      const passedCoverage = coverage >= VALIDATION_THRESHOLDS.BRANCH_COVERAGE_MIN;
      const passedUniqueCount = uniqueBranches.size >= VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MIN && uniqueBranches.size <= VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MAX;
      
      if (!passedCoverage) {
        console.log(`     ❌ FAILED: Coverage ${(coverage * 100).toFixed(1)}% < ${VALIDATION_THRESHOLDS.BRANCH_COVERAGE_MIN * 100}%`);
      }
      if (!passedUniqueCount) {
        console.log(`     ❌ FAILED: Unique values ${uniqueBranches.size} (need ${VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MIN}-${VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MAX})`);
      }
      
      if (passedCoverage && passedUniqueCount) {
        console.log(`     ✅ PASSED validation checks`);
        
        // Replace bestMatch if:
        // - No existing match, OR
        // - This is an exact "branch" match and current isn't, OR
        // - Both are exact or both aren't, and this has better coverage
        const currentIsExactBranch = bestMatch ? normalizeColumnName(bestMatch.col) === 'branch' : false;
        
        if (!bestMatch || 
            (isExactBranch && !currentIsExactBranch) || 
            (isExactBranch === currentIsExactBranch && coverage > bestMatch.coverage)) {
          console.log(`     🎯 Selected as best match!`);
          bestMatch = { col, coverage, branches: uniqueBranches };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`\n✅ BRANCH COLUMN DETECTED: "${bestMatch.col}"`);
    console.log(`   Coverage: ${(bestMatch.coverage * 100).toFixed(1)}%`);
    console.log(`   Branches found: ${Array.from(bestMatch.branches).sort().join(', ')}`);
    console.log(`   🎯 Sample values: ${Array.from(bestMatch.branches).sort().slice(0, 5).join(', ')}`);
    
    return {
      hasBranchColumn: true,
      branchColumnName: bestMatch.col,
      branches: Array.from(bestMatch.branches),
      coverage: bestMatch.coverage,
    };
  }
  
  console.log(`\n⚠️  Standard branch column not found. Checking for embedded branch codes...`);
  
  // FALLBACK: Check for "Entity Name" or similar columns with embedded branch codes like "(NSW)", "(QLD)"
  const entityNameKeywords = ['entity', 'company', 'organization', 'business'];
  const entityNameCandidates = columns.filter(col => {
    const normalized = normalizeColumnName(col);
    return entityNameKeywords.some(keyword => normalized.includes(keyword) && normalized.includes('name'));
  });
  
  console.log(`   Found ${entityNameCandidates.length} potential entity name columns: ${entityNameCandidates.join(', ')}`);
  
  for (const col of entityNameCandidates) {
    console.log(`\n   Analyzing "${col}" for embedded branch codes...`);
    
    // Extract branch codes from text like "Company (NSW) Pty Ltd" -> "NSW"
    const branchPattern = /\(([A-Z]{2,3})\)/; // Matches (NSW), (QLD), (WA), etc.
    const extractedBranches = new Map<string, number>(); // branch -> count
    let rowsWithBranches = 0;
    let rowsWithoutBranches = 0;
    
    data.forEach(row => {
      const value = String(row[col]).trim();
      const match = value.match(branchPattern);
      
      if (match && match[1]) {
        const branch = match[1];
        extractedBranches.set(branch, (extractedBranches.get(branch) || 0) + 1);
        rowsWithBranches++;
      } else if (value && value !== '') {
        // Row has entity name but no branch code - count separately
        rowsWithoutBranches++;
      }
    });
    
    if (extractedBranches.size > 0) {
      console.log(`   Found ${extractedBranches.size} branch codes embedded in text:`);
      extractedBranches.forEach((count, branch) => {
        console.log(`     - ${branch}: ${count} rows`);
      });
      console.log(`   Rows without branch codes: ${rowsWithoutBranches}`);
      
      // Check if we should add an implicit branch for rows without codes
      // Strategy: Rows without explicit codes will be handled dynamically during processing
      const branches = Array.from(extractedBranches.keys());
      
      // Add a special marker for rows without codes
      if (rowsWithoutBranches > 0) {
        console.log(`   ℹ️  Found ${branches.length} explicit branch code(s): ${branches.join(', ')}`);
        console.log(`   ℹ️  ${rowsWithoutBranches} rows WITHOUT codes (implicit branch)`);
        // Add special marker to indicate implicit branch detection
        branches.push('__NO_CODE__');
        extractedBranches.set('__NO_CODE__', rowsWithoutBranches);
      }
      
      // Now check if we have 2-10 unique branches (including implicit WA)
      const totalBranches = branches.length;
      if (totalBranches >= VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MIN && 
          totalBranches <= VALIDATION_THRESHOLDS.BRANCH_UNIQUE_MAX) {
        
        const totalWithCodes = rowsWithBranches;
        const coverage = (totalWithCodes + rowsWithoutBranches) / data.length; // Include default branch in coverage
        
        console.log(`\n   ✅ EMBEDDED BRANCH CODES DETECTED in "${col}"`);
        console.log(`   Branches: ${branches.join(', ')}`);
        console.log(`   Distribution:`);
        branches.forEach(b => {
          const count = extractedBranches.get(b) || 0;
          console.log(`     - ${b}: ${count.toLocaleString()} rows`);
        });
        console.log(`   Coverage: ${(coverage * 100).toFixed(1)}%`);
        
        // Return with embedded flag indicating extraction needed
        return {
          hasBranchColumn: true,
          branchColumnName: col, // Keep original column name
          branches,
          coverage,
          isEmbedded: true, // Flag that indicates extraction is needed
          originalColumnName: col, // Store original column name for reference
        };
      }
    }
  }
  
  console.log(`\n❌ NO VALID BRANCH COLUMN FOUND`);
  console.log(`   Reason: No column met criteria and no embedded branch codes detected`);
  
  return { hasBranchColumn: false, branchColumnName: null, branches: [], coverage: 0 };
}

/**
 * Detect column types in parsed data with flexible matching
 */
export function detectColumns(data: ParsedRow[]): ColumnDetectionResult {
  if (data.length === 0) {
    return { 
      revenueCol: null, 
      dateCol: null, 
      customerCol: null, 
      segmentCols: [], 
      allColumns: [],
      needsManualSelection: true 
    };
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  // Revenue keywords - check if normalized column INCLUDES any of these
  const revenueKeywords = ['revenue', 'sale', 'sales', 'amount', 'total', 'value', 'price', 'income', 'net', 'gross'];
  const revenueCandidates: Array<{ col: string; avgValue: number }> = [];

  columns.forEach(col => {
    const normalized = normalizeColumnName(col);
    const matchesKeyword = revenueKeywords.some(keyword => normalized.includes(keyword));
    
    if (matchesKeyword) {
      // Calculate average numeric value for this column
      const values = data.map(row => cleanNumericValue(row[col])).filter(v => v > 0);
      const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      revenueCandidates.push({ col, avgValue });
    }
  });

  // Choose revenue column with highest average value
  revenueCandidates.sort((a, b) => b.avgValue - a.avgValue);
  const revenueCol = revenueCandidates.length > 0 ? revenueCandidates[0].col : null;

  // Date column detection
  const dateKeywords = ['date', 'month', 'year', 'created', 'order', 'invoice', 'time', 'period'];
  let dateCol = columns.find(col => {
    const normalized = normalizeColumnName(col);
    return dateKeywords.some(keyword => normalized.includes(keyword));
  }) || null;

  // Fallback: detect by checking if values look like dates
  if (!dateCol) {
    dateCol = columns.find(col => {
      const sampleValues = data.slice(0, 10).map(row => row[col]);
      const dateCount = sampleValues.filter(looksLikeDate).length;
      return dateCount >= sampleValues.length * 0.5; // At least 50% look like dates
    }) || null;
  }

  // Customer column detection - prioritize customer ID over customer name
  // First try to find customer ID column
  const customerIdKeywords = ['customerid', 'customer_id', 'custid', 'cust_id', 'clientid', 'client_id', 'accountid', 'account_id'];
  let customerCol = columns.find(col => {
    const normalized = normalizeColumnName(col);
    return customerIdKeywords.some(keyword => normalized.includes(keyword));
  }) || null;
  
  // If no customer ID found, fall back to customer name columns
  if (!customerCol) {
    const customerNameKeywords = ['customer', 'client', 'company', 'account', 'buyer'];
    customerCol = columns.find(col => {
      const normalized = normalizeColumnName(col);
      // Exclude "Entity Name" which is often the branch/company name
      if (normalized.includes('entity') && normalized.includes('name')) return false;
      return customerNameKeywords.some(keyword => normalized.includes(keyword));
    }) || null;
  }

  // Detect customer name column (for display purposes, separate from customer ID)
  const customerNameKeywords = ['customername', 'customer_name', 'clientname', 'client_name', 'companyname', 'company_name', 'accountname', 'account_name'];
  let customerNameCol = columns.find(col => {
    const normalized = normalizeColumnName(col);
    // Skip if this is already the customer ID column
    if (col === customerCol) return false;
    // Exclude "Entity Name" which is often the branch/company name
    if (normalized.includes('entity') && normalized.includes('name')) return false;
    return customerNameKeywords.some(keyword => normalized.includes(keyword));
  }) || null;
  
  // If no specific name column found, check for generic "customer" or "client" without "id"
  if (!customerNameCol && customerCol) {
    const genericNameKeywords = ['customer', 'client', 'company', 'account'];
    customerNameCol = columns.find(col => {
      if (col === customerCol) return false; // Skip the ID column
      const normalized = normalizeColumnName(col);
      if (normalized.includes('entity') && normalized.includes('name')) return false;
      if (normalized.includes('id')) return false; // Skip ID columns
      return genericNameKeywords.some(keyword => normalized.includes(keyword));
    }) || null;
  }

  // Outstanding column detection - exclude date column to avoid matching "Due Date"
  const outstandingKeywords = [
    'outstanding', 'outstand', 'balance', 'owing', 'unpaid', 
    'receivable', 'ar', 'payable', 'owed', 'debt', 'remain', 'pending',
    'total outstanding', 'amt outstanding', 'amount outstanding'
  ];
  const outstandingCol = columns.find(col => {
    // Skip if this is the date column
    if (col === dateCol) return false;
    
    const normalized = normalizeColumnName(col);
    // Look for "outstanding" or "balance" keywords specifically
    // Avoid "due" to prevent matching "Due Date"
    return outstandingKeywords.some(keyword => normalized.includes(keyword));
  }) || null;

  // Detect payment tracking columns
  const paymentStatusKeywords = ['payment status', 'paymentstatus', 'status', 'paid status', 'invoice status'];
  const paymentStatusCol = columns.find(col => {
    const normalized = normalizeColumnName(col);
    return paymentStatusKeywords.some(keyword => normalized.includes(keyword));
  }) || null;

  const paymentDateKeywords = ['payment date', 'paymentdate', 'paid date', 'date paid', 'date received'];
  const paymentDateCol = columns.find(col => {
    if (col === dateCol) return false; // Exclude invoice date
    const normalized = normalizeColumnName(col);
    return paymentDateKeywords.some(keyword => normalized.includes(keyword));
  }) || null;

  const paidAmountKeywords = ['paid amount', 'paidamount', 'amount paid', 'payment amount', 'paid'];
  const paidAmountCol = columns.find(col => {
    if (col === revenueCol) return false; // Exclude invoice amount
    const normalized = normalizeColumnName(col);
    return paidAmountKeywords.some(keyword => normalized.includes(keyword));
  }) || null;

  // Detect potential segment columns
  const segmentKeywords = ['region', 'branch', 'state', 'location', 'channel', 'tier', 'category', 'segment', 'type', 'zone', 'area', 'store', 'franchise', 'plan', 'product', 'distributor'];
  const segmentCols = columns.filter(col => {
    const normalized = normalizeColumnName(col);
    return segmentKeywords.some(keyword => normalized.includes(keyword));
  });

  return { 
    revenueCol, 
    dateCol, 
    customerCol,
    customerNameCol,
    outstandingCol,
    paymentStatusCol,
    paymentDateCol,
    paidAmountCol,
    segmentCols,
    allColumns: columns,
    needsManualSelection: !revenueCol || !dateCol
  };
}

/**
 * Generate dynamic expansion decision based on segment size relative to primary
 */
function generateExpansionDecision(segmentName: string, pctOfPrimary: number): string {
  if (pctOfPrimary >= EXPANSION_THRESHOLDS.ALMOST_EQUAL) {
    return `${segmentName} segment is at ${pctOfPrimary.toFixed(1)}% of primary - almost equal. Consider whether business focus is too balanced. May indicate lack of clear primary segment or need to diversify growth strategy.`;
  } else if (pctOfPrimary >= EXPANSION_THRESHOLDS.STRONG_SECONDARY) {
    return `${segmentName} represents ${pctOfPrimary.toFixed(1)}% of primary segment. Strong secondary segment - monitor for growth opportunities and potential to become co-primary. Track trends and invest in expansion.`;
  } else if (pctOfPrimary >= EXPANSION_THRESHOLDS.GROWING) {
    return `${segmentName} is ${pctOfPrimary.toFixed(1)}% of primary segment. Growing segment with expansion opportunity. Consider targeted investment to accelerate growth and increase segment contribution.`;
  } else {
    return `${segmentName} at ${pctOfPrimary.toFixed(1)}% of primary segment. Small segment with high growth potential. Opportunity for strategic expansion - assess market size, competitive position, and resource requirements.`;
  }
}

/**
 * Transform parsed data based on template
 */
export async function transformData(
  file: File,
  template: string,
  revenueTarget?: number,
  segmentNames?: string[],
  manualColumns?: {
    revenueCol?: string;
    dateCol?: string;
    customerCol?: string;
    segmentCol?: string;
  }
): Promise<AnalysisResponse> {
  // Parse the file
  const data = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    ? await parseXLSX(file)
    : await parseCSV(file);

  if (data.length === 0) {
    throw new Error('No data found in file');
  }

  // Detect columns
  const detection = detectColumns(data);
  
  // Use manual columns if provided, otherwise use auto-detected columns
  const revenueCol = manualColumns?.revenueCol || detection.revenueCol;
  const dateCol = manualColumns?.dateCol || detection.dateCol;
  const customerCol = manualColumns?.customerCol || detection.customerCol;
  const customerNameCol = detection.customerNameCol; // Always use auto-detected name column
  const segmentCols = detection.segmentCols;

  if (!revenueCol) {
    // Return detection result for manual selection
    const error: any = new Error('NEEDS_MANUAL_SELECTION');
    error.detection = detection;
    throw error;
  }

  // Determine segment column based on template with flexible matching
  let segmentCol = manualColumns?.segmentCol || segmentCols[0] || null;
  
  if (template === 'multi-region') {
    segmentCol = segmentCols.find(col => {
      const normalized = normalizeColumnName(col);
      return ['region', 'state', 'area', 'zone', 'branch', 'location'].some(kw => normalized.includes(kw));
    }) || segmentCol;
  } else if (template === 'multi-channel') {
    segmentCol = segmentCols.find(col => {
      const normalized = normalizeColumnName(col);
      return ['channel', 'source', 'type'].some(kw => normalized.includes(kw));
    }) || segmentCol;
  } else if (template === 'b2b-saas') {
    segmentCol = segmentCols.find(col => {
      const normalized = normalizeColumnName(col);
      return ['tier', 'plan', 'package', 'subscription'].some(kw => normalized.includes(kw));
    }) || segmentCol;
  } else if (template === 'franchise') {
    segmentCol = segmentCols.find(col => {
      const normalized = normalizeColumnName(col);
      return ['location', 'franchise', 'store', 'outlet'].some(kw => normalized.includes(kw));
    }) || segmentCol;
  } else if (template === 'wholesale') {
    segmentCol = segmentCols.find(col => {
      const normalized = normalizeColumnName(col);
      return ['category', 'product', 'type', 'distributor'].some(kw => normalized.includes(kw));
    }) || segmentCol;
  }

  // CRITICAL FIX: Check for embedded branch codes in Entity Name column
  // This handles combined CSV files where branches are encoded as "Company (NSW) Pty Ltd"
  console.log('\n🔍 BRANCH DETECTION FOR SINGLE-FILE MODE');
  const branchDetection = detectBranchColumn(data);
  let useEmbeddedBranches = false;
  let embeddedBranchColumn: string | null = null;
  let defaultBranchForNoCodes = 'WA'; // Default for rows without parenthetical codes
  
  if (branchDetection.hasBranchColumn && branchDetection.isEmbedded && branchDetection.originalColumnName) {
    console.log(`✅ Detected embedded branch codes in column: "${branchDetection.originalColumnName}"`);
    console.log(`   Branches found: ${branchDetection.branches.filter(b => b !== '__NO_CODE__').join(', ')}`);
    console.log(`   Rows without codes will use default branch: ${defaultBranchForNoCodes}`);
    useEmbeddedBranches = true;
    embeddedBranchColumn = branchDetection.originalColumnName;
    
    // Override segmentCol to use embedded branches
    segmentCol = null; // We'll extract branches dynamically
  } else if (branchDetection.hasBranchColumn && !branchDetection.isEmbedded && branchDetection.branchColumnName) {
    console.log(`✅ Using standard branch column: "${branchDetection.branchColumnName}"`);
    // Use the detected branch column
    if (!segmentCol) {
      segmentCol = branchDetection.branchColumnName;
    }
  } else {
    console.log(`⚠️  No branch information detected - using template-based segmentation`);
  }

  // Calculate segments with proper numeric cleaning
  const segmentMap = new Map<string, number>();
  let totalRevenue = 0;
  const branchPattern = /\(([A-Z]{2,3})\)/; // Pattern to extract branch codes like (NSW), (QLD)

  data.forEach(row => {
    const revenue = cleanNumericValue(row[revenueCol]);
    // Include negative values (credit notes/refunds) but skip NaN/zero
    if (revenue === 0 || isNaN(revenue)) return; // Skip only zero and invalid rows
    
    let segment = 'Default';
    
    if (useEmbeddedBranches && embeddedBranchColumn) {
      // Extract branch code from Entity Name
      const entityName = String(row[embeddedBranchColumn] || '').trim();
      const match = entityName.match(branchPattern);
      
      if (match && match[1]) {
        // Found branch code in parentheses
        segment = match[1];
      } else if (entityName) {
        // No branch code - use default branch (likely WA)
        segment = defaultBranchForNoCodes;
      }
    } else if (segmentCol) {
      // Use standard segment column
      const segmentValue = String(row[segmentCol]).trim();
      segment = segmentValue || 'Default';
    }
    
    const currentSegmentTotal = segmentMap.get(segment) || 0;
    // Apply floating point rounding fix
    segmentMap.set(segment, Math.round((currentSegmentTotal + revenue) * 100) / 100);
    totalRevenue += revenue;
  });
  
  // Recalculate totalRevenue from rounded segment totals to ensure consistency
  // This prevents $1 rounding differences between sum of segments and total
  totalRevenue = Array.from(segmentMap.values()).reduce((sum, rev) => sum + rev, 0);
  totalRevenue = Math.round(totalRevenue * 100) / 100;

  // Build segments array - extract branch codes from full company names
  const segments = Array.from(segmentMap.entries())
    .map(([name, revenue]) => ({
      name: extractBranchCode(name),
      revenue,
      sharePct: (revenue / totalRevenue) * 100,
      yoyPct: null, // Would need historical data
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const primarySegment = segments[0]?.name || 'Unknown';

  // Calculate top customers with proper numeric cleaning
  const customerMap = new Map<string, { name: string; revenue: number }>();
  if (customerCol) {
    data.forEach(row => {
      const customerId = String(row[customerCol]).trim();
      if (!customerId) return; // Skip empty customer IDs
      
      const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customerId;
      const revenue = cleanNumericValue(row[revenueCol]);
      
      if (revenue !== 0 && !isNaN(revenue)) { // Include negatives (credits/refunds)
        const current = customerMap.get(customerId);
        const currentRevenue = current?.revenue || 0;
        // Apply floating point rounding fix
        customerMap.set(customerId, {
          name: customerName || customerId, // Fallback to ID if name is empty
          revenue: Math.round((currentRevenue + revenue) * 100) / 100
        });
      }
    });
  }

  const topCustomersByRevenue = Array.from(customerMap.entries())
    .map(([customer, data]) => ({ 
      customer, 
      customerName: data.name,
      revenue: data.revenue 
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Calculate revenue by FY based on transaction dates
  const revenueByFyMap = new Map<string, number>();
  
  // Helper function to calculate FY from a date string
  const getFYFromDate = (dateStr: string): string => {
    const date = parseFlexibleDate(dateStr);
    if (!date) {
      // Invalid date, use current FY
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const fyStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      const fyEndYear = fyStartYear + 1;
      return `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    // FY starts in July (month 7)
    const fyStartYear = month >= 7 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;
    return `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
  };
  
  // Group revenue by FY if we have a date column
  if (dateCol) {
    console.log('\n📅 Grouping revenue by Financial Year based on date column:', dateCol);
    let parsedCount = 0;
    let failedCount = 0;
    const sampleDates: string[] = [];
    
    data.forEach((row, index) => {
      const dateStr = String(row[dateCol]);
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue !== 0 && !isNaN(revenue)) { // Include negatives (credits/refunds)
        const fy = getFYFromDate(dateStr);
        revenueByFyMap.set(fy, (revenueByFyMap.get(fy) || 0) + revenue);
        
        // Track parsing success
        const parsed = parseFlexibleDate(dateStr);
        if (parsed) {
          parsedCount++;
          if (sampleDates.length < 3) {
            sampleDates.push(`"${dateStr}" → ${parsed.toISOString().split('T')[0]} → ${fy}`);
          }
        } else {
          failedCount++;
        }
      }
    });
    
    console.log(`  Parsed ${parsedCount} dates successfully, ${failedCount} failed`);
    console.log('  Sample date parsing:');
    sampleDates.forEach(s => console.log(`    ${s}`));
    console.log('\n  FY Revenue Distribution:');
    Array.from(revenueByFyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([fy, rev]) => {
        console.log(`    ${fy}: $${rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      });
  } else {
    // No date column - use current FY for all revenue
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const fyStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    const currentFY = `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
    revenueByFyMap.set(currentFY, totalRevenue);
  }
  
  // Sort FYs chronologically and calculate YoY growth
  const sortedFYs = Array.from(revenueByFyMap.entries())
    .sort((a, b) => {
      const fyA = parseInt(a[0].replace('FY', '').split('/')[0]);
      const fyB = parseInt(b[0].replace('FY', '').split('/')[0]);
      return fyA - fyB;
    });
  
  const revenueByFy = sortedFYs.map(([fy, revenue], index) => {
    let yoyGrowthPct: number | null = null;
    if (index > 0) {
      const prevRevenue = sortedFYs[index - 1][1];
      if (prevRevenue > 0) {
        yoyGrowthPct = ((revenue - prevRevenue) / prevRevenue) * 100;
      }
    }
    return { fy, revenue, yoyGrowthPct };
  });

  // Generate BP2 (Targets) decision based on growth trends
  const generateTargetDecision = (): string => {
    // Need at least 2 years for meaningful analysis
    if (revenueByFy.length < 2) {
      return `Current revenue: ${formatCurrency(totalRevenue)}. Insufficient historical data for growth analysis. Upload multi-year data to see trends and recommendations.`;
    }

    // Get complete FYs only (exclude partial/future years)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentFYStart = currentMonth >= 7 ? currentYear : currentYear - 1;
    const currentFY = `FY${String(currentFYStart).slice(-2)}/${String(currentFYStart + 1).slice(-2)}`;
    
    const completeFYs = revenueByFy.filter(fy => fy.fy < currentFY || fy.fy === currentFY);
    const growthValues = completeFYs.map(fy => fy.yoyGrowthPct).filter((v): v is number => v !== null);
    
    if (growthValues.length === 0) {
      return `Current revenue: ${formatCurrency(totalRevenue)}. Single complete year detected. Add prior year data for growth trends.`;
    }

    // Calculate average growth
    const avgGrowth = growthValues.reduce((sum, v) => sum + v, 0) / growthValues.length;
    
    // Get latest complete FY
    const latestFY = completeFYs[completeFYs.length - 1];
    const latestGrowth = latestFY.yoyGrowthPct;
    
    // Determine trend direction
    let trendDescription = '';
    if (latestGrowth !== null) {
      if (latestGrowth > avgGrowth + 10) {
        trendDescription = `Growth accelerating (latest: +${latestGrowth.toFixed(1)}% vs avg: +${avgGrowth.toFixed(1)}%)`;
      } else if (latestGrowth < avgGrowth - 10) {
        trendDescription = `Growth slowing (latest: ${latestGrowth >= 0 ? '+' : ''}${latestGrowth.toFixed(1)}% vs avg: +${avgGrowth.toFixed(1)}%)`;
      } else {
        trendDescription = `Steady growth averaging +${avgGrowth.toFixed(1)}% YoY`;
      }
    } else {
      trendDescription = `Average growth: +${avgGrowth.toFixed(1)}% YoY`;
    }

    // Calculate recommended target (conservative: use avg growth or latest if lower)
    const targetGrowth = latestGrowth !== null && latestGrowth < avgGrowth ? latestGrowth : avgGrowth;
    const recommendedTarget = latestFY.revenue * (1 + targetGrowth / 100);

    return `${trendDescription}. Based on ${growthValues.length} year${growthValues.length > 1 ? 's' : ''} of data, recommended ${currentFY} target: ${formatCurrency(recommendedTarget)} (~${targetGrowth > 0 ? '+' : ''}${targetGrowth.toFixed(1)}% growth).`;
  };

  const bp2Decision = generateTargetDecision();

  // ===================================================================
  // BP3: DYNAMIC CASH DECISION GENERATION (Single-Branch / Single File Mode)
  // ===================================================================
  
  // In single-file mode, outstanding tracking is limited - typically no outstanding column
  const bp3Decision = 'Outstanding balance data not detected. Include Outstanding Amount, Balance, or Receivable columns to enable cash flow tracking. For multi-branch analysis with payment tracking, use separate branch CSV files.';

  // ===================================================================
  // BP4: DYNAMIC CONCENTRATION DECISION GENERATION (Single-File Mode)
  // ===================================================================

  const generateConcentrationDecision = (): string => {
    const top5Pct = topCustomersByRevenue.slice(0, 5).reduce((sum, c) => sum + c.revenue, 0) / totalRevenue * 100;
    const top1CustomerPct = (topCustomersByRevenue[0]?.revenue || 0) / totalRevenue * 100;
    const uniqueCustomers = topCustomersByRevenue.length;

    // Edge case: No customers
    if (uniqueCustomers === 0) {
      return 'No customer data available for concentration analysis.';
    }

    // Edge case: Single customer (100% concentration)
    if (uniqueCustomers === 1) {
      return 'Single customer dataset. 100% concentration is structural - all revenue from one customer.';
    }

    // Structural concentration: Small dataset (≤5 customers)
    if (uniqueCustomers <= CONCENTRATION_THRESHOLDS.STRUCTURAL_SIZE) {
      return `Dataset has ${uniqueCustomers} customers. Concentration of ${top1CustomerPct.toFixed(1)}% (top customer) and ${top5Pct.toFixed(1)}% (top 5) reflects structural dataset size rather than business risk. Metrics valid only for larger customer bases.`;
    }

    // Real business concentration analysis (≥10 customers)
    if (uniqueCustomers >= CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK) {
      
      // CRITICAL: Single customer dominance (>50%)
      if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_CRITICAL) {
        return `🚨 CRITICAL RISK: Top customer represents ${top1CustomerPct.toFixed(1)}% of revenue (${formatCurrency((topCustomersByRevenue[0]?.revenue || 0))} of ${formatCurrency(totalRevenue)}). Single customer dependency - losing this customer would be catastrophic. URGENT: Diversify immediately through new customer acquisition and reducing reliance on this account.`;
      }

      // HIGH RISK: Top customer >40% OR Top 5 >80%
      if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK) {
        return `⚠️ HIGH RISK: Top customer accounts for ${top1CustomerPct.toFixed(1)}% of revenue. Significant customer dependency risk. Recommended: Diversify customer base, reduce single-customer reliance to below ${CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK}%, and develop contingency plans.`;
      }

      if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_CRITICAL) {
        return `⚠️ HIGH RISK: Top 5 customers represent ${top5Pct.toFixed(1)}% of revenue. Extreme concentration in few accounts - losing any key customer could significantly impact revenue. Recommended: Accelerate new customer acquisition to reduce dependence on top accounts.`;
      }

      // MODERATE RISK: Top customer 30-40% OR Top 5 60-80%
      if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_MODERATE) {
        const top1Amount = formatCurrency((topCustomersByRevenue[0]?.revenue || 0));
        return `⚡ MODERATE RISK: Top customer contributes ${top1CustomerPct.toFixed(1)}% (${top1Amount}). Concentration trending towards risk zone. Recommended: Monitor relationship health, diversify pipeline, aim to reduce top1 concentration below ${CONCENTRATION_THRESHOLDS.TOP1_MODERATE}%.`;
      }

      if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_HIGH_RISK) {
        return `⚡ MODERATE RISK: Top 5 customers account for ${top5Pct.toFixed(1)}% of revenue. Notable concentration - consider diversification strategy. Aim to reduce top5 concentration to below ${CONCENTRATION_THRESHOLDS.TOP5_MODERATE}% through customer acquisition.`;
      }

      // MONITORING: Top 5 between 40-60%
      if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_MONITORING) {
        return `📊 MONITOR: Top 5 customers represent ${top5Pct.toFixed(1)}% of revenue, top customer ${top1CustomerPct.toFixed(1)}%. Concentration within acceptable range but should monitor trends. Continue balanced customer acquisition to maintain diversification.`;
      }

      // HEALTHY: Well-diversified
      return `✅ HEALTHY: Well-diversified customer base. Top customer ${top1CustomerPct.toFixed(1)}%, top 5 customers ${top5Pct.toFixed(1)}% of revenue. Excellent distribution across ${uniqueCustomers} customers. Maintain current diversification strategy.`;
    }

    // Medium dataset (6-9 customers) - between structural and real risk
    return `Dataset has ${uniqueCustomers} customers. Top customer: ${top1CustomerPct.toFixed(1)}%, Top 5: ${top5Pct.toFixed(1)}%. Concentration metrics may be influenced by limited dataset size. For robust risk assessment, grow customer base above ${CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK} customers.`;
  };

  const bp4Decision = generateConcentrationDecision();

  // Calculate seasonality before building response
  console.log('\n📊 Building Seasonality Data...');
  const seasonalityData: Array<{ period: string; revenue: number }> = [];
  
  if (dateCol) {
    const periodRevenueMap = new Map<string, number>();
    
    data.forEach(row => {
      const dateStr = String(row[dateCol]);
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue === 0 || isNaN(revenue)) return; // Include negatives (credits/refunds)
      
      const date = parseFlexibleDate(dateStr);
      if (!date) return;
      
      // Group by quarter (Q1, Q2, Q3, Q4)
      const month = date.getMonth() + 1; // 1-12
      const quarter = Math.ceil(month / 3);
      const year = date.getFullYear();
      const period = `${year} Q${quarter}`;
      
      periodRevenueMap.set(period, (periodRevenueMap.get(period) || 0) + revenue);
    });
    
    seasonalityData.push(...Array.from(periodRevenueMap.entries())
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period)));
    
    console.log(`  Generated ${seasonalityData.length} seasonal periods`);
    if (seasonalityData.length > 0) {
      console.log('  Periods:', seasonalityData.map(s => s.period).join(', '));
    }
  }

  // Build complete response
  const analysisResponse: AnalysisResponse = {
    segments,
    primarySegment,
    
    revenueByFy,

    cash: {
      totalBilled: totalRevenue,
      totalOutstanding: 0, // No payment data in CSV
      stuckPct: 0,
    },

    topCustomersByOutstanding: [], // No payment/outstanding data in CSV

    topCustomersByRevenue,

    concentration: {
      top5Pct: topCustomersByRevenue.slice(0, 5).reduce((sum, c) => sum + c.revenue, 0) / totalRevenue * 100,
      top1CustomerPct: (topCustomersByRevenue[0]?.revenue || 0) / totalRevenue * 100,
    },

    expansion: segments.slice(1).map(seg => {
      const pct = (seg.revenue / segments[0].revenue) * 100;
      const decision = generateExpansionDecision(seg.name, pct);
      
      return {
        segment: seg.name,
        pctOfPrimary: pct,
        yoyPct: null, // No historical data for comparison
        decision,
      };
    }),
    seasonality: seasonalityData,

    onTrack: {
      target: revenueTarget || 0, // No target unless specified
      ytd: totalRevenue,
      onTrackPct: revenueTarget ? (totalRevenue / revenueTarget) * 100 : 0,
      ytdVsLastYearPct: null, // No historical data for YoY comparison
      decision: revenueTarget ? "Based on current data" : "No target set",
    },

    customerTrends: (() => {
      // ===================================================================
      // CUSTOMER TREND ANALYSIS - PRODUCTION-SAFE BUSINESS LOGIC
      // ===================================================================
      
      // Prerequisite check: need customer identifier, dates, and multi-period data
      if (!customerCol) {
        console.log('\n⚠️  Customer Trends: No customer column detected');
        return { dropping: [], rising: [], churnCount: 0, acquisitionCount: 0 };
      }
      
      if (!dateCol) {
        console.log('\n⚠️  Customer Trends: No date column detected');
        return { dropping: [], rising: [], churnCount: 0, acquisitionCount: 0 };
      }
      
      if (revenueByFy.length < VALIDATION_THRESHOLDS.MINIMUM_PERIODS_FOR_TRENDS) {
        console.log('\n⚠️  Customer Trends: Single period only - need multi-period data for comparison');
        return { dropping: [], rising: [], churnCount: 0, acquisitionCount: 0 };
      }
      
      console.log('\n📈 CUSTOMER TREND ANALYSIS');
      console.log('='.repeat(50));
      
      // Step 1: Calculate current FY to identify partial/future periods
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const currentFyStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      const todayFY = `FY${String(currentFyStartYear).slice(-2)}/${String(currentFyStartYear + 1).slice(-2)}`;
      
      console.log(`Today's Date: ${today.toLocaleDateString()}`);
      console.log(`Current FY (today): ${todayFY}`);
      
      // Step 2: Filter out partial/future FYs - only use COMPLETE historical FYs
      // A FY is complete if it's BEFORE the current FY
      const completeFYs = revenueByFy.filter(fy => {
        // Extract FY start year from format "FY23/24"
        const fyStartYear = parseInt('20' + fy.fy.slice(2, 4));
        const todayStartYear = currentFyStartYear;
        
        // Complete FY = starts before current FY start year
        const isComplete = fyStartYear < todayStartYear;
        
        if (!isComplete) {
          console.log(`⚠️  Excluding ${fy.fy} (revenue: $${fy.revenue.toFixed(2)}) - partial or future period`);
        }
        
        return isComplete;
      });
      
      console.log(`\nComplete FYs available: ${completeFYs.length}`);
      completeFYs.forEach(fy => console.log(`  ${fy.fy}: $${fy.revenue.toFixed(2)}`));
      
      // Step 3: Need at least 2 complete FYs for comparison
      if (completeFYs.length < 2) {
        console.log(`\n⚠️  Cannot perform customer trend analysis`);
        console.log(`   Reason: Need at least 2 complete FYs, but only have ${completeFYs.length}`);
        console.log(`   Current dataset spans: ${revenueByFy[0]?.fy} to ${revenueByFy[revenueByFy.length - 1]?.fy}`);
        return { dropping: [], rising: [], churnCount: 0, acquisitionCount: 0 };
      }
      
      // Step 4: Use the two most recent COMPLETE FYs
      const currentFY = completeFYs[completeFYs.length - 1].fy;
      const priorFY = completeFYs[completeFYs.length - 2].fy;
      
      console.log(`\n✅ Period Comparison: ${priorFY} → ${currentFY} (both complete)`);
      
      // Step 2: Group transactions by customer and period
      const customerRevenueByPeriod = new Map<string, Map<string, number>>();
      const customerNames = new Map<string, string>(); // Track customer names
      
      data.forEach(row => {
        const customerId = String(row[customerCol]).trim();
        if (!customerId) return; // Skip empty customer IDs
        
        const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customerId;
        // Store customer name (will be overwritten with same value, which is fine)
        if (customerName) {
          customerNames.set(customerId, customerName);
        }
        
        const revenue = cleanNumericValue(row[revenueCol]);
        if (revenue === 0 || isNaN(revenue)) return; // Include negatives (credits/refunds)
        
        const dateStr = String(row[dateCol]);
        const date = parseFlexibleDate(dateStr);
        if (!date) return; // Skip unparseable dates
        
        // Calculate FY from transaction date
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const fyStartYear = month >= 7 ? year : year - 1;
        const fyEndYear = fyStartYear + 1;
        const fy = `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
        
        // Aggregate revenue by customer-period
        if (!customerRevenueByPeriod.has(customerId)) {
          customerRevenueByPeriod.set(customerId, new Map());
        }
        const customerPeriods = customerRevenueByPeriod.get(customerId)!;
        customerPeriods.set(fy, (customerPeriods.get(fy) || 0) + revenue);
      });
      
      // Step 3: Get all unique customers (across all periods)
      const allCustomers = new Set<string>();
      customerRevenueByPeriod.forEach((_, customer) => allCustomers.add(customer));
      const totalUniqueCustomers = allCustomers.size;
      
      console.log(`Total Unique Customers: ${totalUniqueCustomers}`);
      
      // Edge case: very small dataset
      if (totalUniqueCustomers <= 3) {
        console.log('⚠️  Small dataset detected - trend metrics may be less meaningful');
      }
      
      // Step 4: Classify customers using STRICT business rules
      const dropping: Array<{ customer: string; customerName?: string; priorYearRevenue: number; currentYearRevenue: number; changePct: number }> = [];
      const rising: Array<{ customer: string; customerName?: string; priorYearRevenue: number; currentYearRevenue: number; changePct: number }> = [];
      const churned: string[] = [];
      const newCustomers: string[] = [];
      const stable: string[] = [];
      
      console.log('\nCustomer-by-Customer Analysis:');
      console.log('-'.repeat(50));
      
      customerRevenueByPeriod.forEach((periodRevenue, customerId) => {
        const customerName = customerNames.get(customerId) || customerId;
        const revenuePrior = periodRevenue.get(priorFY) || 0;
        const revenueCurrent = periodRevenue.get(currentFY) || 0;
        
        console.log(`\n${customerName} (ID: ${customerId}):`);
        console.log(`  ${priorFY}: $${revenuePrior.toFixed(0)}`);
        console.log(`  ${currentFY}: $${revenueCurrent.toFixed(0)}`);
        
        // STRICT CLASSIFICATION RULES (mutually exclusive)
        
        if (revenuePrior === 0 && revenueCurrent > 0) {
          // Rule: NEW CUSTOMER
          // Not in previous period, appears in current period
          newCustomers.push(customerId);
          console.log(`  → Classification: NEW CUSTOMER`);
          
        } else if (revenuePrior > 0 && revenueCurrent === 0) {
          // Rule: CHURNED CUSTOMER
          // Was in previous period, NOT in current period
          churned.push(customerId);
          console.log(`  → Classification: CHURNED`);console.log(`  ⚠️  WARNING: Customer had $${revenuePrior.toFixed(0)} in ${priorFY} but $0 in ${currentFY}`);
          
        } else if (revenuePrior > 0 && revenueCurrent > 0) {
          // Customer exists in both periods - check trend
          const changePct = ((revenueCurrent - revenuePrior) / revenuePrior) * 100;
          
          if (revenueCurrent > revenuePrior) {
            // Rule: RISING CUSTOMER
            // Revenue increased (any amount)
            rising.push({
              customer: customerId,
              customerName,
              priorYearRevenue: revenuePrior,
              currentYearRevenue: revenueCurrent,
              changePct,
            });
            console.log(`  → Classification: RISING (+${changePct.toFixed(1)}%)`);
            
          } else if (revenueCurrent < revenuePrior) {
            // Rule: DROPPING CUSTOMER
            // Revenue decreased but still active
            dropping.push({
              customer: customerId,
              customerName,
              priorYearRevenue: revenuePrior,
              currentYearRevenue: revenueCurrent,
              changePct,
            });
            console.log(`  → Classification: DROPPING (${changePct.toFixed(1)}%)`);
            
          } else {
            // Revenue unchanged (stable)
            stable.push(customerId);
            console.log(`  → Classification: STABLE (no change)`);
          }
        }
        // Note: (revenuePrior === 0 && revenueCurrent === 0) should not exist 
        // because we only process transactions with revenue > 0
      });
      
      // Sort by change magnitude
      dropping.sort((a, b) => a.changePct - b.changePct); // Most declined first
      rising.sort((a, b) => b.changePct - a.changePct);   // Most grown first
      
      // Step 5: Validation & logging
      const classified = newCustomers.length + churned.length + rising.length + dropping.length + stable.length;
      
      console.log('\nClassification Results:');
      console.log(`  New Customers: ${newCustomers.length}`);
      console.log(`  Rising: ${rising.length}`);
      console.log(`  Stable: ${stable.length}`);
      console.log(`  Dropping: ${dropping.length}`);
      console.log(`  Churned: ${churned.length}`);
      console.log(`  Total Classified: ${classified}`);
      
      if (classified !== totalUniqueCustomers) {
        console.warn(`⚠️  Classification mismatch! Expected ${totalUniqueCustomers}, got ${classified}`);
      }
      
      console.log('='.repeat(50));
      
      return {
        dropping,
        rising,
        churnCount: churned.length,
        acquisitionCount: newCustomers.length,
      };
    })(),

    customerPurchases: data
      .filter(row => {
        const rev = cleanNumericValue(row[revenueCol]);
        return rev !== 0 && !isNaN(rev);
      })
      .slice(0, 20)
      .map((row, idx) => {
        const customerId = customerCol ? String(row[customerCol]).trim() : `Customer ${idx + 1}`;
        const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customerId;
        
        // Extract branch using same logic as segments
        let branch = 'N/A';
        if (useEmbeddedBranches && embeddedBranchColumn) {
          const entityName = String(row[embeddedBranchColumn] || '').trim();
          const match = entityName.match(branchPattern);
          branch = match && match[1] ? match[1] : defaultBranchForNoCodes;
        } else if (segmentCol) {
          branch = String(row[segmentCol]).trim() || 'N/A';
        }
        
        return {
          customer: customerId,
          customerName: customerName || customerId,
          issueDate: dateCol ? String(row[dateCol]) : new Date().toISOString().split('T')[0],
          branch: branch,
          invoiceId: idx + 1000,
          invoiceNum: `INV-${idx + 1000}`,
          total: cleanNumericValue(row[revenueCol]),
        };
      }),

    decisions: {
      bp1: `${primarySegment} is primary segment at ${segments[0].sharePct.toFixed(1)}%`,
      bp2: bp2Decision,
      bp3: bp3Decision,
      bp4: bp4Decision,
      bp5: {},
      bp6: seasonalityData.length > 0 
        ? `${seasonalityData.length} seasonal periods identified. Peak: ${seasonalityData.reduce((max, p) => p.revenue > max.revenue ? p : max).period}`
        : 'No date information available for seasonality analysis',
      bp7: revenueTarget ? `${((totalRevenue / revenueTarget) * 100).toFixed(1)}% of target` : "No target set",
      bp8: `${data.length} total transactions analyzed`,
      bp9: `${topCustomersByRevenue.length} unique customers identified`,
    },

    weeklyTrend: [],
    forecast: [],
    fyComparison: [],
    monthlyBranch: [],
    dataGaps: [],

    meta: {
      dataRange: (() => {
        if (!dateCol) {
          return {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          };
        }
        
        let minTime = Infinity;
        let maxTime = -Infinity;
        let foundDate = false;
        
        for (const row of data) {
          const raw = row[dateCol];
          if (!raw) continue;
          const parsed = parseFlexibleDate(String(raw));
          if (parsed && !isNaN(parsed.getTime())) {
            const time = parsed.getTime();
            if (time < minTime) minTime = time;
            if (time > maxTime) maxTime = time;
            foundDate = true;
          }
        }
        
        if (!foundDate) {
          return {
            start: data[0] && data[0][dateCol] ? String(data[0][dateCol]) : new Date().toISOString().split('T')[0],
            end: data[data.length - 1] && data[data.length - 1][dateCol] ? String(data[data.length - 1][dateCol]) : new Date().toISOString().split('T')[0],
          };
        }
        
        return {
          start: new Date(minTime).toISOString(),
          end: new Date(maxTime).toISOString(),
        };
      })(),
      totalInvoices: data.length,
      totalCustomers: customerMap.size,
      branches: segments.map(s => s.name),
      lastIngestion: new Date().toISOString(),
      modelVersion: "1.0.0-parsed",
    },
  };

  return analysisResponse;
}

/**
 * Transform multiple branch files into combined dashboard data
 */
export async function transformMultiBranchData(
  files: Array<{ file: File; branch: string }>,
  revenueTarget?: number,
  manualColumns?: {
    revenueCol?: string;
    dateCol?: string;
    customerCol?: string;
  }
): Promise<AnalysisResponse> {
  // Parse all files
  const allParsedData: Array<{ data: ParsedRow[]; branch: string }> = [];
  
  console.log('\n🔷🔷🔷 STEP 1: PARSING FILES 🔷🔷🔷');
  console.log('Total files to process:', files.length);
  
  for (const { file, branch } of files) {
    if (branch === "HISTORICAL") {
      console.log(`\n📊 Processing HISTORICAL file: ${file.name}`);
      
      // Check if it's an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('  Attempting multi-sheet Excel parsing...');
        try {
          // Try to parse as multi-sheet Excel
          const multiSheetData = await parseMultiSheetXLSX(file, ['WA', 'QLD', 'NSW']);
          console.log(`  ✅ Multi-sheet Excel: Found ${multiSheetData.length} sheets`);
          
          // Add all sheets to parsed data
          multiSheetData.forEach(({ data, branch: sheetBranch }) => {
            allParsedData.push({ 
              data, 
              branch: sheetBranch,
              alreadySplitByBranch: true // Flag to skip filtering logic
            } as any);
          });
          
          continue; // Move to next file
        } catch (error) {
          console.warn(`  ⚠️  Multi-sheet parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.log('  Falling back to single-sheet processing...');
          
          // Fall back to single sheet parsing
          const data = await parseXLSX(file);
          console.log(`  ✅ Single-sheet fallback: ${data.length} rows`);
          allParsedData.push({ data, branch: 'HISTORICAL' });
        }
      } else {
        // CSV historical file
        console.log('  Processing historical CSV file...');
        const data = await parseCSV(file);
        console.log(`  ✅ Historical CSV parsed: ${data.length} rows`);
        
        // Check if CSV has branch column - if so, split by branch
        const branchDetection = detectBranchColumn(data);
        if (branchDetection.hasBranchColumn) {
          console.log(`  ✅ Historical CSV has branch column: "${branchDetection.branchColumnName}"`);
          console.log(`  📊 Detected branches: ${branchDetection.branches.join(', ')}`);
          console.log(`  🔀 Splitting historical data by branch...`);
          
          // Split data by branch
          const branchGroups: Record<string, ParsedRow[]> = {};
          for (const row of data) {
            const branchValue = String(row[branchDetection.branchColumnName!]).trim();
            if (!branchGroups[branchValue]) {
              branchGroups[branchValue] = [];
            }
            branchGroups[branchValue].push(row);
          }
          
          // Add each branch group separately
          Object.entries(branchGroups).forEach(([branchValue, branchData]) => {
            console.log(`     ${branchValue}: ${branchData.length} rows`);
            allParsedData.push({ 
              data: branchData, 
              branch: branchValue,
              alreadySplitByBranch: true // Flag to skip filtering logic
            } as any);
          });
        } else {
          console.log(`  ⚠️  Historical CSV has no branch column - adding as single entry`);
          allParsedData.push({ data, branch: 'HISTORICAL' });
        }
      }
      
      continue;
    }
    
    console.log(`\n📂 Parsing ${branch} file: ${file.name}`);
    const data = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      ? await parseXLSX(file)
      : await parseCSV(file);
    
    console.log(`✅ ${branch} parsed: ${data.length} rows`);
    
    // FEATURE 2 & 3: Detect if file already has a Branch column and handle COMBINED files
    console.log(`\n🔍 Checking for existing branch column in ${branch} file...`);
    const branchDetection = detectBranchColumn(data);
    
    if (branchDetection.hasBranchColumn) {
      console.log(`   ✅ File already has branch data in column: "${branchDetection.branchColumnName}"`);
      console.log(`   📊 Branches in file: ${branchDetection.branches.join(', ')}`);
      
      // CRITICAL FIX: If this is a COMBINED file with Branch column, split it like HISTORICAL files
      if (branch === 'COMBINED') {
        console.log(`   🔀 COMBINED FILE DETECTED - Splitting by internal branch values...`);
        
        // Split data by branch
        const branchGroups: Record<string, ParsedRow[]> = {};
        for (const row of data) {
          const branchValue = String(row[branchDetection.branchColumnName!]).trim();
          if (!branchGroups[branchValue]) {
            branchGroups[branchValue] = [];
          }
          branchGroups[branchValue].push(row);
        }
        
        // Add each branch group separately
        Object.entries(branchGroups).forEach(([branchValue, branchData]) => {
          console.log(`     ✅ ${branchValue}: ${branchData.length} rows`);
          allParsedData.push({ 
            data: branchData, 
            branch: branchValue,
            alreadySplitByBranch: true // Flag to skip filtering logic
          } as any);
        });
      } else {
        console.log(`   ⚠️  Will use EXISTING branch data instead of positional assignment`);
        
        if (branchDetection.isEmbedded) {
          console.log(`   🔤 EMBEDDED MODE: Branch codes found in text like "(NSW)", "(QLD)"`);
        }
        
        // Store metadata about the detected branch column
        // This will be used in Feature 3 (Smart filter/assign logic)
        allParsedData.push({ 
          data, 
          branch, 
          branchColumnName: branchDetection.branchColumnName,
          detectedBranches: branchDetection.branches,
          isEmbedded: branchDetection.isEmbedded || false,
        } as any);
      }
    } else {
      console.log(`   ℹ️  No existing branch column found`);
      console.log(`   → Will assign branch="${branch}" based on upload position`);
      allParsedData.push({ data, branch });
    }
  }

  if (allParsedData.length === 0) {
    throw new Error('No valid branch files to process');
  }

  // Detect columns from the first file
  const firstFileData = allParsedData[0].data;
  const detection = detectColumns(firstFileData);
  
  const revenueCol = manualColumns?.revenueCol || detection.revenueCol;
  const dateCol = manualColumns?.dateCol || detection.dateCol;
  const customerCol = manualColumns?.customerCol || detection.customerCol;
  const customerNameCol = detection.customerNameCol; // Always use auto-detected name column
  const outstandingCol = detection.outstandingCol;

  if (!revenueCol) {
    const error: any = new Error('NEEDS_MANUAL_SELECTION');
    error.detection = detection;
    throw error;
  }

  // Detect Invoice ID column for deduplication
  const allColumns = Object.keys(firstFileData[0] || {});
  
  // First, try to find columns that specifically mention "invoice"
  let invoiceCol = allColumns.find(col => {
    const normalized = normalizeColumnName(col);
    return normalized.includes('invoice') && normalized.includes('id');
  });
  
  // If not found, try broader invoice keywords but prioritize invoice-specific ones
  if (!invoiceCol) {
    const invoiceKeywords = ['invoiceid', 'invoice_id', 'invid', 'inv_id', 'invoicenum', 'invoice_num', 'invoicenumber', 'invoice_number'];
    invoiceCol = allColumns.find(col => {
      const normalized = normalizeColumnName(col);
      return invoiceKeywords.some(keyword => normalized === keyword || normalized.includes(keyword));
    });
  }
  
  // If still not found, use more generic keywords but exclude customer/client columns
  if (!invoiceCol) {
    const genericKeywords = ['invoice', 'inv', 'order', 'transaction', 'receipt'];
    invoiceCol = allColumns.find(col => {
      const normalized = normalizeColumnName(col);
      // Exclude customer/client columns
      if (normalized.includes('customer') || normalized.includes('client') || normalized.includes('account')) {
        return false;
      }
      return genericKeywords.some(keyword => normalized.includes(keyword));
    });
  }

  console.log('\n🔷🔷🔷 STEP 2: COLUMN DETECTION 🔷🔷🔷');
  console.log('Available columns in first file:', allColumns);
  console.log('\n📋 ALL COLUMN NAMES:');
  allColumns.forEach((col, idx) => console.log(`   ${idx + 1}. "${col}"`));
  
  console.log('\n✅ Auto-detected columns:');
  console.log('  Revenue Column:', revenueCol || '❌ NOT FOUND');
  console.log('  Invoice Column:', invoiceCol || 'Not found (duplicates won\'t be detected)');
  console.log('  Date Column:', dateCol || 'Not found');
  
  if (customerCol) {
    const normalized = normalizeColumnName(customerCol);
    const isIdColumn = normalized.includes('id') || normalized.includes('_id');
    console.log('  Customer Column:', customerCol, isIdColumn ? '(Customer ID - preferred)' : '(Customer Name)');
  } else {
    console.log('  Customer Column: Not found');
  }
  
  if (customerNameCol) {
    console.log('  Customer Name Column:', customerNameCol, '(for display)');
  }
  
  console.log('  Outstanding Column:', outstandingCol || '❌ NOT FOUND (cash analytics will be disabled)');
  
  if (outstandingCol) {
    console.log('  ✅ Cash flow analytics ENABLED - Outstanding column detected:', outstandingCol);
  } else {
    console.log('  ℹ️  To enable cash analytics, include a column with keywords: outstanding, balance, receivable, etc.');
    console.log('  ℹ️  Note: "Due Date" was excluded from matching to avoid false positives');
  }
  
  if (!revenueCol) {
    console.error('\n❌ CRITICAL ERROR: No revenue column detected!');
    console.error('   Please ensure your CSV has a column named: Total, Revenue, Sales, or Amount');
  }

  // Normalize column names across all files and add branch identifier
  // Use Invoice ID deduplication to prevent double-counting
  // FEATURE 3: Smart filter/assign logic
  console.log('\n🔷🔷🔷 STEP 3: SMART BRANCH ASSIGNMENT & FILTERING 🔷🔷🔷');
  
  // Track invoices per branch - store ROWS instead of just IDs to keep most recent
  const invoiceRowsByBranch = new Map<string, Map<string, ParsedRow>>();
  const combinedData: ParsedRow[] = [];
  let duplicateCount = 0;
  let duplicateReplacedCount = 0;
  let duplicateLogCount = 0; // Limit console spam from duplicate logging
  let invalidRevenueCount = 0;
  let filteredByBranchCount = 0;
  
  const branchRowCounts: Record<string, { total: number; valid: number; invalid: number; filtered: number }> = {};
  const branchRevenueRunning: Record<string, number> = {};
  
  for (const parsedItem of allParsedData) {
    const { data, branch } = parsedItem;
    const branchColumnName = (parsedItem as any).branchColumnName;
    const detectedBranches = (parsedItem as any).detectedBranches;
    const alreadySplitByBranch = (parsedItem as any).alreadySplitByBranch;
    const isEmbedded = (parsedItem as any).isEmbedded || false;
    const hasBranchData = branchColumnName && detectedBranches;
    
    branchRowCounts[branch] = { total: data.length, valid: 0, invalid: 0, filtered: 0 };
    branchRevenueRunning[branch] = 0;
    
    console.log(`\n  Processing ${branch}...`);
    
    if (alreadySplitByBranch) {
      console.log(`  ✅ ALREADY SPLIT: Data pre-filtered by branch (from multi-sheet or pre-split CSV)`);
      console.log(`     No filtering needed - all rows belong to ${branch}`);
    } else if (hasBranchData) {
      console.log(`  🔍 FILTER MODE: File has existing branch column "${branchColumnName}"`);
      console.log(`     Filtering for rows where "${branchColumnName}" = "${branch}"`);
      console.log(`     Available branch values in file: ${detectedBranches.join(', ')}`);
    } else {
      console.log(`  ✏️  ASSIGN MODE: No branch column, assigning all rows to: ${branch}`);
    }
    
    for (const row of data) {
      const revenue = cleanNumericValue(row[revenueCol]);
      
      if (revenue === 0 || isNaN(revenue)) {
        branchRowCounts[branch].invalid++;
        invalidRevenueCount++;
        continue; // Skip invalid rows
      }
      
      // FEATURE 3: Smart Filter/Assign Logic
      let finalBranchValue = branch; // Default to positional assignment
      
      if (alreadySplitByBranch) {
        // Data is already split by branch - no filtering needed
        // Just use the branch value assigned during splitting
        finalBranchValue = branch;
      } else if (hasBranchData && isEmbedded) {
        // Branch codes are embedded in Entity Name - extract them
        const entityNameValue = String(row[branchColumnName]).trim();
        const branchPattern = /\(([A-Z]{2,3})\)/; // Matches (NSW), (QLD), (WA), etc.
        const match = entityNameValue.match(branchPattern);
        
        let extractedBranch: string | null = null;
        let hasExplicitCode = false;
        
        if (match && match[1]) {
          // Found explicit branch code like "(NSW)" or "(QLD)"
          extractedBranch = match[1].toUpperCase();
          hasExplicitCode = true;
        } else if (entityNameValue) {
          // No branch code in parentheses - check if current branch expects these rows
          // This row belongs to the "implicit" branch (the one without explicit codes)
          extractedBranch = null; // Mark as implicit
          hasExplicitCode = false;
        }
        
        // Determine if this row should be included
        let shouldInclude = false;
        
        if (hasExplicitCode && extractedBranch) {
          // Row has explicit code - include only if it matches expected branch
          shouldInclude = extractedBranch === branch.toUpperCase();
        } else if (!hasExplicitCode) {
          // Row has NO explicit code - check if any explicit codes exist in detectedBranches
          // If current branch is NOT in the list of explicit branches, it gets the implicit rows
          const explicitBranches = detectedBranches.filter((b: string) => b !== '__NO_CODE__');
          const currentBranchHasCode = explicitBranches.some((b: string) => b.toUpperCase() === branch.toUpperCase());
          shouldInclude = !currentBranchHasCode; // Include if current branch has no explicit code
        }
        
        if (shouldInclude) {
          finalBranchValue = branch.toUpperCase();
        } else {
          // Row belongs to a different branch - filter it out
          branchRowCounts[branch].filtered++;
          filteredByBranchCount++;
          
          if (branchRowCounts[branch].filtered <= 3) {
            const reason = hasExplicitCode 
              ? `has code "${extractedBranch}"` 
              : `has NO code (expected explicit code "${branch}")`;
            console.log(`      ⊘ Filtered out: Row ${reason} but expected "${branch}"`);
          }
          continue;
        }
      } else if (hasBranchData) {
        // File has branch data - FILTER for expected branch
        const existingBranchValue = String(row[branchColumnName]).trim();
        
        // Check if this row matches the expected branch
        // Support case-insensitive matching
        if (existingBranchValue.toLowerCase() !== branch.toLowerCase()) {
          // Row doesn't match expected branch - skip it
          branchRowCounts[branch].filtered++;
          filteredByBranchCount++;
          
          // Log first few filtered rows for debugging
          if (branchRowCounts[branch].filtered <= 3) {
            console.log(`      ⊘ Filtered out: "${branchColumnName}" = "${existingBranchValue}" (expected "${branch}")`);
          }
          continue;
        }
        
        // Use the existing branch value (preserves original casing)
        finalBranchValue = existingBranchValue;
      }
      // else: No branch data - use positional assignment (finalBranchValue already set)
      
      // Check for duplicate Invoice ID within the same branch
      // For duplicates, keep the row with most recent date or lowest outstanding
      // IMPORTANT: Always keep negative values (credit notes) even if invoice ID is duplicate
      if (invoiceCol) {
        const invoiceId = String(row[invoiceCol]).trim();
        if (invoiceId) {
          // If this is a negative value (credit note/refund), always keep it regardless of duplicate invoice ID
          if (revenue < 0) {
            // Credit notes/refunds should always be included, even if they share an invoice ID
            // Don't check for duplicates - just add to combinedData
            // (will be added at the end of this iteration)
          } else {
            // For positive values, apply normal duplicate detection
            // Initialize branch-specific invoice map if needed
            if (!invoiceRowsByBranch.has(finalBranchValue)) {
              invoiceRowsByBranch.set(finalBranchValue, new Map<string, ParsedRow>());
            }
            
            const branchInvoices = invoiceRowsByBranch.get(finalBranchValue)!;
            
            // Check if invoice already exists IN THIS BRANCH
            if (branchInvoices.has(invoiceId)) {
              duplicateCount++;
              
              // Get existing row for comparison
              const existingRow = branchInvoices.get(invoiceId)!;
              
              // Determine which row to keep (prefer EARLIEST date for consistency with separate CSVs)
              let keepNewRow = false;
              
              // Strategy 1: If date column exists, keep the row with EARLIEST date
              if (dateCol) {
                const existingDate = parseFlexibleDate(String(existingRow[dateCol]));
                const newDate = parseFlexibleDate(String(row[dateCol]));
                
                if (newDate && existingDate && newDate < existingDate) {
                  keepNewRow = true;
                  if (duplicateLogCount < 5) {
                    console.log(`  📅 Invoice ${invoiceId}: Keeping EARLIER row (${String(row[dateCol])} vs ${String(existingRow[dateCol])})`);
                    duplicateLogCount++;
                  }
                }
              }
              
              // Strategy 2: Fallback - if dates are equal or missing, prefer higher revenue amount
              // This handles cases where the same invoice ID has different amounts
              if (!keepNewRow && revenueCol) {
                const existingRevenue = cleanNumericValue(existingRow[revenueCol]);
                const newRevenue = cleanNumericValue(row[revenueCol]);
                
                if (newRevenue > existingRevenue) {
                  keepNewRow = true;
                  duplicateReplacedCount++;
                  if (duplicateLogCount < 5) {
                    console.log(`  💰 Invoice ${invoiceId}: Keeping row with higher revenue ($${newRevenue} vs $${existingRevenue})`);
                    duplicateLogCount++;
                  }
                }
              }
              
              // If we're keeping the new row, update the map
              if (keepNewRow) {
                // Update map with new row (but we do NOT remove the existing row from combinedData 
                // anymore, so that all rows are summed exactly like the raw CSV)
                branchInvoices.set(invoiceId, { ...row, branch: finalBranchValue });
              } else {
                // We no longer skip duplicate rows, we include everything
                // to match Weekly Sales's simple SUM approach.
              }
            } else {
              // First time seeing this invoice - add to map
              branchInvoices.set(invoiceId, { ...row, branch: finalBranchValue });
            }
          }
        }
      }
      
      // Add branch identifier to each row
      branchRowCounts[branch].valid++;
      branchRevenueRunning[branch] += revenue;
      combinedData.push({
        ...row,
        branch: finalBranchValue,
      });
    }
    
    console.log(`    Valid rows: ${branchRowCounts[branch].valid}`);
    if (hasBranchData) {
      console.log(`    Rows filtered out (wrong branch): ${branchRowCounts[branch].filtered}`);
    }
    console.log(`    Revenue so far: ${branchRevenueRunning[branch].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  
  console.log('\nRow counts per branch:');
  Object.entries(branchRowCounts).forEach(([branch, counts]) => {
    console.log(`  ${branch}:`, counts);
  });
  
  // Log invoice tracking per branch
  if (invoiceRowsByBranch.size > 0) {
    console.log('\nUnique invoices tracked per branch:');
    invoiceRowsByBranch.forEach((invoices, branch) => {
      console.log(`  ${branch}: ${invoices.size} unique invoices`);
    });
  }
  
  console.log('\nFiltering summary:');
  console.log('  Rows with invalid revenue (<=0):', invalidRevenueCount);
  console.log('  Rows filtered by branch mismatch:', filteredByBranchCount);
  console.log('  Duplicate invoices encountered:', duplicateCount);
  console.log('  └─ Duplicates skipped (older payment state):', duplicateCount - duplicateReplacedCount);
  console.log('  └─ Duplicates replaced with newer state:', duplicateReplacedCount);
  if (duplicateCount > 5) {
    console.log('  ℹ️  (Showing first 5 duplicate resolution logs only)');
  }

  console.log('\n🔷🔷🔷 STEP 4: COMBINED DATA 🔷🔷🔷');
  console.log('Total valid rows after all filtering:', combinedData.length);

  
  if (combinedData.length < 1000) {
    console.warn('\n⚠️  WARNING: Row count is very low!');
    console.warn('   This suggests:');
    console.warn('   1. Not all branch files were uploaded');
    console.warn('   2. Files are truncated or corrupted');
    console.warn('   3. Wrong column is being used for revenue');
  }

  if (combinedData.length === 0) {
    throw new Error('No valid data found in any branch files');
  }

  // Calculate total revenue (NO rounding before sum)
  console.log('\n🔷🔷🔷 STEP 5: CALCULATING REVENUE 🔷🔷🔷');
  console.log('Summing revenue from column:', revenueCol);
  console.log('Using ALL rows in combinedData:', combinedData.length, 'rows');
  console.log('\nSample values from first 5 rows:');
  for (let i = 0; i < Math.min(5, combinedData.length); i++) {
    const rawValue = combinedData[i][revenueCol];
    const cleanedValue = cleanNumericValue(rawValue);
    const branch = combinedData[i].branch;
    console.log(`  Row ${i + 1} (${branch}): "${rawValue}" → ${cleanedValue}`);
  }
  
  console.log('\n🔢 Starting revenue calculation...');
  let totalRevenue = 0;
  let rowsIncluded = 0;
  let rowsSkipped = 0;
  
  combinedData.forEach((row, index) => {
    const revenue = cleanNumericValue(row[revenueCol]);
    if (revenue !== 0 && !isNaN(revenue)) {
      totalRevenue += revenue;
      rowsIncluded++;
    } else {
      rowsSkipped++;
      if (rowsSkipped <= 5) {
        console.log(`  ⚠️  Skipping row ${index + 1}: revenue = ${revenue} (raw: "${row[revenueCol]}")`);
      }
    }
  });
  
  // Apply floating point rounding fix
  totalRevenue = Math.round(totalRevenue * 100) / 100;
  
  console.log('\n📋 Revenue calculation summary:');
  console.log('  Rows included in calculation:', rowsIncluded);
  console.log('  Rows skipped (<= 0):', rowsSkipped);
  console.log('  Total revenue calculated:', totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  
  if (rowsIncluded !== combinedData.length - rowsSkipped) {
    console.error('\n❌ CALCULATION ERROR: Row count mismatch!');
  }

  // Calculate total outstanding if column exists
  let totalOutstanding = 0;
  if (outstandingCol && outstandingCol !== dateCol) {
    console.log('\n💰 💰 💰 CASH FLOW CALCULATION 💰 💰 💰');
    console.log('Calculating total outstanding from column:', outstandingCol);
    let outstandingRowsIncluded = 0;
    let outstandingRowsZero = 0;
    
    // Show first 3 sample values
    console.log('\nSample outstanding values (first 3 rows):');
    for (let i = 0; i < Math.min(3, combinedData.length); i++) {
      const rawValue = combinedData[i][outstandingCol];
      const cleanedValue = cleanNumericValue(rawValue);
      console.log(`  Row ${i + 1}: "${rawValue}" → ${cleanedValue}`);
    }
    
    combinedData.forEach((row) => {
      const outstanding = cleanNumericValue(row[outstandingCol]);
      if (outstanding > 0) {
        totalOutstanding += outstanding;
        outstandingRowsIncluded++;
      } else {
        outstandingRowsZero++;
      }
    });
    
    // Apply floating point rounding fix
    totalOutstanding = Math.round(totalOutstanding * 100) / 100;
    
    console.log('\n📊 Outstanding Calculation Results:');
    console.log('  Total outstanding calculated:', totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    console.log('  Rows with outstanding > 0:', outstandingRowsIncluded);
    console.log('  Rows with outstanding = 0:', outstandingRowsZero);
    console.log('  Stuck %:', totalRevenue > 0 ? ((totalOutstanding / totalRevenue) * 100).toFixed(2) + '%' : 'N/A');
  } else {
    if (outstandingCol === dateCol) {
      console.log('\n⚠️  Outstanding column detection error: matched date column instead');
      console.log('   This has been corrected - outstanding set to 0');
    } else {
      console.log('\n⚠️  No Outstanding column detected - cash analytics disabled');
    }
  }

  // Calculate revenue by branch
  const branchRevenueMap = new Map<string, number>();
  combinedData.forEach(row => {
    const branch = String(row.branch);
    const revenue = cleanNumericValue(row[revenueCol]);
    const currentTotal = branchRevenueMap.get(branch) || 0;
    // Apply floating point rounding fix
    branchRevenueMap.set(branch, Math.round((currentTotal + revenue) * 100) / 100);
  });

  // Recalculate totalRevenue from rounded branch totals to ensure consistency
  // This prevents $1 rounding differences between sum of segments and total
  totalRevenue = Array.from(branchRevenueMap.values()).reduce((sum, rev) => sum + rev, 0);
  totalRevenue = Math.round(totalRevenue * 100) / 100;

  // Debug logs for revenue verification
  console.log('\n�🔷🔷 STEP 6: FINAL REVENUE TOTALS 🔷🔷🔷');
  console.log('\n💰 CALCULATED TOTALS:');
  branchRevenueMap.forEach((revenue, branch) => {
    console.log(`  ${branch}: ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  });
  console.log(`  TOTAL: ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  
  console.log('\n🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n');

  // Extract branch codes from full company names (e.g., "Connect Resources (NSW) Pty Ltd" -> "NSW")
  console.log('🏷️  Normalizing branch names to branch codes...');
  const segments = Array.from(branchRevenueMap.entries())
    .map(([name, revenue]) => {
      const branchCode = extractBranchCode(name);
      console.log(`  "${name}" -> "${branchCode}"`);
      return {
        name: branchCode,
        revenue,
        sharePct: (revenue / totalRevenue) * 100,
        yoyPct: null, // Would need historical data
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  console.log('\n📊 Segments created:');
  segments.forEach(seg => {
    console.log(`  ${seg.name}: ${seg.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${seg.sharePct.toFixed(2)}%)`);
  });
  console.log('\n🚀 Data pipeline complete - segments ready for dashboard display');

  const primarySegment = segments[0]?.name || 'Unknown';

  // Calculate top customers across all branches
  const customerMap = new Map<string, { name: string; revenue: number }>();
  if (customerCol) {
    combinedData.forEach(row => {
      const customerId = String(row[customerCol]).trim();
      if (!customerId) return; // Skip empty customer IDs
      
      const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customerId;
      const revenue = cleanNumericValue(row[revenueCol]);
      
      if (revenue !== 0 && !isNaN(revenue)) {
        const current = customerMap.get(customerId);
        const currentRevenue = current?.revenue || 0;
        // Apply floating point rounding fix
        customerMap.set(customerId, {
          name: customerName || customerId, // Fallback to ID if name is empty
          revenue: Math.round((currentRevenue + revenue) * 100) / 100
        });
      }
    });
  }

  const topCustomersByRevenue = Array.from(customerMap.entries())
    .map(([customer, data]) => ({ 
      customer, 
      customerName: data.name,
      revenue: data.revenue 
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Build top customers by outstanding if we have outstanding data
  const topCustomersByOutstanding: Array<{ customer: string; customerName?: string; outstanding: number }> = [];
  if (outstandingCol && outstandingCol !== dateCol && customerCol) {
    console.log('\n👥 Building Top Customers by Outstanding...');
    console.log('   Using outstanding column:', outstandingCol);
    const customerCashMap = new Map<string, { name: string; revenue: number; outstanding: number }>();
    
    combinedData.forEach(row => {
      const customerId = String(row[customerCol]).trim();
      if (!customerId) return;
      
      const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customerId;
      const revenue = cleanNumericValue(row[revenueCol]);
      const outstanding = cleanNumericValue(row[outstandingCol]);
      
      if (!customerCashMap.has(customerId)) {
        customerCashMap.set(customerId, { name: customerName || customerId, revenue: 0, outstanding: 0 });
      }
      
      const customerData = customerCashMap.get(customerId)!;
      // Apply floating point rounding fix during accumulation
      customerData.revenue = Math.round((customerData.revenue + revenue) * 100) / 100;
      customerData.outstanding = Math.round((customerData.outstanding + outstanding) * 100) / 100;
    });
    
    topCustomersByOutstanding.push(
      ...Array.from(customerCashMap.entries())
        .map(([customer, data]) => ({ 
          customer,
          customerName: data.name,
          // Apply floating point rounding fix
          outstanding: Math.round(data.outstanding * 100) / 100
        }))
        .filter(c => c.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5)
    );
    
    console.log('  Top 5 Customers by Outstanding:');
    if (topCustomersByOutstanding.length > 0) {
      topCustomersByOutstanding.forEach((c, idx) => {
        console.log(`    ${idx + 1}. ${c.customerName || c.customer}: ${c.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      });
    } else {
      console.log('    No customers with outstanding > 0');
    }
  }

  // ===================================================================
  // BP3: DYNAMIC CASH DECISION GENERATION (Multi-Branch)
  // ===================================================================
  
  const generateMultiBranchCashDecision = (): string => {
    const { paymentStatusCol, paymentDateCol, paidAmountCol } = detection;
    const hasPaymentTracking = !!(paymentStatusCol || paymentDateCol || paidAmountCol);

    // No outstanding data detected at all
    if (!outstandingCol || totalOutstanding === 0) {
      return 'Outstanding balance data not detected. Include Outstanding Amount, Balance, or Receivable columns to enable cash flow tracking.';
    }

    // Calculate stuck percentage
    const stuckPct = totalRevenue > 0 ? (totalOutstanding / totalRevenue) * 100 : 0;

    // Build payment tracking status message
    let paymentTrackingMsg = '';
    if (hasPaymentTracking) {
      const detectedCols = [paymentStatusCol, paymentDateCol, paidAmountCol].filter(Boolean);
      paymentTrackingMsg = ` Payment tracking detected: ${detectedCols.join(', ')}.`;
    } else {
      paymentTrackingMsg = ' Payment details (Payment Status/Payment Date/Paid Amount) not detected - integrate with accounting system for complete tracking.';
    }

    // Analyze stuck percentage across all branches
    if (stuckPct >= CASH_THRESHOLDS.CRITICAL) {
      return `${formatCurrency(totalOutstanding)} outstanding across ${segments.length} branches (${stuckPct.toFixed(1)}% of billed). CRITICAL: Nearly all invoices unpaid. This may indicate: (1) Data contains only unpaid invoices, or (2) Payment tracking columns missing.${paymentTrackingMsg} Verify data completeness.`;
    } else if (stuckPct >= CASH_THRESHOLDS.HIGH_RISK) {
      return `${formatCurrency(totalOutstanding)} outstanding across ${segments.length} branches (${stuckPct.toFixed(1)}% of billed). HIGH RISK: Majority of revenue uncollected. Immediate action: Review aging by branch, contact top debtors, escalate overdue accounts.${paymentTrackingMsg}`;
    } else if (stuckPct >= CASH_THRESHOLDS.ABOVE_HEALTHY) {
      return `${formatCurrency(totalOutstanding)} outstanding across ${segments.length} branches (${stuckPct.toFixed(1)}% of billed). Above healthy threshold (${CASH_THRESHOLDS.ABOVE_HEALTHY}%). Recommendation: Prioritize collections by branch, review payment terms, consider early payment incentives.${paymentTrackingMsg}`;
    } else if (stuckPct >= CASH_THRESHOLDS.NORMAL) {
      return `${formatCurrency(totalOutstanding)} outstanding across ${segments.length} branches (${stuckPct.toFixed(1)}% of billed). Within normal range. Collections performing adequately across branches. Monitor aging to prevent escalation.${paymentTrackingMsg}`;
    } else {
      return `${formatCurrency(totalOutstanding)} outstanding across ${segments.length} branches (${stuckPct.toFixed(1)}% of billed). EXCELLENT: Strong collections performance across all branches. Maintain current processes.${paymentTrackingMsg}`;
    }
  };

  const multiBranchBp3Decision = generateMultiBranchCashDecision();

  // ===================================================================
  // BP4: DYNAMIC CONCENTRATION DECISION GENERATION (Multi-Branch Mode)
  // ===================================================================

  const generateMultiBranchConcentrationDecision = (): string => {
    const top5Pct = topCustomersByRevenue.slice(0, 5).reduce((sum, c) => sum + c.revenue, 0) / totalRevenue * 100;
    const top1CustomerPct = (topCustomersByRevenue[0]?.revenue || 0) / totalRevenue * 100;
    const uniqueCustomers = topCustomersByRevenue.length;

    // Edge case: No customers
    if (uniqueCustomers === 0) {
      return 'No customer data available for concentration analysis.';
    }

    // Edge case: Single customer (100% concentration)
    if (uniqueCustomers === 1) {
      return `Single customer across ${segments.length} branches. 100% concentration is structural - all revenue from one customer.`;
    }

    // Structural concentration: Small dataset (≤5 customers)
    if (uniqueCustomers <= CONCENTRATION_THRESHOLDS.STRUCTURAL_SIZE) {
      return `Dataset has ${uniqueCustomers} customers across ${segments.length} branches. Concentration of ${top1CustomerPct.toFixed(1)}% (top customer) and ${top5Pct.toFixed(1)}% (top 5) reflects structural dataset size rather than business risk. Metrics valid only for larger customer bases.`;
    }

    // Real business concentration analysis (≥10 customers)
    if (uniqueCustomers >= CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK) {
      
      // CRITICAL: Single customer dominance (>50%)
      if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_CRITICAL) {
        return `🚨 CRITICAL RISK: Top customer represents ${top1CustomerPct.toFixed(1)}% of revenue across ${segments.length} branches (${formatCurrency((topCustomersByRevenue[0]?.revenue || 0))} of ${formatCurrency(totalRevenue)}). Single customer dependency - losing this customer would be catastrophic. URGENT: Diversify immediately through new customer acquisition and reducing reliance on this account.`;
      }

      // HIGH RISK: Top customer >40% OR Top 5 >80%
      if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK) {
        return `⚠️ HIGH RISK: Top customer accounts for ${top1CustomerPct.toFixed(1)}% of revenue across ${segments.length} branches. Significant customer dependency risk. Recommended: Diversify customer base, reduce single-customer reliance to below ${CONCENTRATION_THRESHOLDS.TOP1_HIGH_RISK}%, and develop contingency plans.`;
      }

      if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_CRITICAL) {
        return `⚠️ HIGH RISK: Top 5 customers represent ${top5Pct.toFixed(1)}% of revenue across ${segments.length} branches. Extreme concentration in few accounts - losing any key customer could significantly impact revenue. Recommended: Accelerate new customer acquisition to reduce dependence on top accounts.`;
      }

      // MODERATE RISK: Top customer 30-40% OR Top 5 60-80%
      if (top1CustomerPct > CONCENTRATION_THRESHOLDS.TOP1_MODERATE) {
        const top1Amount = formatCurrency((topCustomersByRevenue[0]?.revenue || 0));
        return `⚡ MODERATE RISK: Top customer contributes ${top1CustomerPct.toFixed(1)}% (${top1Amount}) across ${segments.length} branches. Concentration trending towards risk zone. Recommended: Monitor relationship health, diversify pipeline, aim to reduce top1 concentration below ${CONCENTRATION_THRESHOLDS.TOP1_MODERATE}%.`;
      }

      if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_HIGH_RISK) {
        return `⚡ MODERATE RISK: Top 5 customers account for ${top5Pct.toFixed(1)}% of revenue across ${segments.length} branches. Notable concentration - consider diversification strategy. Aim to reduce top5 concentration to below ${CONCENTRATION_THRESHOLDS.TOP5_MODERATE}% through customer acquisition.`;
      }

      // MONITORING: Top 5 between 40-60%
      if (top5Pct > CONCENTRATION_THRESHOLDS.TOP5_MONITORING) {
        return `📊 MONITOR: Top 5 customers represent ${top5Pct.toFixed(1)}% of revenue, top customer ${top1CustomerPct.toFixed(1)}% across ${segments.length} branches. Concentration within acceptable range but should monitor trends. Continue balanced customer acquisition to maintain diversification.`;
      }

      // HEALTHY: Well-diversified
      return `✅ HEALTHY: Well-diversified customer base across ${segments.length} branches. Top customer ${top1CustomerPct.toFixed(1)}%, top 5 customers ${top5Pct.toFixed(1)}% of revenue. Excellent distribution across ${uniqueCustomers} customers. Maintain current diversification strategy.`;
    }

    // Medium dataset (6-9 customers) - between structural and real risk
    return `Dataset has ${uniqueCustomers} customers across ${segments.length} branches. Top customer: ${top1CustomerPct.toFixed(1)}%, Top 5: ${top5Pct.toFixed(1)}%. Concentration metrics may be influenced by limited dataset size. For robust risk assessment, grow customer base above ${CONCENTRATION_THRESHOLDS.MINIMUM_REAL_RISK} customers.`;
  };

  const multiBranchBp4Decision = generateMultiBranchConcentrationDecision();

  // ===================================================================
  // BP3: DYNAMIC CASH DECISION GENERATION (Single-Branch)
  // ===================================================================
  
  const generateCashDecision = (): string => {
    const { paymentStatusCol, paymentDateCol, paidAmountCol } = detection;
    const hasPaymentTracking = !!(paymentStatusCol || paymentDateCol || paidAmountCol);

    // No outstanding data detected at all
    if (!outstandingCol || totalOutstanding === 0) {
      return 'Outstanding balance data not detected. Include Outstanding Amount, Balance, or Receivable columns to enable cash flow tracking.';
    }

    // Calculate stuck percentage
    const stuckPct = totalRevenue > 0 ? (totalOutstanding / totalRevenue) * 100 : 0;

    // Build payment tracking status message
    let paymentTrackingMsg = '';
    if (hasPaymentTracking) {
      const detectedCols = [paymentStatusCol, paymentDateCol, paidAmountCol].filter(Boolean);
      paymentTrackingMsg = ` Payment tracking detected: ${detectedCols.join(', ')}.`;
    } else {
      paymentTrackingMsg = ' Payment details (Payment Status/Payment Date/Paid Amount) not detected - integrate with accounting system for complete tracking.';
    }

    // Analyze stuck percentage and provide context-aware recommendations
    if (stuckPct >= CASH_THRESHOLDS.CRITICAL) {
      return `${formatCurrency(totalOutstanding)} outstanding (${stuckPct.toFixed(1)}% of billed). CRITICAL: Nearly all invoices unpaid. This may indicate: (1) Data contains only unpaid invoices, or (2) Payment tracking columns missing.${paymentTrackingMsg} Verify data completeness.`;
    } else if (stuckPct >= CASH_THRESHOLDS.HIGH_RISK) {
      return `${formatCurrency(totalOutstanding)} outstanding (${stuckPct.toFixed(1)}% of billed). HIGH RISK: Majority of revenue uncollected. Immediate action: Review aging report, contact top debtors, escalate overdue accounts.${paymentTrackingMsg}`;
    } else if (stuckPct >= CASH_THRESHOLDS.ABOVE_HEALTHY) {
      return `${formatCurrency(totalOutstanding)} outstanding (${stuckPct.toFixed(1)}% of billed). Above healthy threshold (${CASH_THRESHOLDS.ABOVE_HEALTHY}%). Recommendation: Prioritize collections, review payment terms, consider early payment incentives.${paymentTrackingMsg}`;
    } else if (stuckPct >= CASH_THRESHOLDS.NORMAL) {
      return `${formatCurrency(totalOutstanding)} outstanding (${stuckPct.toFixed(1)}% of billed). Within normal range. Collections performing adequately. Monitor aging to prevent escalation.${paymentTrackingMsg}`;
    } else {
      return `${formatCurrency(totalOutstanding)} outstanding (${stuckPct.toFixed(1)}% of billed). EXCELLENT: Strong collections performance. Maintain current processes.${paymentTrackingMsg}`;
    }
  };

  const bp3Decision = generateCashDecision();

  // Calculate revenue over time
  const dateRevenueMap = new Map<string, { revenue: number; branch: string }>();
  if (dateCol) {
    combinedData.forEach(row => {
      const date = String(row[dateCol]);
      const revenue = cleanNumericValue(row[revenueCol]);
      const branch = String(row.branch);
      if (revenue !== 0 && !isNaN(revenue)) {
        const key = `${date}-${branch}`;
        const existing = dateRevenueMap.get(key);
        if (existing) {
          existing.revenue += revenue;
        } else {
          dateRevenueMap.set(key, { revenue, branch });
        }
      }
    });
  }

  // Helper function to calculate FY from a date string (multi-branch)
  const getFYFromDate = (dateStr: string): string => {
    const date = parseFlexibleDate(dateStr);
    if (!date) {
      // Invalid date, use current FY
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const fyStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      const fyEndYear = fyStartYear + 1;
      return `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    // FY starts in July (month 7)
    const fyStartYear = month >= 7 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;
    return `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
  };

  // Calculate revenue by FY based on transaction dates
  const revenueByFyMap = new Map<string, number>();
  
  if (dateCol) {
    console.log('\n📅 Grouping multi-branch revenue by Financial Year based on date column:', dateCol);
    let parsedCount = 0;
    let failedCount = 0;
    const sampleDates: string[] = [];
    
    combinedData.forEach(row => {
      const dateStr = String(row[dateCol]);
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue !== 0 && !isNaN(revenue)) {
        const fy = getFYFromDate(dateStr);
        revenueByFyMap.set(fy, (revenueByFyMap.get(fy) || 0) + revenue);
        
        // Track parsing success
        const parsed = parseFlexibleDate(dateStr);
        if (parsed) {
          parsedCount++;
          if (sampleDates.length < 3) {
            sampleDates.push(`"${dateStr}" → ${parsed.toISOString().split('T')[0]} → ${fy}`);
          }
        } else {
          failedCount++;
        }
      }
    });
    
    console.log(`  Parsed ${parsedCount} dates successfully, ${failedCount} failed`);
    console.log('  Sample date parsing:');
    sampleDates.forEach(s => console.log(`    ${s}`));
    console.log('\n  FY Revenue Distribution:');
    Array.from(revenueByFyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([fy, rev]) => {
        console.log(`    ${fy}: $${rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      });
  } else {
    // No date column - use current FY for all revenue
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const fyStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    const currentFY = `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
    revenueByFyMap.set(currentFY, totalRevenue);
  }
  
  // Sort FYs chronologically and calculate YoY growth
  const sortedFYs = Array.from(revenueByFyMap.entries())
    .sort((a, b) => {
      const fyA = parseInt(a[0].replace('FY', '').split('/')[0]);
      const fyB = parseInt(b[0].replace('FY', '').split('/')[0]);
      return fyA - fyB;
    });
  
  const revenueByFy = sortedFYs.map(([fy, revenue], index) => {
    let yoyGrowthPct: number | null = null;
    if (index > 0) {
      const prevRevenue = sortedFYs[index - 1][1];
      if (prevRevenue > 0) {
        yoyGrowthPct = ((revenue - prevRevenue) / prevRevenue) * 100;
      }
    }
    return { fy, revenue, yoyGrowthPct };
  });

  // ===================================================================
  // ANALYTICS DATA CALCULATIONS - WITH PROPER DATE PARSING
  // ===================================================================
  
  console.log('\n📊 Building Analytics Data...');
  
  // Helper: Get week number in FY (July = Week 1)
  const getFYWeek = (date: Date, fyStartYear: number): number => {
    const fyStart = new Date(fyStartYear, 6, 1); // July 1st
    const diffTime = date.getTime() - fyStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };
  
  // 1. Weekly Trend - FY Week breakdown by branch
  const weeklyTrendMap = new Map<string, { fy: string; fyWeek: number; branch: string; revenue: number }>();
  
  if (dateCol) {
    combinedData.forEach(row => {
      const dateStr = String(row[dateCol]);
      const date = parseFlexibleDate(dateStr);
      if (!date) return;
      
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue === 0 || isNaN(revenue)) return;
      
      const branch = String(row.branch);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const fyStartYear = month >= 7 ? year : year - 1;
      const fy = `FY${String(fyStartYear).slice(-2)}/${String(fyStartYear + 1).slice(-2)}`;
      const fyWeek = getFYWeek(date, fyStartYear);
      
      const key = `${fy}-W${fyWeek}-${branch}`;
      const existing = weeklyTrendMap.get(key);
      
      if (existing) {
        existing.revenue += revenue;
      } else {
        weeklyTrendMap.set(key, { fy, fyWeek, branch, revenue });
      }
    });
  }
  
  const weeklyTrend = Array.from(weeklyTrendMap.values())
    .sort((a, b) => {
      const fyCompare = a.fy.localeCompare(b.fy);
      if (fyCompare !== 0) return fyCompare;
      return a.fyWeek - b.fyWeek;
    });
  
  console.log(`  Weekly Trend: ${weeklyTrend.length} data points`);
  
  // 2. Monthly Branch Data - Month/Year breakdown by branch
  const monthlyBranchMap = new Map<string, { month: string; branch: string; revenue: number }>();
  
  if (dateCol) {
    combinedData.forEach(row => {
      const dateStr = String(row[dateCol]);
      const date = parseFlexibleDate(dateStr);
      if (!date) return;
      
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue === 0 || isNaN(revenue)) return;
      
      const branch = String(row.branch);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      
      const key = `${monthStr}-${branch}`;
      const existing = monthlyBranchMap.get(key);
      
      if (existing) {
        existing.revenue += revenue;
      } else {
        monthlyBranchMap.set(key, { month: monthStr, branch, revenue });
      }
    });
  }
  
  const monthlyBranch = Array.from(monthlyBranchMap.values())
    .sort((a, b) => a.month.localeCompare(b.month));
  
  console.log(`  Monthly Branch: ${monthlyBranch.length} data points`);
  
  // 3. FY Comparison - Revenue by FY and Branch  
  const fyComparisonMap = new Map<string, { fy: string; branch: string; total: number }>();
  
  if (dateCol) {
    combinedData.forEach(row => {
      const dateStr = String(row[dateCol]);
      const date = parseFlexibleDate(dateStr);
      if (!date) return;
      
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue === 0 || isNaN(revenue)) return;
      
      const branch = String(row.branch);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const fyStartYear = month >= 7 ? year : year - 1;
      const fy = `FY${String(fyStartYear).slice(-2)}/${String(fyStartYear + 1).slice(-2)}`;
      
      const key = `${fy}-${branch}`;
      const existing = fyComparisonMap.get(key);
      
      if (existing) {
        existing.total += revenue;
      } else {
        fyComparisonMap.set(key, { fy, branch, total: revenue });
      }
    });
  }
  
  const fyComparison = Array.from(fyComparisonMap.values())
    .sort((a, b) => {
      const fyCompare = a.fy.localeCompare(b.fy);
      if (fyCompare !== 0) return fyCompare;
      return a.branch.localeCompare(b.branch);
    });
  
  console.log(`  FY Comparison: ${fyComparison.length} data points`);
  console.log('  Analytics data ready ✅');

  // Calculate seasonality for multi-branch before building response
  console.log('\n📊 Building Multi-Branch Seasonality Data...');
  const seasonalityData: Array<{ period: string; revenue: number }> = [];
  
  if (dateCol) {
    const periodRevenueMap = new Map<string, number>();
    
    combinedData.forEach(row => {
      const dateStr = String(row[dateCol]);
      const revenue = cleanNumericValue(row[revenueCol]);
      if (revenue === 0 || isNaN(revenue)) return;
      
      const date = parseFlexibleDate(dateStr);
      if (!date) return;
      
      // Group by quarter (Q1, Q2, Q3, Q4)
      const month = date.getMonth() + 1; // 1-12
      const quarter = Math.ceil(month / 3);
      const year = date.getFullYear();
      const period = `${year} Q${quarter}`;
      
      periodRevenueMap.set(period, (periodRevenueMap.get(period) || 0) + revenue);
    });
    
    seasonalityData.push(...Array.from(periodRevenueMap.entries())
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period)));
    
    console.log(`  Generated ${seasonalityData.length} seasonal periods`);
    if (seasonalityData.length > 0) {
      console.log('  Periods:', seasonalityData.map(s => s.period).join(', '));
    }
  }

  // ===================================================================
  // BP2: DYNAMIC TARGET DECISION GENERATION (Multi-Branch)
  // ===================================================================
  
  const generateMultiBranchTargetDecision = (): string => {
    // Minimum 2 years required for trend analysis
    if (revenueByFy.length < 2) {
      return `Current revenue across ${segments.length} branches: ${formatCurrency(totalRevenue)}. Insufficient historical data for multi-year comparison (need ≥2 complete fiscal years). Add prior year data to enable growth trend analysis.`;
    }

    // Filter complete FYs (exclude partial or future years)
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const todayFYStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const todayFYEndYear = todayFYStartYear + 1;
    const currentFY = `FY${String(todayFYStartYear).slice(-2)}/${String(todayFYEndYear).slice(-2)}`;

    const completeFYs = revenueByFy.filter(fy => {
      const fyStartStr = fy.fy.split('/')[0].replace('FY', '');
      const fyStartYear = parseInt('20' + fyStartStr);
      return fyStartYear < todayFYStartYear || fy.fy === currentFY;
    });

    // Extract YoY growth values from complete years
    const growthValues = completeFYs
      .map(fy => fy.yoyGrowthPct)
      .filter((v): v is number => v !== null);

    if (growthValues.length === 0) {
      return `Current revenue across ${segments.length} branches: ${formatCurrency(totalRevenue)}. Single complete year detected. Add data from previous years to calculate growth trends and recommended targets.`;
    }

    // Calculate average YoY growth and get latest metrics
    const avgGrowth = parseFloat((growthValues.reduce((sum, v) => sum + v, 0) / growthValues.length).toFixed(1));
    const latestFY = completeFYs[completeFYs.length - 1];
    const latestGrowth = latestFY.yoyGrowthPct !== null ? parseFloat(latestFY.yoyGrowthPct.toFixed(1)) : avgGrowth;

    // Detect trend narrative
    let trendDescription = '';
    if (latestGrowth > avgGrowth + 10) {
      trendDescription = `Growth accelerating (latest: +${latestGrowth.toFixed(1)}% vs avg: +${avgGrowth.toFixed(1)}%)`;
    } else if (latestGrowth < avgGrowth - 10) {
      trendDescription = `Growth slowing (latest: ${latestGrowth >= 0 ? '+' : ''}${latestGrowth.toFixed(1)}% vs avg: +${avgGrowth.toFixed(1)}%)`;
    } else {
      trendDescription = `Steady growth averaging +${avgGrowth.toFixed(1)}% YoY`;
    }

    // Calculate conservative target (use lower of average or latest growth)
    const targetGrowth = latestGrowth !== null && latestGrowth < avgGrowth ? latestGrowth : avgGrowth;
    const recommendedTarget = latestFY.revenue * (1 + targetGrowth / 100);

    return `${trendDescription}. Based on ${growthValues.length} years across ${segments.length} branches, recommended target: ${formatCurrency(recommendedTarget)} (~${targetGrowth >= 0 ? '+' : ''}${targetGrowth.toFixed(1)}% growth).`;
  };

  const bp2Decision = generateMultiBranchTargetDecision();

  // Build complete response
  const analysisResponse: AnalysisResponse = {
    segments,
    primarySegment,
    
    revenueByFy,

    cash: {
      totalBilled: totalRevenue,
      totalOutstanding: totalOutstanding,
      stuckPct: totalRevenue > 0 ? (totalOutstanding / totalRevenue) * 100 : 0,
    },

    topCustomersByOutstanding: topCustomersByOutstanding,

    topCustomersByRevenue,

    concentration: {
      top5Pct: topCustomersByRevenue.slice(0, 5).reduce((sum, c) => sum + c.revenue, 0) / totalRevenue * 100,
      top1CustomerPct: (topCustomersByRevenue[0]?.revenue || 0) / totalRevenue * 100,
    },

    expansion: segments.slice(1).map(seg => {
      const pct = (seg.revenue / segments[0].revenue) * 100;
      const decision = generateExpansionDecision(seg.name, pct);
      
      return {
        segment: seg.name,
        pctOfPrimary: pct,
        yoyPct: null, // No historical data for comparison
        decision,
      };
    }),

    seasonality: seasonalityData,

    onTrack: {
      target: revenueTarget || 0, // No target unless specified
      ytd: totalRevenue,
      onTrackPct: revenueTarget ? (totalRevenue / revenueTarget) * 100 : 0,
      ytdVsLastYearPct: null, // No historical data for YoY comparison
      decision: "Multi-branch analysis",
    },

    customerTrends: (() => {
      // Calculate customer trends only if we have multi-year data and customer + date columns
      if (!customerCol || !dateCol || revenueByFy.length < VALIDATION_THRESHOLDS.MINIMUM_PERIODS_FOR_TRENDS) {
        return {
          dropping: [],
          rising: [],
          churnCount: 0,
          acquisitionCount: 0,
        };
      }
      
      console.log('\n📈 MULTI-BRANCH CUSTOMER TREND ANALYSIS');
      console.log('='.repeat(50));
      
      // Step 1: Calculate current FY to identify partial/future periods
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const currentFyStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      const todayFY = `FY${String(currentFyStartYear).slice(-2)}/${String(currentFyStartYear + 1).slice(-2)}`;
      
      console.log(`Today's Date: ${today.toLocaleDateString()}`);
      console.log(`Current FY (today): ${todayFY}`);
      
      // Step 2: Filter out partial/future FYs - only use COMPLETE historical FYs
      const completeFYs = revenueByFy.filter(fy => {
        const fyStartYear = parseInt('20' + fy.fy.slice(2, 4));
        const todayStartYear = currentFyStartYear;
        const isComplete = fyStartYear < todayStartYear;
        
        if (!isComplete) {
          console.log(`⚠️  Excluding ${fy.fy} (revenue: $${fy.revenue.toFixed(2)}) - partial or future period`);
        }
        
        return isComplete;
      });
      
      console.log(`\nComplete FYs available: ${completeFYs.length}`);
      completeFYs.forEach(fy => console.log(`  ${fy.fy}: $${fy.revenue.toFixed(2)}`));
      
      // Step 3: Need at least 2 complete FYs for comparison
      if (completeFYs.length < 2) {
        console.log(`\n⚠️  Cannot perform customer trend analysis`);
        console.log(`   Reason: Need at least 2 complete FYs, but only have ${completeFYs.length}`);
        return { dropping: [], rising: [], churnCount: 0, acquisitionCount: 0 };
      }
      
      // Step 4: Use the two most recent COMPLETE FYs
      const currentFY = completeFYs[completeFYs.length - 1].fy;
      const priorFY = completeFYs[completeFYs.length - 2].fy;
      
      console.log(`\n✅ Period Comparison: ${priorFY} → ${currentFY} (both complete)`);
      
      // Group revenue by customer and FY
      const customerRevenueByFY = new Map<string, Map<string, number>>();
      const customerNames = new Map<string, string>(); // Track customer names
      
      combinedData.forEach(row => {
        const customer = String(row[customerCol]).trim();
        if (!customer) return; // Skip empty customer IDs
        
        const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customer;
        // Store customer name
        if (customerName) {
          customerNames.set(customer, customerName);
        }
        
        const revenue = cleanNumericValue(row[revenueCol]);
        const dateStr = String(row[dateCol]);
        if (revenue <= 0) return;
        
        const date = parseFlexibleDate(dateStr);
        if (!date) return;
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const fyStartYear = month >= 7 ? year : year - 1;
        const fyEndYear = fyStartYear + 1;
        const fy = `FY${String(fyStartYear).slice(-2)}/${String(fyEndYear).slice(-2)}`;
        
        if (!customerRevenueByFY.has(customer)) {
          customerRevenueByFY.set(customer, new Map());
        }
        const customerFYs = customerRevenueByFY.get(customer)!;
        customerFYs.set(fy, (customerFYs.get(fy) || 0) + revenue);
      });
      
      // Step 5: Get all unique customers
      const allCustomers = new Set<string>();
      customerRevenueByFY.forEach((_, customer) => allCustomers.add(customer));
      const totalUniqueCustomers = allCustomers.size;
      
      console.log(`Total Unique Customers: ${totalUniqueCustomers}`);
      if (totalUniqueCustomers <= 3) {
        console.log('⚠️  Small dataset detected - trend metrics may be less meaningful');
      }
      
      // Step 6: Classify customers using STRICT business rules
      const dropping: Array<{ customer: string; customerName?: string; priorYearRevenue: number; currentYearRevenue: number; changePct: number }> = [];
      const rising: Array<{ customer: string; customerName?: string; priorYearRevenue: number; currentYearRevenue: number; changePct: number }> = [];
      const churned: string[] = [];
      const newCustomers: string[] = [];
      const stable: string[] = [];
      
      console.log('\nCustomer-by-Customer Analysis:');
      console.log('-'.repeat(50));
      
      customerRevenueByFY.forEach((fyRevenue, customer) => {
        const customerName = customerNames.get(customer) || customer;
        const priorRevenue = fyRevenue.get(priorFY) || 0;
        const currentRevenue = fyRevenue.get(currentFY) || 0;
        
        console.log(`\n${customerName} (ID: ${customer}):`);
        console.log(`  ${priorFY}: $${priorRevenue.toFixed(0)}`);
        console.log(`  ${currentFY}: $${currentRevenue.toFixed(0)}`);
        
        // STRICT CLASSIFICATION RULES (mutually exclusive)
        
        if (priorRevenue === 0 && currentRevenue > 0) {
          // NEW CUSTOMER
          newCustomers.push(customer);
          console.log(`  → Classification: NEW CUSTOMER`);
          
        } else if (priorRevenue > 0 && currentRevenue === 0) {
          // CHURNED CUSTOMER
          churned.push(customer);
          console.log(`  → Classification: CHURNED`);
          console.log(`  ⚠️  WARNING: Customer had $${priorRevenue.toFixed(0)} in ${priorFY} but $0 in ${currentFY}`);
          
        } else if (priorRevenue > 0 && currentRevenue > 0) {
          // Customer exists in both periods - check trend
          const changePct = ((currentRevenue - priorRevenue) / priorRevenue) * 100;
          
          if (currentRevenue > priorRevenue) {
            // RISING CUSTOMER (any increase, no threshold)
            rising.push({
              customer,
              customerName,
              priorYearRevenue: priorRevenue,
              currentYearRevenue: currentRevenue,
              changePct,
            });
            console.log(`  → Classification: RISING (+${changePct.toFixed(1)}%)`);
            
          } else if (currentRevenue < priorRevenue) {
            // DROPPING CUSTOMER (still has revenue, just decreased)
            dropping.push({
              customer,
              customerName,
              priorYearRevenue: priorRevenue,
              currentYearRevenue: currentRevenue,
              changePct,
            });
            console.log(`  → Classification: DROPPING (${changePct.toFixed(1)}%)`);
            
          } else {
            // Revenue unchanged (stable)
            stable.push(customer);
            console.log(`  → Classification: STABLE (no change)`);
          }
        }
      });
      
      // Sort by change magnitude
      dropping.sort((a, b) => a.changePct - b.changePct);
      rising.sort((a, b) => b.changePct - a.changePct);
      
      // Step 7: Validation & logging
      const classified = newCustomers.length + churned.length + rising.length + dropping.length + stable.length;
      
      console.log('\nClassification Results:');
      console.log(`  New Customers: ${newCustomers.length}`);
      console.log(`  Rising: ${rising.length}`);
      console.log(`  Stable: ${stable.length}`);
      console.log(`  Dropping: ${dropping.length}`);
      console.log(`  Churned: ${churned.length}`);
      console.log(`  Total Classified: ${classified}`);
      
      if (classified !== totalUniqueCustomers) {
        console.warn(`⚠️  Classification mismatch! Expected ${totalUniqueCustomers}, got ${classified}`);
      }
      
      console.log('='.repeat(50));
      
      return {
        dropping,
        rising,
        churnCount: churned.length,
        acquisitionCount: newCustomers.length,
      };
    })(),

    customerPurchases: combinedData
      .filter(row => cleanNumericValue(row[revenueCol]) > 0)
      .slice(0, 20)
      .map((row, idx) => {
        const customerId = customerCol ? String(row[customerCol]).trim() : `Customer ${idx + 1}`;
        const customerName = customerNameCol ? String(row[customerNameCol]).trim() : customerId;
        return {
          customer: customerId,
          customerName: customerName || customerId,
          issueDate: dateCol ? String(row[dateCol]) : new Date().toISOString().split('T')[0],
          branch: String(row.branch),
          invoiceId: idx + 1000,
          invoiceNum: `INV-${idx + 1000}`,
          total: cleanNumericValue(row[revenueCol]),
        };
      }),

    decisions: {
      bp1: `${primarySegment} is primary branch at ${segments[0].sharePct.toFixed(1)}%`,
      bp2: bp2Decision,
      bp3: multiBranchBp3Decision,
      bp4: multiBranchBp4Decision,
      bp5: {},
      bp6: seasonalityData.length > 0 
        ? `${seasonalityData.length} seasonal periods identified. Peak: ${seasonalityData.reduce((max, p) => p.revenue > max.revenue ? p : max).period}`
        : 'No date information available for seasonality analysis',
      bp7: revenueTarget ? `${((totalRevenue / revenueTarget) * 100).toFixed(1)}% of target` : "No target set",
      bp8: `${combinedData.length} total transactions analyzed`,
      bp9: `${topCustomersByRevenue.length} unique customers across all branches`,
    },

    weeklyTrend,
    forecast: [],
    fyComparison,
    monthlyBranch,
    dataGaps: [],

    meta: {
      dataRange: (() => {
        if (!dateCol) {
          return {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          };
        }
        
        let minTime = Infinity;
        let maxTime = -Infinity;
        let foundDate = false;
        
        for (const row of combinedData) {
          const raw = row[dateCol];
          if (!raw) continue;
          
          const parsed = parseFlexibleDate(String(raw));
          if (parsed && !isNaN(parsed.getTime())) {
            const time = parsed.getTime();
            if (time < minTime) minTime = time;
            if (time > maxTime) maxTime = time;
            foundDate = true;
          }
        }
        
        if (!foundDate) {
          return {
            start: combinedData[0] && combinedData[0][dateCol] ? String(combinedData[0][dateCol]) : new Date().toISOString().split('T')[0],
            end: combinedData[combinedData.length - 1] && combinedData[combinedData.length - 1][dateCol] ? String(combinedData[combinedData.length - 1][dateCol]) : new Date().toISOString().split('T')[0],
          };
        }
        
        return {
          start: new Date(minTime).toISOString(),
          end: new Date(maxTime).toISOString(),
        };
      })(),
      totalInvoices: combinedData.length,
      totalCustomers: customerMap.size,
      branches: segments.map(s => s.name),
      lastIngestion: new Date().toISOString(),
      modelVersion: "1.0.0-multi-branch",
    },
  };

  return analysisResponse;
}
