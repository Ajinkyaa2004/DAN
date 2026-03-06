# 🔄 Unified Landing Page → Business Compass Integration Guide

## ✅ System Status

All services are running and configured correctly:

- ✅ Shared Storage Backend (Port 8080) - Running
- ✅ Business Compass (Port 3000) - Running  
- ✅ Unified Landing Page (Port 3003) - Running
- ✅ Environment variables configured

## 📊 How It Works

### Data Flow:
```
1. Upload files at http://localhost:3003
   ↓
2. Files stored in Shared Storage (Port 8080) with Session ID
   ↓
3. Click "Open Business Compass" button
   ↓
4. Opens: http://localhost:3000/setup?sessionId=xxx
   ↓
5. Business Compass auto-loads files from session
   ↓
6. Processes and displays dashboard
```

## 🧪 Testing Instructions

### Test 1: Upload Combined File

1. Open http://localhost:3003 in your browser

2. Select "Combined File" mode (default)

3. Upload `RAW_ALL BRANCES_COMBINED.csv` (or any CSV with Branch column)

4. Optionally upload historical Excel file

5. Click "Upload Files" button

6. Wait for success message with Session ID

7. Click "Open Business Compass" button

8. Business Compass should auto-load and process the data

### Test 2: Upload Separate Files

1. Open http://localhost:3003

2. Select "Separate Files" mode

3. Upload:
   - NSW.csv → NSW slot
   - QLD.csv → QLD slot  
   - WA.csv → WA slot

4. Click "Upload Files"

5. Click "Open Business Compass"

6. Data should load and display

## 🔍 What Business Compass Does

When it receives a sessionId parameter:

1. **Fetches session metadata** from http://localhost:8080/api/session/{sessionId}
   - Gets file names, types, sizes
   - Gets upload mode (combined/separate)

2. **Downloads each file** from http://localhost:8080/api/session/{sessionId}/file/{filename}
   - Creates File objects in browser
   - Stores temporarily in IndexedDB

3. **Parses CSV/Excel files**:
   - Detects columns (Invoice #, Total, Date, Customer, Branch)
   - Cleans numeric values (removes $, commas)
   - Parses dates (handles multiple formats)
   - Filters duplicates

4. **Smart branch handling**:
   - **If combined file with Branch column**: Filters by branch
   - **If separate files without Branch column**: Assigns branch labels
   - **Multi-sheet Excel**: Maps sheet names to branches

5. **Generates dashboard data**:
   - Revenue by FY
   - Customer analysis
   - Cash tracking (billed vs outstanding)
   - Seasonal trends
   - Forecasts

## 📁 Sample Data Files

Available in project root:

- `NSW.csv` (630KB) - NSW branch invoices 2022-2026
- `QLD.csv` (649KB) - QLD branch invoices
- `WA.csv` (7.3MB) - WA branch invoices 2018-2026
- `RAW_ALL BRANCES_COMBINED.csv` (8.5MB) - All branches combined

## 🐛 Troubleshooting

### Problem: "No files found in session"
- Solution: Re-upload files at http://localhost:3003
- Files expire after 24 hours

### Problem: "Module not found: lucide-react"
- Solution: Clear Next.js cache
```bash
cd Business-Compass-main
rm -rf .next
npm run dev
```

### Problem: Dashboard shows $0 revenue
- Check browser console for parsing errors
- Verify CSV has columns: Total, Invoice Date, Customer
- Check that Total column has numeric values

### Problem: Upload button doesn't work
- Check if Shared Storage backend is running: `curl http://localhost:8080/health`
- Check browser console for CORS errors
- Verify network tab shows successful POST to /api/upload

## 🔧 Manual Testing with curl

```bash
# Upload a file
curl -X POST http://localhost:8080/api/upload \
  -F "uploadMode=combined" \
  -F "combined=@RAW_ALL BRANCES_COMBINED.csv"

# Returns: {"success":true,"sessionId":"xxx-xxx-xxx"}

# Check session
curl http://localhost:8080/api/session/{sessionId}

# Open in Business Compass
open "http://localhost:3000/setup?sessionId={sessionId}"
```

## ✨ Key Features

### CSV Parser Features:
- ✅ Auto-column detection (15+ patterns per column type)
- ✅ Flexible date parsing (DD/MM/YYYY, MM/DD/YYYY, ISO)
- ✅ Smart numeric cleaning ($, commas, spaces)
- ✅ Duplicate invoice removal
- ✅ Branch detection and filtering
- ✅ Multi-sheet Excel support

### Dashboard Features:
- 📈 Revenue trends by FY (6 years)
- 💰 Cash analysis (billed vs outstanding)
- 👥 Top customers by revenue/outstanding
- 📊 Seasonal patterns (12 months)
- 🎯 Target tracking with forecasts
- 🌍 Branch comparison (NSW, QLD, WA)
- 📉 Customer risk analysis

## 🎯 Expected Results

After uploading RAW_ALL BRANCES_COMBINED.csv (sample data):

- **Total Revenue**: ~$228M (all branches, all years)
- **Branches**: NSW, QLD, WA
- **Date Range**: 2018-2026
- **Total Invoices**: ~60,000+
- **Customers**: 100+ unique customers

## 🚀 Next Steps

1. Test the upload flow with your actual data
2. Verify dashboard displays correctly
3. Check revenue totals match expectations
4. Test with both combined and separate file modes
5. Try uploading historical Excel files

---

**Need Help?** Check browser console (F12) for detailed logging at each step!
