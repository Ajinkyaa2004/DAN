# DAN Dashboard Suite - Unified Landing Page

A unified landing page for uploading data once and accessing multiple dashboards without re-uploading.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Unified Landing Page (Port 3003)        │
│    Upload CSV files once for both dashboards    │
└────────────────┬────────────────────────────────┘
                 │
                 ├─ Uploads files to Shared Storage Backend
                 │
┌────────────────▼────────────────────────────────┐
│      Shared Storage Backend (Port 8080)         │
│   Stores uploaded files with session tokens     │
└────────┬──────────────────────────┬─────────────┘
         │                          │
         │                          │
┌────────▼────────────┐    ┌────────▼─────────────┐
│ Business Compass    │    │ Weekly Sales MERN    │
│ (Port 3000)         │    │ (Port 3002)          │
│ + FastAPI Backend   │    │ + Express Backend    │
│   (Port 8000)       │    │   (Port 5000)        │
└─────────────────────┘    └──────────────────────┘
```

## Services

### 1. Unified Landing Page
- **Frontend**: React (Port 3003)
- **Backend**: Express (Port 8080)
- **Purpose**: Single upload interface for both dashboards

### 2. Shared Storage Backend
- **Port**: 8080
- **Purpose**: Temporarily stores uploaded files with session IDs
- **Retention**: 24 hours

### 3. Business Compass Dashboard
- **Frontend**: Next.js (Port 3000)
- **Backend**: FastAPI (Port 8000)
- **Purpose**: Strategic business insights and forecasting

### 4. Weekly Sales MERN Dashboard
- **Frontend**: React (Port 3002)
- **Backend**: Express (Port 5000)
- **Purpose**: Detailed sales trends and analysis

## Installation

### Prerequisites
- Node.js (v18+)
- Python 3.8+ (for FastAPI backend)
- npm or yarn

### Setup Instructions

1. **Install Shared Storage Backend**
```bash
cd Unified-Landing-Page/backend
npm install
```

2. **Install Unified Landing Page Frontend**
```bash
cd Unified-Landing-Page/frontend
npm install
```

3. **Install FastAPI Backend**
```bash
cd fastapi-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Business Compass** (already installed)
```bash
cd Business-Compass-main
npm install  # Already done
```

5. **Weekly Sales MERN** (already installed)
```bash
cd Weekly-Sales-MERN-main/server
npm install  # Already done

cd ../client
npm install  # Already done
```

## Running the Services

### Start All Services (Recommended)

Run each command in a separate terminal:

**Terminal 1 - Shared Storage Backend:**
```bash
cd Unified-Landing-Page/backend
npm start
```

**Terminal 2 - Unified Landing Page Frontend:**
```bash
cd Unified-Landing-Page/frontend
PORT=3003 npm start
```

**Terminal 3 - FastAPI Backend:**
```bash
cd fastapi-backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

**Terminal 4 - Business Compass:**
```bash
cd Business-Compass-main
npm run dev
```

**Terminal 5 - Weekly Sales Backend:**
```bash
cd Weekly-Sales-MERN-main/server
npm start
```

**Terminal 6 - Weekly Sales Frontend:**
```bash
cd Weekly-Sales-MERN-main/client
PORT=3002 npm start
```

## Usage Flow

1. **Open Unified Landing Page** → http://localhost:3003

2. **Upload Files**
   - Choose upload mode:
     - **Combined File**: Single CSV/Excel with all branches
     - **Separate Files**: Individual files for NSW, QLD, WA
   - Optionally upload Historical data Excel file
   - Click "Upload Files"

3. **Access Dashboards**
   - After successful upload, two buttons appear:
     - **Business Compass** → Opens in new tab with pre-loaded data
     - **Sales Analysis** → Opens in new tab with pre-loaded data

4. **Automatic Data Loading**
   - Dashboards automatically fetch and process pre-uploaded files
   - No need to re-upload data on each dashboard

## Environment Variables

### Unified Landing Page Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8080
REACT_APP_BUSINESS_COMPASS_URL=http://localhost:3000
REACT_APP_SALES_ANALYSIS_URL=http://localhost:3002
```

### Business Compass (.env - create if needed)
```
NEXT_PUBLIC_SHARED_STORAGE_URL=http://localhost:8080
FASTAPI_URL=http://localhost:8000
```

### Weekly Sales MERN Client (.env)
```
REACT_APP_SHARED_STORAGE_URL=http://localhost:8080
REACT_APP_API_URL=http://localhost:5000
```

### Shared Storage Backend (.env)
```
PORT=8080
NODE_ENV=development
```

## API Endpoints

### Shared Storage Backend (Port 8080)
- `POST /api/upload` - Upload files
- `GET /api/session/:sessionId` - Get session metadata
- `GET /api/session/:sessionId/file/:filename` - Download file
- `POST /api/session/:sessionId/forward` - Forward files data
- `GET /health` - Health check

### FastAPI Backend (Port 8000)
- `POST /api/ingest/upload` - Ingest files
- `POST /api/analyse` - Analyze data
- `GET /api/forecast` - Get forecast
- `GET /api/health` - Health check

### Weekly Sales Backend (Port 5000)
- `POST /api/upload/csv` - Upload CSV files
- `POST /api/upload/historical` - Upload historical data
- `POST /api/analysis` - Run analysis
- `GET /api/health` - Health check

## File Requirements

### CSV Files (Branch Data)
Required columns:
- Entity Name
- Branch / Branch Region
- Division
- Due Date
- Customer
- Invoice ID
- Issue Date
- Total
- Outstanding
- Status

### Historical Data (Excel)
- Financial year data for year-over-year comparisons
- Multiple sheets supported

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill process on specific port (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Or change port in package.json or .env file
```

### Session Not Found
- Sessions expire after 24 hours
- Upload files again on the landing page

### Auto-load Not Working
- Check browser console for errors
- Verify all backends are running
- Check that sessionId is in URL
- Clear browser cache/localStorage

### CORS Errors
- Ensure all backends have CORS enabled
- Check that URLs in .env files are correct

## Production Deployment

For production deployment, update the following:

1. **Environment Variables**: Update all localhost URLs to production URLs
2. **CORS Configuration**: Restrict CORS to specific origins
3. **File Storage**: Consider using Redis or database instead of in-memory storage
4. **Session Expiry**: Configure appropriate session timeout
5. **Security**: Add authentication and rate limiting
6. **HTTPS**: Use SSL certificates for all services

## Features

✅ Single upload for multiple dashboards  
✅ Session-based file sharing  
✅ Support for combined and separate CSV files  
✅ Historical data support  
✅ Automatic data loading in dashboards  
✅ Error handling and validation  
✅ 24-hour session retention  
✅ Easy deployment architecture  
✅ No breaking changes to existing dashboards  

## Notes

- Original dashboard functionality remains unchanged
- Auto-load is an additional feature that activates only when sessionId is present
- Both dashboards can still accept direct file uploads
- Shared storage uses in-memory storage for simplicity (suitable for development)
- For production, consider using Redis or database for file storage

## Support

For issues or questions:
1. Check console logs in browser and terminal
2. Verify all services are running
3. Check network tab for failed requests
4. Ensure .env files are configured correctly
