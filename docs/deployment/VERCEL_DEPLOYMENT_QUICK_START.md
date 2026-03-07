# 🚀 Vercel-Only Deployment - Quick Start

## Overview
All 6 components now deploy to **Vercel free tier** (no Railway needed!)

## Prerequisites
```bash
npm install -g vercel
vercel login
```

## Deployment Order (20 minutes total)

### 1. FastAPI Backend (Python) - 3 min
```bash
cd /Users/ajinkya/Desktop/DAN/fastapi-backend
vercel --prod
```
📝 Save URL: _________________________________

### 2. Shared Storage Backend (Express) - 2 min
```bash
cd ../Unified-Landing-Page/backend
vercel --prod
```
📝 Save URL: _________________________________

### 3. Weekly Sales Backend (Express) - 2 min
```bash
cd ../../Weekly-Sales-MERN-main/server
vercel --prod
```
📝 Save URL: _________________________________

### 4. Business Compass Frontend (Next.js) - 4 min
```bash
cd ../../Business-Compass-main
vercel --prod
```

Then add environment variables in Vercel Dashboard:
- `NEXT_PUBLIC_FASTAPI_URL` → Your FastAPI URL
- `NEXT_PUBLIC_SHARED_STORAGE_URL` → Your Shared Storage URL

Redeploy: `vercel --prod`

📝 Save URL: _________________________________

### 5. Unified Landing Page (React) - 3 min
```bash
cd ../Unified-Landing-Page/frontend
vercel --prod
```

Add environment variables in Vercel Dashboard:
- `REACT_APP_API_URL` → Your Shared Storage URL
- `REACT_APP_BUSINESS_COMPASS_URL` → Your Business Compass URL

Redeploy: `vercel --prod`

📝 Save URL: _________________________________

### 6. Weekly Sales Frontend (React) - 2 min
```bash
cd ../../Weekly-Sales-MERN-main/client
vercel --prod
```

Add environment variable in Vercel Dashboard:
- `REACT_APP_API_URL` → Your Weekly Backend URL

Redeploy: `vercel --prod`

📝 Save URL: _________________________________

### 7. Update CORS (4 min)

#### FastAPI Backend:
- Dashboard → `dan-fastapi-backend` → Settings → Environment Variables
- Add: `CORS_ORIGINS` → `https://your-business-compass.vercel.app`
- Redeploy: `vercel --prod`

#### Shared Storage Backend:
```bash
cd /Users/ajinkya/Desktop/DAN/Unified-Landing-Page/backend
vercel env add CORS_ORIGINS production
# Enter: https://dan-unified-landing.vercel.app,https://dan-business-compass.vercel.app
vercel --prod
```

#### Weekly Sales Backend:
```bash
cd ../../Weekly-Sales-MERN-main/server
vercel env add CORS_ORIGINS production
# Enter: https://dan-weekly-sales.vercel.app
vercel --prod
```

## ✅ Done!

Test: Visit your Business Compass URL and upload a combined CSV.

**Total Cost:** $0/month

For detailed guide, see: [YOUR_DEPLOYMENT_GUIDE.md](YOUR_DEPLOYMENT_GUIDE.md)
