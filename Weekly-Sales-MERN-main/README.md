# 📊 Weekly Sales Analysis - MERN Stack Application

A full-stack sales analysis dashboard migrated from Streamlit to MERN stack with complete feature parity.

## 🚀 Features

### Data Management
- ✅ Multi-file CSV upload (NSW, QLD, WA branches)
- ✅ Historical Excel data import
- ✅ Drag & drop file upload interface
- ✅ Real-time data validation

### Analysis & Visualizations
- 📈 **Annual Sales Analysis**
  - Quarter and week-based filtering
  - Sales trend line charts
  - Financial year comparisons
  - Interactive Plotly charts

- 📊 **Monthly Branch Sales**
  - Multi-branch trend analysis
  - Time-series visualizations
  - Comparative metrics

- 👥 **Customer Analysis**
  - Drop/Rise trend detection
  - Year-over-year comparisons
  - Customer purchase history
  - Detailed transaction records

### Filtering & Controls
- Branch selection
- Customer search and filter
- Date range selection
- Year range slider
- Financial year filtering

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Plotly.js** - Interactive charts
- **@tanstack/react-table** - Data tables
- **react-select** - Multi-select dropdowns
- **react-datepicker** - Date range selection
- **react-dropzone** - File upload
- **Axios** - HTTP client
- **lucide-react** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Multer** - File upload handling
- **csv-parser** - CSV processing
- **xlsx** - Excel file parsing
- **CORS** - Cross-origin support

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Git

### Clone Repository
```bash
git clone <repository-url>
cd weekly-sales-mern
```

### Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
```
App opens at: http://localhost:3000

### Production Build

**Build Frontend:**
```bash
cd client
npm run build
```

**Start Production Server:**
```bash
cd server
NODE_ENV=production npm start
```

## 📁 Project Structure

```
weekly-sales-mern/
├── client/                      # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx           # Main dashboard container
│   │   │   ├── FileUpload.jsx          # File upload component
│   │   │   ├── Sidebar.jsx             # Filters sidebar
│   │   │   ├── WelcomeScreen.jsx       # Initial welcome screen
│   │   │   ├── HistoricalAnalysis.jsx  # Annual sales section
│   │   │   ├── MonthlySales.jsx        # Monthly trends
│   │   │   ├── CustomerTrends.jsx      # Customer analysis
│   │   │   ├── CustomerDetail.jsx      # Customer details
│   │   │   ├── ErrorBoundary.jsx       # Error handling
│   │   │   └── LoadingSpinner.jsx      # Loading states
│   │   ├── App.js                      # Root component
│   │   ├── App.css
│   │   └── index.js
│   ├── .env                            # Environment variables
│   └── package.json
│
└── server/                      # Node.js backend
    ├── routes/
    │   ├── upload.js                   # File upload endpoints
    │   └── analysis.js                 # Data analysis endpoints
    ├── utils/
    │   ├── csvParser.js                # CSV processing
    │   ├── historicalParser.js         # Excel processing
    │   ├── dataFilters.js              # Data filtering logic
    │   └── analysisUtils.js            # Analysis functions
    ├── app.js                          # Express app
    ├── .env                            # Environment variables
    └── package.json
```

## 🔌 API Endpoints

### File Upload
- `POST /api/upload/csv` - Upload NSW, QLD, WA CSV files
- `POST /api/upload/historical` - Upload historical Excel file

### Analysis
- `POST /api/analyze/monthly` - Get monthly sales data
- `POST /api/analyze/customers` - Get customer trends
- `POST /api/analyze/customer-detail` - Get customer purchase details
- `POST /api/analyze/historical` - Get historical analysis

### Health Check
- `GET /api/health` - Server health status

## 📊 Data Format

### CSV Files (NSW.csv, QLD.csv, WA.csv)
Expected columns:
- Entity Name
- Branch Region
- Branch
- Division
- Due Date
- Top Level Customer ID
- Top Level Customer Name
- Customer ID
- Customer
- Billing Group ID
- Billing Group
- Invoice ID
- Invoice #
- Issue Date (DD/MM/YYYY)
- Total
- Outstanding
- Delivery
- Status

### Historical Excel File
Expected sheets: WA, QLD, NSW

Format:
- Row 1: Financial year headers (e.g., "2022/2023")
- Row 2: Additional headers
- Row 3+: Week data (e.g., "Week 1", "Week 2", etc.)

## 🎨 Features by Section

### 1. File Upload (Sidebar)
- Drag & drop interface
- File validation
- Upload progress
- Success/error messages

### 2. Filters (Sidebar)
- Branch multi-select
- Customer search & select
- Year range slider
- Date range picker
- Financial year selection

### 3. Annual Sales Analysis
- Quarter selector (Q1-Q4)
- Week-specific filtering
- Data table with sorting & pagination
- Total sales metric
- Sales trend line chart
- Financial year comparison bar chart

### 4. Monthly Branch Sales
- Multi-branch line chart
- Month-over-month trends
- Interactive hover tooltips

### 5. Customer Trends
- Dropping customers table
- Rising customers table
- Year-over-year comparison

### 6. Customer Purchase Analysis
- Customer multi-select
- Date range filtering
- Dropping customer warnings
- Purchase records table
- Total purchase metric
- Yearly purchase bar chart
- Monthly purchase line chart

## 🧪 Testing

### Manual Testing Checklist

**File Upload:**
- [ ] Upload 3 CSV files successfully
- [ ] See warning when < 3 files uploaded
- [ ] Upload historical Excel file
- [ ] Verify data loads correctly

**Filters:**
- [ ] Branch filter updates all charts
- [ ] Customer filter works with search
- [ ] Year range slider updates data
- [ ] Date range picker constrains dates
- [ ] Financial year filter affects historical data

**Charts:**
- [ ] All charts render without errors
- [ ] Hover tooltips show correct data
- [ ] Charts are responsive on mobile
- [ ] Legends are readable

**Tables:**
- [ ] Sorting works on all columns
- [ ] Pagination controls work
- [ ] Data formats correctly (currency, dates)

**Edge Cases:**
- [ ] Empty data states show messages
- [ ] Large datasets load without crashing
- [ ] Network errors show user-friendly messages
- [ ] Browser back/forward works correctly

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>

# Restart server
cd server && npm run dev
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### CORS errors
- Verify backend is running on port 5000
- Check `.env` file has correct API URL
- Ensure CORS is enabled in `server/app.js`

### File upload fails
- Check file format (CSV for sales, .xlsx for historical)
- Verify file size is reasonable (< 10MB)
- Check browser console for errors
- Verify backend logs for parsing errors

## 🔒 Security Considerations

- File uploads are validated on backend
- No sensitive data stored in localStorage
- CORS configured for development (update for production)
- Environment variables for configuration
- Input sanitization on all user inputs

## 📈 Performance Optimization

- Client-side filtering for instant updates
- Memoized computed values with useMemo
- Pagination for large datasets
- Lazy loading of chart libraries
- Responsive images and assets

## ♿ Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance
- Focus indicators

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build production bundle: `npm run build`
2. Deploy `build/` folder
3. Set environment variable: `REACT_APP_API_URL`

### Backend (Heroku/Railway/Render)
1. Push to Git repository
2. Set environment variables
3. Deploy with `npm start`

### Environment Variables

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000
```

**Backend (.env):**
```
PORT=5000
NODE_ENV=development
```

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Check documentation in `/docs` folder
- Review API endpoints in `server/routes/`
- Check browser console for frontend errors
- Check server logs for backend errors

## 🎯 Roadmap

- [ ] User authentication
- [ ] Data export (PDF, Excel)
- [ ] Email reports
- [ ] Real-time data updates
- [ ] Advanced filtering options
- [ ] Custom date ranges
- [ ] Comparison mode
- [ ] Dark mode

## 📚 Documentation

- [Migration Plan](MERN_MIGRATION_PLAN.md.resolved)
- [Phase 1-2 Status](PHASE_1_2_STATUS.md)
- [Phase 3 Complete](PHASE_3_COMPLETE.md)
- [Phase 4-5 Complete](PHASE_4_5_COMPLETE.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)

---

**Built with ❤️ using MERN Stack**
