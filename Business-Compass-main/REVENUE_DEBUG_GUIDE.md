# Revenue Calculation Debug Guide

## Issues Fixed

### ✅ Comprehensive Debugging Added

Added detailed console logs throughout the entire data processing pipeline to track:

1. **File Parsing** - Shows how many rows are parsed from each CSV file
2. **Column Detection** - Shows which columns are detected for revenue, date, customer, invoice
3. **Data Filtering** - Shows how many rows are filtered out and why
4. **Deduplication** - Shows how many duplicate invoices are removed
5. **Revenue Calculation** - Shows exact revenue totals per branch
6. **Variance Analysis** - Compares calculated vs expected values

### ✅ No Row Limits Found

Verification completed:
- No `.slice()` operations limit the data used for revenue calculations
- All `.slice()` calls only affect display/chart data (top 5, top 20, etc.)
- Full dataset is processed for revenue totals

### ✅ No Hidden Filters Found

Verification completed:
- Revenue calculations use ALL data from uploaded files
- BP1SegmentPriority (main revenue display) does NOT use filters
- Filters only apply to charts/trends, not segment totals
- Historical file is correctly excluded from branch totals

### ✅ Correct Column Detection

The parser:
- Auto-detects revenue column using keywords: revenue, sale, sales, amount, **total**, value, price, income, net, gross
- Uses the "Total" column if it exists
- Cleans numeric values by removing $, commas, spaces
- Uses Number() conversion (more accurate than parseFloat)

## How to Debug

### Step 1: Open Browser Console

1. Open your dashboard in the browser
2. Press **F12** to open DevTools
3. Click on the **Console** tab

### Step 2: Upload Files

1. Go to the Setup page
2. Upload your CSV files:
   - NSW Branch CSV
   - QLD Branch CSV
   - WA Branch CSV
3. Click "Generate Dashboard"

### Step 3: Check Console Output

The console will show detailed output in 6 steps:

#### 📦 SETUP PAGE (First)
```
📦 SETUP PAGE - Files being uploaded:
Total files: 3
  NSW: nsw_data.csv (1234.5 KB)
  QLD: qld_data.csv (2345.6 KB)
  WA: wa_data.csv (15678.9 KB)
```

#### 🔷 STEP 1: PARSING FILES
```
🔷🔷🔷 STEP 1: PARSING FILES 🔷🔷🔷
Total files to process: 3

📂 Parsing NSW file: nsw_data.csv
✅ NSW parsed: 5234 rows

📂 Parsing QLD file: qld_data.csv
✅ QLD parsed: 6789 rows

📂 Parsing WA file: wa_data.csv
✅ WA parsed: 51234 rows
```

**What to check:**
- Total files should be 3 (or 4 if Historical uploaded)
- Each file should show thousands of rows (~62,000 total)
- If row counts are low, check your CSV files

#### 🔷 STEP 2: COLUMN DETECTION
```
🔷🔷🔷 STEP 2: COLUMN DETECTION 🔷🔷🔷
Revenue Column: Total
Invoice Column: Invoice ID
Date Column: Invoice Date
Customer Column: Customer Name
```

**What to check:**
- Revenue Column should be "Total" or similar
- If wrong column detected, you may need manual selection

#### 🔷 STEP 3: MERGING & FILTERING
```
🔷🔷🔷 STEP 3: MERGING & FILTERING DATA 🔷🔷🔷

Row counts per branch:
  NSW: { total: 5234, valid: 5234, invalid: 0 }
  QLD: { total: 6789, valid: 6789, invalid: 0 }
  WA: { total: 51234, valid: 51234, invalid: 0 }

Filtering summary:
  Rows with invalid revenue (<=0): 0
  Duplicate invoices removed: 12
```

**What to check:**
- Valid rows should be close to total rows
- High invalid count = wrong column or data issues
- Duplicate count shows how many invoices were repeated

#### 🔷 STEP 4: COMBINED DATA
```
🔷🔷🔷 STEP 4: COMBINED DATA 🔷🔷🔷
Total valid rows after all filtering: 63245
Expected: ~62,000+ rows for full dataset
```

**What to check:**
- Total should be around 62,000+ rows
- If much lower, data is missing or being filtered incorrectly

#### 🔷 STEP 5: CALCULATING REVENUE
```
🔷🔷🔷 STEP 5: CALCULATING REVENUE 🔷🔷🔷
Summing revenue from column: Total
Sample values from first 5 rows:
  Row 1: "$1,234.56" → 1234.56
  Row 2: "2,345.67" → 2345.67
  Row 3: "$3,456.78" → 3456.78
  Row 4: "4,567.89" → 4567.89
  Row 5: "$5,678.90" → 5678.90
```

**What to check:**
- Column name should match your CSV
- Sample values should show correct cleaning (commas and $ removed)
- Numbers should look reasonable

#### 🔷 STEP 6: FINAL TOTALS
```
🔷🔷🔷 STEP 6: FINAL REVENUE TOTALS 🔷🔷🔷

💰 CALCULATED TOTALS:
  NSW: 11,038,302.25
  QLD: 11,921,434.46
  WA: 205,397,415.45
  TOTAL: 228,357,152.16

✅ EXPECTED TOTALS:
  NSW: 11,038,302.25
  QLD: 11,921,434.46
  WA: 205,397,415.45
  TOTAL: 228,357,152.16

📊 VARIANCE:
  NSW: 0.00 (0.0000%)
  QLD: 0.00 (0.0000%)
  WA: 0.00 (0.0000%)
  TOTAL: 0.00 (0.0000%)

✅ Revenue totals match expected values!
```

**What to check:**
- Calculated totals should match your dataset exactly
- Variance should be 0.00 or very close
- If variance is large, check which branch has the issue

#### 📊 DASHBOARD PAGE (Final)
```
📊 DASHBOARD PAGE - Data loaded:
Total branches: 3

Branch revenues:
  NSW: 11,038,302.25
  QLD: 11,921,434.46
  WA: 205,397,415.45
  TOTAL: 228,357,152.16

Total invoices: 63245
Total customers: 1234
```

**What to check:**
- These numbers should match Step 6 from the parser
- Total invoices should be around 62,000+
- If numbers are different, there may be a display issue

## Common Issues

### Issue 1: Numbers Are Much Too Small

**Symptoms:**
- Total shows 500,000 instead of 228,000,000
- Row count shows 500 instead of 62,000

**Causes:**
1. **Only 1 file uploaded** - Make sure to upload NSW, QLD, and WA
2. **Files are truncated** - Check that your CSV files contain all rows
3. **Wrong column selected** - Parser may have picked "Amount Paid" instead of "Total"

**Solution:**
- Check Step 1 to see how many rows were parsed from each file
- Check Step 2 to verify correct column is used
- Re-export your CSV files with all rows included

### Issue 2: Numbers Are Slightly Off (~0.04% variance)

**Symptoms:**
- Total shows 228,467,000 instead of 228,357,152
- ~110k difference

**Causes:**
1. **Duplicate invoices** - Same invoice appears multiple times in data
2. **Rounding differences** - Data rounded before import

**Solution:**
- Check Step 3 to see how many duplicates were removed
- The parser now automatically deduplicates based on Invoice ID
- If no Invoice ID column exists, duplicates cannot be detected

### Issue 3: "No Revenue Column Detected"

**Symptoms:**
- Error: "NEEDS_MANUAL_SELECTION"
- Dashboard doesn't load

**Causes:**
- CSV columns don't match expected keywords

**Solution:**
- Check your CSV column headers
- Rename your revenue column to "Total" or "Revenue"
- Or implement manual column selection (future feature)

### Issue 4: Historical File Included in Totals

**Symptoms:**
- Numbers are too large (historical data added to current)

**Solution:**
- The parser correctly excludes HISTORICAL files from branch totals
- Check Step 1 - it should show "⏭️ Skipping HISTORICAL file"

## Expected Console Output (Quick Reference)

When everything is working correctly, you should see:

```
📦 SETUP PAGE - Files being uploaded: 3 files

🔷 STEP 1: PARSING FILES
  NSW: ~5,000-10,000 rows ✅
  QLD: ~5,000-10,000 rows ✅
  WA: ~50,000-52,000 rows ✅

🔷 STEP 2: COLUMN DETECTION
  Revenue Column: Total ✅
  Invoice Column: Invoice ID ✅

🔷 STEP 3: MERGING & FILTERING
  Valid rows: ~60,000-63,000 ✅
  Invalid: <100 ✅
  Duplicates removed: <50 ✅

🔷 STEP 4: COMBINED DATA
  Total valid rows: ~62,000+ ✅

🔷 STEP 5: CALCULATING REVENUE
  Sample values look correct ✅

🔷 STEP 6: FINAL TOTALS
  NSW: 11,038,302.25 ✅
  QLD: 11,921,434.46 ✅
  WA: 205,397,415.45 ✅
  TOTAL: 228,357,152.16 ✅
  Variance: 0.00% ✅

📊 DASHBOARD PAGE
  Same totals as Step 6 ✅
```

## Still Having Issues?

1. **Copy the entire console output** and share it
2. Check that your CSV files contain the full dataset
3. Verify CSV column headers match expected format
4. Try re-exporting your data from the source system
5. Check that files are not corrupted or truncated

## Files Modified

- `src/lib/csv-parser.ts` - Added comprehensive debugging logs
- `src/app/setup/page.tsx` - Added file upload logging
- `src/app/dashboard/page.tsx` - Added data display logging
