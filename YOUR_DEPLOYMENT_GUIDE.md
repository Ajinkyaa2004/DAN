# 🚀 YOUR PERSONALIZED DEPLOYMENT GUIDE
## DAN Dashboard Suite - Deploy to Vercel in 20 Minutes

Your GitHub Repository: **https://github.com/Ajinkyaa2004/DAN** ✅

**Updated:** March 6, 2026 - ALL components now deploy to Vercel  
**Platform:** Vercel (100% of stack)  
**Cost:** $0/month (Hobby plan)

---

## 📋 What You Need

1. **Vercel Account** (Sign up with GitHub - takes 2 minutes):
   - [Create Account](https://vercel.com/signup)
   - Choose "Hobby" (Free) plan

2. **Vercel CLI** (Install now):
   ```bash
   npm install -g vercel
   vercel login
   ```

---

## 🎯 DEPLOYMENT ORDER (Follow This Sequence!)

Deploy backends first to get their URLs, then frontends:

1. ✅ FastAPI Backend (Python) → Get URL
2. ✅ Shared Storage Backend (Express) → Get URL  
3. ✅ Weekly Sales Backend (Express) → Get URL
4. ✅ Business Compass Frontend (Next.js) → Uses URLs from steps 1+2
5. ✅ Weekly Sales Frontend (React) → Uses URL from step 3
6. ✅ Unified Landing Page (React) → Uses URL from step 2

---

## 🐍 STEP 1: Deploy FastAPI Backend (Python)

1. **Navigate to FastAPI directory**:
   ```bash
   cd /Users/ajinkya/Desktop/DAN/fastapi-backend
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Answer the prompts**:
   - Set up and deploy? → **Y**
   - Which scope? → Select your account
   - Link to existing project? → **N**
   - Project name? → **dan-fastapi-backend** (or your choice)
   - Directory? → **./** (press Enter)
   - Override settings? → **N**

4. **Wait for deployment** (~1 minute)
   - Vercel detects Python automatically
   - Uses `vercel.json` configuration
   - Installs from `requirements.txt`

5. **📝 SAVE THIS URL** - Write it here:
   ```
   My FastAPI URL: ________________________________________
   ```

6. **Test it**:
   ```bash
   curl https://your-fastapi-url.vercel.app/api/health
   # Should return: {"status":"healthy","service":"business-compass-backend","version":"1.0.0"}
   ```

✅ **FastAPI Backend is LIVE on Vercel!**

---

## 🔧 STEP 2: Deploy Shared Storage Backend (Express)

1. **Open Terminal and navigate**:
   ```bash
   cd /Users/ajinkya/Desktop/DAN/Unified-Landing-Page/backend
   ```

2. **Deploy with Vercel**:
   ```bash
   vercel
   ```

3. **Answer the prompts**:
   - Set up and deploy? → **Y**
   - Which scope? → Select your account
   - Link to existing project? → **N**
   - Project name? → **dan-unified-backend** (or press Enter)
   - Directory? → **./** (press Enter)
   - Override settings? → **N**

4. **Wait for deployment** (30 seconds)

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

6. **📝 Copy the URL** shown (looks like: `https://dan-unified-backend.vercel.app`):
   ```
   My Unified Backend URL: ________________________________________
   ```

✅ **Unified Backend is LIVE!**

---

### **STEP 3: Deploy Weekly Sales Backend** (2 minutes)

1. **Navigate to server folder**:
   ```bash
   cd ../../Weekly-Sales-MERN-main/server
   ```

2. **Deploy with Vercel**:
   ```bash
   vercel
   ```

3. **Answer prompts**:
   - Project name? → **dan-weekly-backend**
   - Other prompts → Just press Enter

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

5. **📝 Copy the URL**:
   ```
   My Weekly Backend URL: ________________________________________
   ```

✅ **Weekly Sales Backend is LIVE!**

---

### **STEP 4: Deploy Business Compass Frontend** (3 minutes)

1. **Navigate to Business Compass**:
   ```bash
   cd ../../Business-Compass-main
   ```

2. **Create production environment file**:
   ```bash
   nano .env.production
   ```
   
   Paste this (replace with YOUR URLs from steps above):
   ```
   NEXT_PUBLIC_FASTAPI_URL=https://your-fastapi-url.vercel.app
   NEXT_PUBLIC_SHARED_STORAGE_URL=https://your-unified-backend-url.vercel.app
   ```
   
   - Press `Ctrl+X`, then `Y`, then `Enter` to save

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   - Project name? → **dan-business-compass**
   - Other prompts → Press Enter

4. **Set environment variables in Vercel**:
   - Go to: https://vercel.com/dashboard
   - Click on `dan-business-compass` project
   - Go to **Settings** → **Environment Variables**
   - Add these two (use Production environment):
     ```
     NEXT_PUBLIC_FASTAPI_URL → https://your-fastapi-url.vercel.app
     NEXT_PUBLIC_SHARED_STORAGE_URL → https://your-unified-backend-url.vercel.app
     ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

6. **📝 Copy the URL**:
   ```
   My Business Compass URL: ________________________________________
   ```

✅ **Business Compass is LIVE!**

---

### **STEP 5: Deploy Unified Landing Frontend** (2 minutes)

1. **Navigate to frontend**:
   ```bash
   cd ../Unified-Landing-Page/frontend
   ```

2. **Create environment file**:
   ```bash
   nano .env.production
   ```
   
   Paste this (use YOUR URLs):
   ```
   REACT_APP_API_URL=https://dan-unified-backend.vercel.app
   REACT_APP_BUSINESS_COMPASS_URL=https://dan-business-compass.vercel.app
   ```
   
   Save with `Ctrl+X`, `Y`, `Enter`

3. **Deploy**:
   ```bash
   vercel
   ```
   
   - Project name? → **dan-unified-landing**

4. **Add environment variables in Vercel Dashboard**:
   - Go to dashboard → `dan-unified-landing` project
   - Settings → Environment Variables
   - Add both `REACT_APP_API_URL` and `REACT_APP_BUSINESS_COMPASS_URL`

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

6. **📝 Copy the URL**:
   ```
   My Unified Landing URL: ________________________________________
   ```

✅ **Unified Landing Page is LIVE!**

---

### **STEP 6: Deploy Weekly Sales Frontend** (2 minutes)

1. **Navigate to client**:
   ```bash
   cd ../../Weekly-Sales-MERN-main/client
   ```

2. **Create environment file**:
   ```bash
   nano .env.production
   ```
   
   Paste:
   ```
   REACT_APP_API_URL=https://dan-weekly-backend.vercel.app
   ```
   
   Save with `Ctrl+X`, `Y`, `Enter`

3. **Deploy**:
   ```bash
   vercel
   ```
   
   - Project name? → **dan-weekly-sales**

4. **Add environment variable in Vercel Dashboard**:
   - Dashboard → `dan-weekly-sales` → Settings → Environment Variables
   - Add `REACT_APP_API_URL` with your weekly backend URL

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

6. **📝 Copy the URL**:
   ```
   My Weekly Sales URL: ________________________________________
   ```

✅ **Weekly Sales is LIVE!**

---

### **STEP 7: Update CORS Settings** (2 minutes)

Now that all frontends are deployed, update backends to allow requests from your frontend URLs.

#### Update FastAPI Backend CORS:
```bash
cd /Users/ajinkya/Desktop/DAN/fastapi-backend
```

**Add CORS environment variable in Vercel Dashboard**:
1. Go to: https://vercel.com/dashboard
2. Click on `dan-fastapi-backend` project
3. Settings → Environment Variables
4. Add new variable:
   - Key: `CORS_ORIGINS`
   - Value: `https://dan-business-compass.vercel.app`
   - Environment: Production

**Redeploy**:
```bash
vercel --prod
```

#### Update Unified Backend CORS:
```bash
cd ../Unified-Landing-Page/backend
```

**Add CORS environment variable**:
```bash
vercel env add CORS_ORIGINS production
```

When prompted, enter (replace with YOUR URLs):
```
https://dan-unified-landing.vercel.app,https://dan-business-compass.vercel.app
```

**Redeploy**:
```bash
vercel --prod
```

#### Update Weekly Sales Backend CORS:
```bash
cd ../../Weekly-Sales-MERN-main/server
```

**Add CORS environment variable**:
```bash
vercel env add CORS_ORIGINS production
```

When prompted, enter (YOUR URL):
```
https://dan-weekly-sales.vercel.app
```

**Redeploy**:
```bash
vercel --prod
```

✅ **CORS Configured for All Backends!**

---

## 🎉 DEPLOYMENT COMPLETE!

### Your Live Dashboards:

1. **Business Compass**: https://dan-business-compass.vercel.app
   - Main analytics dashboard with 7 tabs
   - Shows revenue, expenses, expansion metrics
   - Displays branch codes: WA, NSW, QLD ✓

2. **Unified Landing Page**: https://dan-unified-landing.vercel.app
   - Central upload portal (share this with users!)
   - Upload combined CSV or separate branch files
   - Routes data to Business Compass dashboard

3. **Weekly Sales**: https://dan-weekly-sales.vercel.app
   - Standalone sales analysis tool
   - Weekly revenue tracking

### Your Backend APIs (All on Vercel):

- **FastAPI Backend**: https://dan-fastapi-backend.vercel.app
  - Health: `/api/health`
  - Upload: `/api/ingest/upload`

- **Shared Storage Backend**: https://dan-unified-backend.vercel.app
  - Health: `/health`
  - Upload: `/api/upload`

- **Weekly Sales Backend**: https://dan-weekly-backend.vercel.app
  - Health: `/health`
  - Analysis: `/api/analysis`

---

## 🧪 TEST YOUR DEPLOYMENT

### Test 1: Check Backend Health
```bash
# FastAPI
curl https://dan-fastapi-backend.vercel.app/api/health

# Unified Backend
curl https://dan-unified-backend.vercel.app/health

# Weekly Backend
curl https://dan-weekly-backend.vercel.app/api/health
```

All should return `200 OK`

### Test 2: Upload a File
1. Go to your Unified Landing Page URL
2. Upload `RAW_ALL BRANCES_COMBINED.csv`
3. Click "Continue to Business Compass"
4. Verify data appears correctly
5. Check that segments show as **WA, NSW, QLD** (not full company names)

### Test 3: Check All Tabs
- ✅ Focus → Segment revenue breakdown
- ✅ Targets → Growth analysis
- ✅ Cash → Outstanding calculations
- ✅ Concentration → Customer analysis
- ✅ Expansion → Secondary segments show "QLD vs WA (primary)"
- ✅ Seasonality → Quarterly trends
- ✅ Trends → Customer trends

---

## 🐛 TROUBLESHOOTING

### Issue: "Network Error" or CORS Error

**Solution**: Make sure you added CORS environment variables (Step 7)

```bash
# Check current env vars
vercel env ls

# If missing, add them in Vercel Dashboard
# Or use CLI:
vercel env add CORS_ORIGINS production
vercel --prod
```

### Issue: Vercel Functions Timeout (10s limit)

**This affects**: Large file uploads (>50MB) or complex processing

**Solutions**:
- Break down large files into smaller chunks
- Optimize processing logic
- Use Vercel Pro ($20/month) for 60s timeout
- For very large files, consider alternative storage (S3, etc.)

### Issue: Environment Variables Not Working

**Solution**: Redeploy after adding environment variables

```bash
cd <project-folder>
vercel --prod
```

Always add environment variables through Vercel Dashboard for persistence.

### Issue: Wrong URLs or Branch Names

**Solution**: Check browser console (F12) for errors

- Verify environment variables in Vercel Dashboard
- Make sure all URLs are correct (no typos)
- Check that URLs start with `https://` (not `http://`)
- Redeploy if you fixed any URLs

### Issue: File Upload Fails

**Check**:
- File size under 50MB (Vercel function limit)
- Correct file format (CSV or XLSX)
- Backend responding (health check)
- Network tab in browser DevTools for detailed error

---

## 📊 MONITOR YOUR DEPLOYMENT

### Vercel Dashboard
- Go to: https://vercel.com/dashboard
- View all 6 deployments in one place
- Check analytics (included in free tier)
- View real-time logs for debugging
- Monitor function execution times
- Track bandwidth usage

### Vercel Free Tier Limits (Hobby Plan)
- ✅ **Bandwidth**: 100GB/month
- ✅ **Function Executions**: 100GB-Hours/month
- ✅ **Build Time**: 6000 minutes/month
- ✅ **Deployments**: Unlimited
- ✅ **Team Members**: 1 (you)

**Your Usage**: Should stay well under limits for typical usage

### Recommended: Enable Vercel Analytics
1. Go to each frontend project in dashboard
2. Click "Analytics" tab
3. Enable Web Analytics (free)

---

## 🔄 MAKING UPDATES LATER

### Update Frontend or Backend:
```bash
cd <project-folder>
git add .
git commit -m "Update: description"
git push
vercel --prod
```

### Enable Auto-Deploy (Recommended):
1. Go to Vercel Dashboard
2. Click on your project
3. Settings → Git
4. Connect to your GitHub repository
5. Enable "Auto-deploy" on git push

Now every time you push to GitHub, Vercel auto-deploys! 🚀

---

## 💡 PRO TIPS

1. **Custom Domain**: Add a free custom domain in Vercel Dashboard → Settings → Domains
   - Example: `business-compass.yourdomain.com`
   - Free SSL included automatically

2. **Enable Auto-Deploy**: Connect Vercel to GitHub for automatic deployments
   - Settings → Git → Connect Repository
   - Every push to `main` branch auto-deploys

3. **Monitor Performance**: Use Vercel Analytics (free)
   - Dashboard → Analytics tab
   - Track page views, performance metrics, Web Vitals

4. **Set Up Alerts**: Get notified of deployment failures
   - Settings → Notifications
   - Enable email notifications for failed builds

5. **Optimize Bundle Size**: Check Next.js and React build sizes
   ```bash
   npm run build
   # Review the build output
   # Remove unused dependencies if bundles are too large
   ```

6. **Environment Variables Best Practices**:
   - Never commit `.env` files to Git
   - Always use Vercel Dashboard for production env vars
   - Use `vercel env pull` to sync local development

---

## 📝 SAVE YOUR URLS

Fill this out and save it somewhere safe:

```
=== DAN Dashboard Suite - Production URLs ===
Deployed: March 6, 2026 | Platform: Vercel (All components)

Frontends:
- Business Compass: ______________________________
- Unified Landing: ______________________________
- Weekly Sales: ______________________________

Backends (All on Vercel):
- FastAPI (Python): ______________________________
- Unified Backend (Express): ______________________________
- Weekly Backend (Express): ______________________________

Admin:
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/Ajinkyaa2004/DAN

Deployment Date: ______________________________
Total Cost: $0/month (Vercel Free Tier)
```

---

## 🆘 NEED HELP?

### Documentation in Your Repo:
- `YOUR_DEPLOYMENT_GUIDE.md` - This comprehensive guide
- `DEPLOYMENT_GUIDE.md` - Alternative detailed guide
- `DEPLOYMENT_CHECKLIST.md` - Interactive checklist
- `README_DEPLOYMENT.md` - Visual overview

### Vercel Documentation:
- Getting Started: https://vercel.com/docs
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Serverless Functions: https://vercel.com/docs/concepts/functions/serverless-functions
- Python Runtime: https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python
- Troubleshooting: https://vercel.com/docs/concepts/troubleshooting

### Common Vercel CLI Commands:
```bash
# Check deployment status
vercel ls

# View logs for a deployment
vercel logs <deployment-url>

# Check environment variables
vercel env ls

# Pull environment variables to local
vercel env pull

# Remove a deployment
vercel rm <deployment-name>

# Check which project you're in
vercel inspect

# Link local folder to Vercel project
vercel link
```
vercel env pull
```

---

## ✅ DEPLOYMENT CHECKLIST

Use this to track your progress:

- [ ] Created Vercel account
- [ ] Created Railway account
- [ ] Installed and logged into Vercel CLI
- [ ] Deployed FastAPI to Railway
- [ ] Deployed Unified Backend to Vercel
- [ ] Deployed Weekly Backend to Vercel
- [ ] Deployed Business Compass to Vercel
- [ ] Deployed Unified Landing to Vercel
- [ ] Deployed Weekly Sales to Vercel
- [ ] Updated CORS settings
- [ ] Tested all health checks
- [ ] Uploaded test CSV file
- [ ] Verified branch codes show correctly (WA, NSW, QLD)
- [ ] Saved all production URLs
- [ ] Set up monitoring/alerts

---

## 🎊 CONGRATULATIONS!

Your DAN Dashboard Suite is now LIVE on production! 

**Next Steps**:
1. Share your Unified Landing URL with users
2. Monitor usage in Vercel/Railway dashboards
3. Set up auto-deploy from GitHub
4. Add custom domain (optional)

**Your project is deployed at:**
- Main URL: https://dan-unified-landing.vercel.app
- GitHub: https://github.com/Ajinkyaa2004/DAN

🚀 Happy analyzing! Your dashboards are ready to use!
