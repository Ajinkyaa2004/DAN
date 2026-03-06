# 📤 How to Upload Your Combined CSV File

## Your Setup Has Been Updated! ✅

The `/setup` page now shows clear instructions for uploading files.

---

## For Your Combined CSV File (with Branch Column):

### Upload the SAME file to all 3 slots:

```
┌─────────────────────────────────────────────┐
│  Upload for NSW                             │
│  → Upload your combined.csv here            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Upload for QLD                             │
│  → Upload the SAME combined.csv here        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Upload for WA                              │
│  → Upload the SAME combined.csv here        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Upload Historical Data (Optional)          │
│  → Upload multi-sheet Excel or CSV          │
└─────────────────────────────────────────────┘
```

---

## What Happens When You Upload:

### Step 1: Upload Your Combined File
- Click the first upload area (NSW)
- Select your combined.csv
- Click the second upload area (QLD)  
- Select the SAME combined.csv
- Click the third upload area (WA)
- Select the SAME combined.csv again

### Step 2: You'll See a Warning (This is NORMAL!)
```
⚠️ DUPLICATE FILE DETECTED

"combined.csv" is uploaded to: NSW, QLD, WA

This is OK if your file has a Branch column with data 
for all branches.

Otherwise, your data may be duplicated! 
Do you want to continue?

[Cancel] [OK]
```

**Click OK** - This warning is expected! The system will automatically filter each branch.

### Step 3: Automatic Processing
The system will:
- ✅ Detect your "Branch" column  
- ✅ Filter NSW rows for NSW slot
- ✅ Filter QLD rows for QLD slot
- ✅ Filter WA rows for WA slot
- ✅ Combine all data with NO duplicates

---

## Your Combined CSV Must Look Like This:

```csv
Customer,Date,Total,Branch
Customer A,2024-01-01,1000,NSW
Customer B,2024-01-02,2000,QLD
Customer C,2024-01-03,3000,WA
Customer D,2024-01-04,1500,NSW
Customer E,2024-01-05,2500,QLD
...
```

**Required:** Branch column with values: NSW, QLD, or WA

---

## For Historical Data (Optional):

### Option A: Multi-Sheet Excel (Recommended)
```
historical-sales.xlsx
  ├── Sheet: WA (historical WA data)
  ├── Sheet: QLD (historical QLD data)
  └── Sheet: NSW (historical NSW data)
```

### Option B: Combined CSV with Branch Column
```csv
Customer,Date,Total,Branch
Old Customer A,2023-01-01,900,NSW
Old Customer B,2023-01-02,1800,QLD
...
```

---

## Step-by-Step Instructions:

1. **Go to:** http://localhost:3000/setup

2. **You'll see:**
   - Blue info box explaining both upload options
   - 3 upload cards labeled: NSW Branch, QLD Branch, WA Branch
   - 1 upload card for Historical Data (Optional)

3. **For combined CSV:**
   - Upload your combined.csv to the first card (NSW)
   - Upload the SAME file to the second card (QLD)
   - Upload the SAME file to the third card (WA)

4. **Click "Generate Dashboard"**

5. **Confirm the duplicate warning** (Click OK)

6. **Wait for processing** - Check browser console for logs:
   ```
   🔍 FILTER MODE: File has existing branch column "Branch"
   Filtering for rows matching: NSW
   Valid rows: 150
   Rows filtered out (wrong branch): 300
   ```

7. **Dashboard appears** with all branches properly separated!

---

## Troubleshooting:

### ❌ "No branch column found"
**Problem:** Your CSV doesn't have a "Branch" column  
**Solution:** Add a column named "Branch" (or "Region", "State") with values NSW, QLD, WA

### ❌ "Data looks duplicated"
**Problem:** You uploaded combined CSV without Branch column  
**Solution:** Either add Branch column OR upload separate files for each branch

### ⚠️ "Rows filtered out" count seems wrong
**Check:** 
- Branch column values match exactly (NSW, QLD, WA)
- No typos (nsw vs NSW)
- No extra spaces in values

---

## Need Help?

Check browser console (F12) for detailed logs showing:
- Which mode is being used (Filter vs Assign)
- How many rows were filtered/included
- Any warnings or errors

The system will tell you exactly what it's doing! 🎯
