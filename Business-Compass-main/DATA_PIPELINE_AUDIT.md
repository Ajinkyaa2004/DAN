# Data Pipeline Audit - Comprehensive Debugging Guide

## Problem
Dashboard showing ~704,329 total revenue when it should show ~228,357,152 (only 0.3% of expected).

## Solution
Enhanced logging at every stage of the data pipeline to identify where data is being lost.

---

## HOW TO DEBUG

### 1. Open Browser Console
- Open your dashboard in browser
- Press **F12** for DevTools
- Click **Console** tab
- Clear the console (trash icon)

### 2. Upload Files
- Go to Setup page
- Upload all 3 files:
  - NSW Branch CSV
  - QLD Branch CSV  
  - WA Branch CSV
- Click "Generate Dashboard"

### 3. Analyze Console Output

---

## EXPECTED CONSOLE OUTPUT

### 📦 SETUP PAGE
```
📦 SETUP PAGE - Files being uploaded:
Total files: 3
  NSW: nsw.csv (450.5 KB)
  QLD: qld.csv (520.3 KB)
  WA: wa.csv (6234.7 KB)
```

**What to check:**
- ✅ Should show **3 files** (or 4 if Historical uploaded)
- ❌ If shows 0-2 files → **Not all files selected**

---

### 🔷 STEP 1: PARSING FILES

```
🔷🔷🔷 STEP 1: PARSING FILES 🔷🔷🔷
Total files to process: 3

📂 Parsing NSW file: nsw.csv
📄 PapaParse raw results.data.length: 3884
✅ After cleaning, cleanedData.length: 3883
✅ NSW parsed: 3883 rows

📂 Parsing QLD file: qld.csv
📄 PapaParse raw results.data.length: 4344
✅ After cleaning, cleanedData.length: 4343
✅ QLD parsed: 4343 rows

📂 Parsing WA file: wa.csv
📄 PapaParse raw results.data.length: 54554
✅ After cleaning, cleanedData.length: 54553
✅ WA parsed: 54553 rows
```

**What to check:**
- ✅ NSW: ~3,883 rows
- ✅ QLD: ~4,343 rows
- ✅ WA: ~54,553 rows
- ❌ If any file shows <100 rows → **File is truncated or corrupted**
- ❌ If "raw results" much larger than "cleaned" → **Data format issue**

**Common Issues:**
- **Only 200-500 rows per file** → Files were exported with row limit
- **0 rows** → File upload failed or wrong file format
- **Big difference between raw and cleaned** → Extra header rows or formatting issues

---

### 🔷 STEP 2: COLUMN DETECTION

```
🔷🔷🔷 STEP 2: COLUMN DETECTION 🔷🔷🔷
Available columns in first file: [
  'Invoice ID',
  'Invoice Date',
  'Customer Name',
  'Product',
  'Quantity',
  'Price',
  'Total',
  'Branch'
]

Auto-detected columns:
  Revenue Column: Total
  Invoice Column: Invoice ID
  Date Column: Invoice Date
  Customer Column: Customer Name
```

**What to check:**
- ✅ Revenue Column should be **"Total"** or similar
- ✅ All expected columns are present
- ❌ Revenue Column is **"❌ NOT FOUND"** → **Wrong CSV format**
- ❌ Revenue Column is **"Outstanding"** or **"Variance"** → **Wrong column detected**

**Common Issues:**
- **Revenue Column: Amount** → If should be "Total", system might be summing wrong column
- **Revenue Column: ❌ NOT FOUND** → CSV doesn't have Standard columns
- **Missing Invoice Column** → Duplicates won't be detected (minor issue)

---

### 🔷 STEP 3: MERGING & FILTERING

```
🔷🔷🔷 STEP 3: MERGING & FILTERING DATA 🔷🔷🔷

  Processing NSW...
    Valid rows: 3883
    Revenue so far: 11,038,302.25

  Processing QLD...
    Valid rows: 4343
    Revenue so far: 11,921,434.46

  Processing WA...
    Valid rows: 54553
    Revenue so far: 205,397,415.45

Row counts per branch:
  NSW: { total: 3883, valid: 3883, invalid: 0 }
  QLD: { total: 4343, valid: 4343, invalid: 0 }
  WA: { total: 54553, valid: 54553, invalid: 0 }

Filtering summary:
  Rows with invalid revenue (<=0): 0
  Duplicate invoices removed: 0
```

**What to check:**
- ✅ Valid rows ≈ Total rows (should be close)
- ✅ Revenue per branch matches expected values
- ❌ **High invalid count** (>5%) → Wrong column or data quality issue
- ❌ **Valid rows much less than total** → Revenue values are empty, zero, or non-numeric
- ❌ **Revenue is way too small** → Wrong column (e.g., "Quantity" instead of "Total")

**Common Issues:**
- **NSW valid: 50, invalid: 3833** → Wrong revenue column selected
- **Revenue so far: 704,329** → This is your problem! Should be ~11M for NSW alone
- **High duplicate count** → Same invoice in multiple files (now auto-fixed)

**Critical Check:**
If NSW shows **704,329** instead of **11,038,302**, the problem is HERE:
1. Wrong column is being used (check Step 2)
2. Data is in wrong format (e.g., "7,043.29" being read as "7043.29")
3. Only a subset of data was uploaded

---

### 🔷 STEP 4: COMBINED DATA

```
🔷🔷🔷 STEP 4: COMBINED DATA 🔷🔷🔷
Total valid rows after all filtering: 62779
Expected: ~62,700+ rows for full dataset
Expected breakdown: NSW ~3,883, QLD ~4,343, WA ~54,553
```

**What to check:**
- ✅ Should be **~62,700+ rows**
- ❌ Less than 1,000 rows → **Critical data loss!**
- ❌ 200-500 rows → **Files are truncated**
- ❌ Shows warning → **Follow the warning suggestions**

**Common Issues:**
- **Total: 500** → Only first 500 rows from each file
- **Total: 200** → Files were exported with limit

---

### 🔷 STEP 5: CALCULATING REVENUE

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
- ✅ Column name is correct (**Total**)
- ✅ Sample values show proper number cleaning
- ❌ **Column is "Outstanding"** → Wrong column!
- ❌ **Values are all 0** → Data format issue

**Common Issues:**
- **All values → 0** → Revenue column has text or wrong format
- **Values look too small** → Decimal point issue (e.g., $1.23 instead of $123)

---

### 🔷 STEP 6: FINAL TOTALS

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
- ✅ Calculated = Expected (variance ~0%)
- ❌ **Large variance** → Data issue (see below)

**Common Issues:**
- **Total: 704,329** instead of 228,357,152:
  - Wrong column used (check Step 2 & Step 5)
  - Files truncated (check Step 1)
  - Only 1 file uploaded (check Setup Page)

---

### 📊 DASHBOARD PAGE

```
📊 DASHBOARD PAGE - Data loaded:
Total branches: 3

Branch revenues:
  NSW: 11,038,302.25
  QLD: 11,921,434.46
  WA: 205,397,415.45
  TOTAL: 228,357,152.16

Total invoices: 62779
Total customers: 1234
```

**What to check:**
- ✅ Numbers match Step 6
- ❌ **Numbers are different** → Dashboard display issue (not data pipeline)
- ❌ **Only shows 1-2 branches** → One file missing

---

## DIAGNOSTIC FLOWCHART

### If Total Revenue = ~704,329 (way too small):

1. **Check STEP 1** - Row counts
   - Less than 1000 rows total? → **Files are truncated**
   - Only 1-2 files? → **Not all files uploaded**
   - Row counts look good? → Go to step 2

2. **Check STEP 2** - Column detection
   - Revenue Column = "❌ NOT FOUND"? → **CSV format wrong**
   - Revenue Column = "Outstanding" or "Variance"? → **Wrong column**
   - Revenue Column = "Total"? → Go to step 3

3. **Check STEP 3** - Processing
   - "Valid rows" much less than "total"? → **Wrong revenue column**
   - "Revenue so far" is small for NSW/QLD? → **Wrong column or data format**
   - Numbers look good? → Go to step 4

4. **Check STEP 5** - Sample values
   - All values → 0? → **Data format issue**
   - Values look too small? → **Column or decimal issue**
   - Values look correct? → **Contact support with logs**

---

## COMMON ROOT CAUSES

### 1. Wrong Column Being Used
**Symptoms:**
- Step 2 shows: `Revenue Column: Outstanding`
- Step 3 shows: `Valid rows: 50, invalid: 3833`
- Step 5 shows very small values

**Solution:**
- Check your CSV column headers
- Rename the revenue column to "Total" or "Revenue"
- Re-upload files

---

### 2. Files Are Truncated
**Symptoms:**
- Step 1 shows: `NSW parsed: 200 rows` (should be ~3,883)
- Step 4 shows: `Total valid rows: 500`

**Solution:**
- Re-export CSV files from source system
- Ensure "Export All" is selected (not "Export First 500")
- Check file sizes: NSW ~450KB, QLD ~520KB, WA ~6MB

---

### 3. Only One File Uploaded
**Symptoms:**
- Setup page shows: `Total files: 1`
- Step 1 only shows one file being parsed
- Step 6 total is ~11M instead of ~228M

**Solution:**
- Upload all three branch files (NSW, QLD, WA)
- Check that files are selected before clicking Generate

---

### 4. Data Format Issue
**Symptoms:**
- Step 3 shows: `invalid: 3883` (all rows invalid)
- Step 5 shows: All values → 0

**Solution:**
- Check that Total column contains numbers
- Remove any text (e.g., "Paid", "Pending")
- Ensure decimal format is standard (1234.56, not 1.234,56)

---

## QUICK CHECKLIST

Before investigating further, verify:

- [ ] All 3 files uploaded (NSW, QLD, WA)
- [ ] Files are complete (not truncated to 200-500 rows)
- [ ] CSV has "Total" or "Revenue" column
- [ ] Total column contains numeric values
- [ ] No formulas or links in Excel (export as CSV)
- [ ] Files are not corrupted

## FILES MODIFIED

- `src/lib/csv-parser.ts` - Added comprehensive logging at every stage
- `src/app/setup/page.tsx` - Added file upload logging
- `src/app/dashboard/page.tsx` - Added data display logging

## NEXT STEPS

1. Upload your files
2. Check console output step-by-step
3. Identify which step shows the problem
4. Share the relevant console output if issue persists
