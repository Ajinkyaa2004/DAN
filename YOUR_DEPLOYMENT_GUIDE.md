# 🚀 YOUR PERSONALIZED DEPLOYMENT GUIDE
## DAN Dashboard Suite - Deploy to Production in 15 Minutes

Your GitHub Repository: **https://github.com/Ajinkyaa2004/DAN** ✅

---

## 📋 What You Need

1. **Accounts** (Sign up with GitHub - takes 2 minutes):
   - [Vercel Account](https://vercel.com/signup) 
   - [Railway Account](https://railway.app/) 

2. **Vercel CLI** (Install now):
   ```bash
   npm install -g vercel
   vercel login
   ```

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Deploy FastAPI Backend on Railway** (3 minutes)

1. **Go to Railway**: https://railway.app/new

2. **Click "Deploy from GitHub repo"**

3. **Select your repository**: 
   - Choose `Ajinkyaa2004/DAN`
   - Select the `fastapi-backend` folder

4. **Railway will auto-detect Python and deploy**
   - It reads `railway.toml` for configuration
   - Just click "Deploy" and wait

5. **Generate a Domain**:
   - Go to Settings → Networking
   - Click "Generate Domain"
   - You'll get something like: `https://dan-dashboard-production.up.railway.app`

6. **📝 SAVE THIS URL** - Write it down:
   ```
   My FastAPI URL: ________________________________________
   ```

7. **Test it**:
   ```bash
   curl https://your-fastapi-url.up.railway.app/health
   # Should return: {"status": "ok"}
   ```

✅ **FastAPI Backend is LIVE!**

---

### **STEP 2: Deploy Unified Landing Backend** (2 minutes)

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
   NEXT_PUBLIC_FASTAPI_URL=https://your-fastapi-url.up.railway.app
   NEXT_PUBLIC_SHARED_STORAGE_URL=https://dan-unified-backend.vercel.app
   ```
   
   - Press `Ctrl+X`, then `Y`, then `Enter` to save

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   - Project name? → **dan-business-compass**
   - Other prompts → Press Enter

4. **Set additional environment variables in Vercel Dashboard**:
   - Go to: https://vercel.com/dashboard
   - Click on `dan-business-compass` project
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Add these two variables:
     - Key: `NEXT_PUBLIC_FASTAPI_URL` → Value: Your FastAPI URL
     - Key: `NEXT_PUBLIC_SHARED_STORAGE_URL` → Value: Your Unified Backend URL

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

#### Update Unified Backend CORS:
```bash
cd ../../Unified-Landing-Page/backend
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

✅ **CORS Configured!**

---

## 🎉 DEPLOYMENT COMPLETE!

### Your Live Dashboards:

1. **Business Compass**: https://dan-business-compass.vercel.app
   - Main analytics dashboard with 7 tabs

2. **Unified Landing Page**: https://dan-unified-landing.vercel.app
   - Central upload portal (share this with users!)

3. **Weekly Sales**: https://dan-weekly-sales.vercel.app
   - Standalone sales analysis tool

### Your Backend APIs:

- **FastAPI**: https://your-app.up.railway.app
- **Unified Backend**: https://dan-unified-backend.vercel.app
- **Weekly Backend**: https://dan-weekly-backend.vercel.app

---

## 🧪 TEST YOUR DEPLOYMENT

### Test 1: Check Backend Health
```bash
# FastAPI
curl https://your-fastapi-url.up.railway.app/health

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

# If missing, add them again
vercel env add CORS_ORIGINS production
vercel --prod
```

### Issue: FastAPI Takes 30-60 Seconds to Respond

**This is NORMAL!** Railway free tier puts apps to sleep after 15 minutes of inactivity.

- First request after sleep: 30-60 seconds (waking up)
- Subsequent requests: <1 second

**Solutions**:
- Just wait for first request
- Or set up a cron job to ping every 10 minutes
- Or upgrade Railway to paid tier ($5/month)

### Issue: Environment Variables Not Working

**Solution**: Redeploy after adding environment variables

```bash
cd <project-folder>
vercel --prod
```

### Issue: Wrong URLs or Branch Names

**Solution**: Check browser console (F12) for errors

- Verify environment variables in Vercel Dashboard
- Make sure all URLs are correct (no typos)
- Redeploy if you fixed any URLs

### Issue: File Upload Fails

**Check**:
- File size under 50MB
- Correct file format (CSV or XLSX)
- Backend responding (health check)

---

## 📊 MONITOR YOUR DEPLOYMENT

### Vercel Dashboard
- Go to: https://vercel.com/dashboard
- View all your deployments
- Check analytics (free tier available)
- View logs for debugging

### Railway Dashboard
- Go to: https://railway.app/dashboard
- Monitor FastAPI usage
- Check if you're staying under $5 credit
- View logs

### Usage Limits (Free Tier)
- **Vercel**: 100GB bandwidth/month ✅
- **Railway**: $5 credit/month (~500 hours) ✅
- **Total Cost**: $0/month 🎉

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

1. **Custom Domain**: Add free custom domain in Vercel Dashboard → Settings → Domains

2. **Keep Railway Active**: Visit your FastAPI URL once a day or set up a cron job:
   ```bash
   # Add to crontab (runs every 10 minutes)
   */10 * * * * curl https://your-app.up.railway.app/health
   ```

3. **Enable Analytics**: Free in Vercel Dashboard for all projects

4. **Set Up Alerts**: Get notified of deployment failures
   - Vercel: Settings → Notifications
   - Railway: Settings → Alerts

5. **Optimize Bundle Size**:
   ```bash
   npm run build
   # Check the build size
   # Remove unused dependencies if too large
   ```

---

## 📝 SAVE YOUR URLS

Fill this out and save it somewhere safe:

```
=== DAN Dashboard Suite - Production URLs ===

Frontends:
- Business Compass: ______________________________
- Unified Landing: ______________________________
- Weekly Sales: ______________________________

Backends:
- FastAPI: ______________________________
- Unified Backend: ______________________________
- Weekly Backend: ______________________________

Admin:
- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- GitHub Repo: https://github.com/Ajinkyaa2004/DAN

Deployment Date: ______________________________
```

---

## 🆘 NEED HELP?

### Documentation in Your Repo:
- `DEPLOYMENT_GUIDE.md` - Full detailed guide
- `DEPLOYMENT_CHECKLIST.md` - Interactive checklist
- `README_DEPLOYMENT.md` - Visual overview

### Platform Documentation:
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app

### Common Commands:
```bash
# Check deployment status
vercel ls

# View logs
vercel logs <your-url>

# Check env variables
vercel env ls

# Pull env variables locally
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
