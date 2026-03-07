# 🚀 DAN Dashboard Suite - Complete Deployment Guide

## 📋 Project Overview

The DAN Dashboard Suite consists of 6 components that need to be deployed:

1. **Business Compass** (Next.js + FastAPI)
   - Frontend: Next.js 16 → Deploy on **Vercel**
   - Backend: FastAPI (Python) → Deploy on **Railway** or **Render**

2. **Unified Landing Page** (React + Express)
   - Frontend: React → Deploy on **Vercel**
   - Backend: Express.js → Deploy on **Vercel** (serverless)

3. **Weekly Sales MERN** (React + Express)
   - Frontend: React → Deploy on **Vercel**
   - Backend: Express.js → Deploy on **Vercel** (serverless)

---

## 🎯 Deployment Strategy (All Free Platforms)

| Component | Platform | Free Tier | Notes |
|-----------|----------|-----------|-------|
| Business Compass Frontend | Vercel | ✅ Unlimited | Next.js optimized |
| Unified Landing Frontend | Vercel | ✅ Unlimited | React static |
| Weekly Sales Frontend | Vercel | ✅ Unlimited | React static |
| Unified Backend | Vercel | ✅ 100GB-hrs/mo | Serverless functions |
| Weekly Sales Backend | Vercel | ✅ 100GB-hrs/mo | Serverless functions |
| FastAPI Backend | Railway | ✅ $5/mo credit | Python runtime |

**Alternative:** Use Render.com for FastAPI (500hrs/month free)

---

## 📦 Pre-Deployment Checklist

### 1. Install Required Tools
```bash
# Install Vercel CLI
npm install -g vercel

# Install Railway CLI (optional, can use web interface)
npm install -g @railway/cli
```

### 2. Create Accounts
- [ ] [Vercel Account](https://vercel.com/signup) (Sign up with GitHub)
- [ ] [Railway Account](https://railway.app/) (Sign up with GitHub) **OR**
- [ ] [Render Account](https://render.com/) (Sign up with GitHub)

### 3. Push Code to GitHub
```bash
cd /Users/ajinkya/Desktop/DAN
git init
git add .
git commit -m "Initial commit - DAN Dashboard Suite"
gh repo create dan-dashboard-suite --private --source=. --push
```

---

## 🚀 Step-by-Step Deployment

## Phase 1: Deploy FastAPI Backend (Railway)

### Option A: Railway (Recommended)

1. **Go to [Railway.app](https://railway.app/)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `fastapi-backend` folder

3. **Configure Settings**
   - Railway will auto-detect Python
   - It will read `railway.toml` for configuration
   - Click "Deploy"

4. **Get Your FastAPI URL**
   - After deployment, go to Settings → Networking
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://dan-fastapi-production.up.railway.app`)
   - **Save this URL** - you'll need it for Business Compass

5. **Test FastAPI**
   ```bash
   curl https://your-fastapi-url.up.railway.app/health
   ```

### Option B: Render.com (Alternative)

1. **Go to [Render.com](https://render.com/)**

2. **New Web Service**
   - Connect GitHub repository
   - Select `fastapi-backend` folder
   - Render will read `render.yaml`

3. **Deploy & Get URL**
   - Wait for deployment
   - Copy your service URL
   - Test: `curl https://your-app.onrender.com/health`

---

## Phase 2: Deploy Unified Landing Page Backend

1. **Navigate to Backend Folder**
   ```bash
   cd Unified-Landing-Page/backend
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name: `dan-unified-backend`
   - Directory: `./` (current directory)
   - Override settings? **N**

3. **Set Environment Variables**
   ```bash
   vercel env add NODE_ENV
   # Enter: production
   
   vercel env add CORS_ORIGINS
   # Enter: (will update after frontend deployment)
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

5. **Get Backend URL**
   - Copy the production URL (e.g., `https://dan-unified-backend.vercel.app`)
   - **Save this URL**

---

## Phase 3: Deploy Weekly Sales Backend

1. **Navigate to Server Folder**
   ```bash
   cd ../../Weekly-Sales-MERN-main/server
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```
   
   Setup:
   - Project name: `dan-weekly-sales-backend`
   - Deploy and copy production URL

3. **Get Backend URL**
   - Save URL (e.g., `https://dan-weekly-sales-backend.vercel.app`)

---

## Phase 4: Deploy Business Compass Frontend

1. **Navigate to Business Compass**
   ```bash
   cd ../../Business-Compass-main
   ```

2. **Create .env.production**
   ```bash
   cat > .env.production << EOF
   NEXT_PUBLIC_FASTAPI_URL=https://your-fastapi-url.up.railway.app
   NEXT_PUBLIC_SHARED_STORAGE_URL=https://dan-unified-backend.vercel.app
   EOF
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```
   
   Setup:
   - Project name: `dan-business-compass`

4. **Set Environment Variables in Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select `dan-business-compass` project
   - Go to Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_FASTAPI_URL` = Your Railway URL
     - `NEXT_PUBLIC_SHARED_STORAGE_URL` = Unified backend URL

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

6. **Get Frontend URL**
   - Copy URL (e.g., `https://dan-business-compass.vercel.app`)

---

## Phase 5: Deploy Unified Landing Page Frontend

1. **Navigate to Frontend**
   ```bash
   cd ../Unified-Landing-Page/frontend
   ```

2. **Create .env.production**
   ```bash
   cat > .env.production << EOF
   REACT_APP_API_URL=https://dan-unified-backend.vercel.app
   REACT_APP_BUSINESS_COMPASS_URL=https://dan-business-compass.vercel.app
   EOF
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```
   
   Setup:
   - Project name: `dan-unified-landing`

4. **Add Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add both REACT_APP variables

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

6. **Get Frontend URL**
   - Copy URL (e.g., `https://dan-unified-landing.vercel.app`)

---

## Phase 6: Deploy Weekly Sales Frontend

1. **Navigate to Client**
   ```bash
   cd ../../Weekly-Sales-MERN-main/client
   ```

2. **Create .env.production**
   ```bash
   cat > .env.production << EOF
   REACT_APP_API_URL=https://dan-weekly-sales-backend.vercel.app
   EOF
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```
   
   Setup:
   - Project name: `dan-weekly-sales`

4. **Add Environment Variables**
   - In Vercel Dashboard, add `REACT_APP_API_URL`

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## 🔄 Phase 7: Update CORS Settings

Now that all frontends are deployed, update backend CORS:

### 1. Update Unified Backend CORS
   ```bash
   cd ../../Unified-Landing-Page/backend
   vercel env add CORS_ORIGINS production
   # Enter: https://dan-unified-landing.vercel.app,https://dan-business-compass.vercel.app
   
   vercel --prod
   ```

### 2. Update Weekly Sales Backend CORS
   ```bash
   cd ../../Weekly-Sales-MERN-main/server
   vercel env add CORS_ORIGINS production
   # Enter: https://dan-weekly-sales.vercel.app
   
   vercel --prod
   ```

---

## ✅ Deployment Complete!

### Your Live URLs:

1. **Business Compass**: `https://dan-business-compass.vercel.app`
2. **Unified Landing Page**: `https://dan-unified-landing.vercel.app`
3. **Weekly Sales Dashboard**: `https://dan-weekly-sales.vercel.app`

### Backend APIs:
- FastAPI: `https://your-app.up.railway.app`
- Unified Backend: `https://dan-unified-backend.vercel.app`
- Weekly Sales Backend: `https://dan-weekly-sales-backend.vercel.app`

---

## 🧪 Testing Your Deployment

### 1. Test FastAPI Backend
```bash
curl https://your-fastapi-url.up.railway.app/health
# Expected: {"status": "ok"}
```

### 2. Test Unified Backend
```bash
curl https://dan-unified-backend.vercel.app/health
# Expected: {"status": "ok", "message": "Shared storage backend is running"}
```

### 3. Test Weekly Sales Backend
```bash
curl https://dan-weekly-sales-backend.vercel.app/api/health
# Expected: {"status": "ok"}
```

### 4. Test Complete Flow
1. Go to Unified Landing Page
2. Upload a combined CSV
3. Click "Continue to Business Compass"
4. Verify data loads correctly

---

## 🐛 Troubleshooting

### Issue: "Network Error" or CORS Issues
**Solution:** Check CORS_ORIGINS environment variables in backends
```bash
# Update CORS in Vercel Dashboard
vercel env ls
vercel env add CORS_ORIGINS production
```

### Issue: "Module not found" Errors
**Solution:** Ensure all dependencies are in package.json
```bash
npm install
vercel --prod
```

### Issue: FastAPI Backend Timeout
**Solution:** 
- Railway/Render free tier may sleep after inactivity
- First request might take 30-60 seconds to wake up
- Consider upgrading or using Railway's always-on feature

### Issue: File Upload Fails
**Solution:** Check file size limits
- Vercel: 50MB max for serverless functions
- Increase if needed in vercel.json (maxDuration, maxUploadSize)

### Issue: Environment Variables Not Working
**Solution:** Redeploy after adding env vars
```bash
vercel env pull  # Download env vars locally
vercel --prod    # Redeploy with new environment
```

---

## 💡 Cost Optimization Tips

### Vercel Free Tier Limits:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 100GB-hrs serverless execution/month
- ⚠️ 10 second serverless timeout

### Railway Free Tier:
- ✅ $5 credit/month
- ⚠️ ~500 hours runtime
- 💡 App sleeps after inactivity (no credit used)

### Stay Within Free Tier:
1. **Optimize bundle sizes**
   ```bash
   npm run build
   # Check .next/static or build/ folder size
   ```

2. **Enable caching** (Vercel does this automatically)

3. **Monitor usage**
   - Vercel Dashboard → Analytics
   - Railway Dashboard → Usage

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ All secrets in environment variables (not in code)
- ✅ Different values for development/production
- ❌ Never commit .env files to git

### 2. CORS Configuration
```javascript
// Be specific with origins in production
const corsOptions = {
  origin: process.env.CORS_ORIGINS.split(','),
  credentials: true
};
```

### 3. Rate Limiting (Optional but recommended)
```bash
npm install express-rate-limit
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)
1. Go to Vercel Dashboard
2. Select your project
3. Enable Analytics (free tier available)

### Railway Metrics
- CPU usage
- Memory usage
- Request count

### Set Up Alerts
1. Vercel: Settings → Notifications
2. Railway: Project → Settings → Alerts

---

## 🔄 Making Updates

### Update Frontend (Any React/Next.js app):
```bash
cd <app-directory>
git add .
git commit -m "Update: description of changes"
git push
# Vercel auto-deploys on push (if connected to GitHub)

# Or manually:
vercel --prod
```

### Update Backend:
```bash
cd <backend-directory>
git push
# Railway/Vercel auto-deploys

# Or manually:
vercel --prod  # For Vercel backends
railway up     # For Railway
```

---

## 📝 Summary of Deployment URLs to Save

Create a file `DEPLOYMENT_URLS.md` in your project:

```markdown
# DAN Dashboard Suite - Production URLs

## Frontends
- Business Compass: https://dan-business-compass.vercel.app
- Unified Landing: https://dan-unified-landing.vercel.app
- Weekly Sales: https://dan-weekly-sales.vercel.app

## Backends
- FastAPI: https://your-app.up.railway.app
- Unified Backend: https://dan-unified-backend.vercel.app
- Weekly Sales Backend: https://dan-weekly-sales-backend.vercel.app

## Admin Panels
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
```

---

## 🎉 Congratulations!

Your DAN Dashboard Suite is now live on production! 

**Share your dashboards:**
- Send the Unified Landing Page URL to users
- They can upload files and get redirected to Business Compass
- Weekly Sales Dashboard is standalone

**Need help?** Check Vercel and Railway documentation or logs in their dashboards.
