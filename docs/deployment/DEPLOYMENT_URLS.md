# DAN Dashboard Suite - Deployment URLs

## 🌐 Production URLs

### Frontend Applications
- **Business Compass**: `https://dan-business-compass.vercel.app`
  - Main analytics dashboard with Focus, Targets, Cash, Concentration, Expansion, Seasonality, and Trends
  
- **Unified Landing Page**: `https://dan-unified-landing.vercel.app`
  - Central upload portal for all dashboards
  - Handles file uploads and routing to Business Compass
  
- **Weekly Sales Dashboard**: `https://dan-weekly-sales.vercel.app`
  - Standalone weekly sales analysis tool

### Backend APIs
- **FastAPI Backend**: `https://your-app.up.railway.app`
  - Python backend for Business Compass
  - Health check: `/health`
  
- **Unified Backend**: `https://dan-unified-backend.vercel.app`
  - Shared storage for file uploads
  - Session management for cross-dashboard data
  - Health check: `/health`
  
- **Weekly Sales Backend**: `https://dan-weekly-sales-backend.vercel.app`
  - Express backend for weekly sales processing
  - Health check: `/api/health`

---

## 🔧 Admin Panels

- **Vercel Dashboard**: https://vercel.com/dashboard
  - Manage all frontends and Express backends
  - View analytics, logs, and deployments
  
- **Railway Dashboard**: https://railway.app/dashboard
  - Manage FastAPI backend
  - Monitor usage and performance

---

## 📝 Environment Variables Reference

### Business Compass Frontend
```
NEXT_PUBLIC_FASTAPI_URL=https://your-app.up.railway.app
NEXT_PUBLIC_SHARED_STORAGE_URL=https://dan-unified-backend.vercel.app
```

### Unified Landing Frontend
```
REACT_APP_API_URL=https://dan-unified-backend.vercel.app
REACT_APP_BUSINESS_COMPASS_URL=https://dan-business-compass.vercel.app
```

### Weekly Sales Frontend
```
REACT_APP_API_URL=https://dan-weekly-sales-backend.vercel.app
```

### Unified Backend
```
CORS_ORIGINS=https://dan-unified-landing.vercel.app,https://dan-business-compass.vercel.app
NODE_ENV=production
```

### Weekly Sales Backend
```
CORS_ORIGINS=https://dan-weekly-sales.vercel.app
NODE_ENV=production
```

---

## 🧪 Health Check Commands

```bash
# FastAPI Backend
curl https://your-app.up.railway.app/health

# Unified Backend
curl https://dan-unified-backend.vercel.app/health

# Weekly Sales Backend
curl https://dan-weekly-sales-backend.vercel.app/api/health
```

---

## 🔄 Redeploy Commands

```bash
# Redeploy any frontend/backend
cd <project-directory>
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>
```

---

## 📊 Usage Monitoring

### Vercel
- Bandwidth: Check in Vercel Dashboard → Usage
- Free tier: 100GB/month bandwidth
- Serverless execution: 100GB-hrs/month

### Railway
- Check Dashboard → Usage
- Free tier: $5 credit/month (~500 runtime hours)

---

## 🎯 Important Notes

1. **FastAPI Sleep**: Railway free tier sleeps after 15 min inactivity
   - First request after sleep takes 30-60 seconds
   - Solution: Set up periodic health checks or upgrade to paid tier

2. **CORS Configuration**: Already set up for all deployed URLs
   - If you add new domains, update CORS_ORIGINS in backends

3. **File Size Limits**:
   - Vercel serverless: 50MB max (configured in backends)
   - Can handle NSW.csv (630KB), QLD.csv (649KB), WA.csv (7.3MB)
   - Combined file (8.5MB) works fine

4. **Session Storage**: 
   - Unified backend uses in-memory storage
   - Sessions expire after 24 hours
   - Suitable for free tier (no database needed)

---

## 📅 Last Updated
March 6, 2026

## 🔐 Access Control
This file contains production URLs. Keep secure and update as needed.
