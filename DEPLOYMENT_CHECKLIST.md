# 🚀 DAN Dashboard Suite - Deployment Checklist

Use this checklist to ensure smooth deployment to production.

---

## ✅ Pre-Deployment Checklist

### 1. Accounts & Tools
- [ ] Created Vercel account (https://vercel.com/signup)
- [ ] Created Railway or Render account
- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Logged into Vercel CLI: `vercel login`

### 2. Code Repository
- [ ] Code pushed to GitHub
- [ ] All changes committed
- [ ] .gitignore file in place
- [ ] No sensitive data in code (env vars in .env files only)

### 3. Environment Files
- [ ] Created .env.example files (✅ Already done)
- [ ] Reviewed environment variables
- [ ] No .env files committed to git

### 4. Dependencies
- [ ] All package.json files have correct dependencies
- [ ] Ran `npm install` in each project
- [ ] No errors in local builds

---

## 🎯 Deployment Steps

### Step 1: FastAPI Backend (Railway/Render)
- [ ] Deployed to Railway or Render
- [ ] Generated public domain
- [ ] Tested: `curl https://your-app.up.railway.app/health`
- [ ] **Saved FastAPI URL**: `____________________________`

### Step 2: Unified Landing Backend (Vercel)
- [ ] Deployed: `cd Unified-Landing-Page/backend && vercel --prod`
- [ ] **Saved URL**: `____________________________`

### Step 3: Weekly Sales Backend (Vercel)
- [ ] Deployed: `cd Weekly-Sales-MERN-main/server && vercel --prod`
- [ ] **Saved URL**: `____________________________`

### Step 4: Business Compass Frontend (Vercel)
- [ ] Created .env.production with FastAPI and Unified Backend URLs
- [ ] Deployed: `cd Business-Compass-main && vercel --prod`
- [ ] Added environment variables in Vercel Dashboard
- [ ] **Saved URL**: `____________________________`

### Step 5: Unified Landing Frontend (Vercel)
- [ ] Created .env.production with backend URL and Business Compass URL
- [ ] Deployed: `cd Unified-Landing-Page/frontend && vercel --prod`
- [ ] Added environment variables in Vercel Dashboard
- [ ] **Saved URL**: `____________________________`

### Step 6: Weekly Sales Frontend (Vercel)
- [ ] Created .env.production with backend URL
- [ ] Deployed: `cd Weekly-Sales-MERN-main/client && vercel --prod`
- [ ] Added environment variables in Vercel Dashboard
- [ ] **Saved URL**: `____________________________`

### Step 7: CORS Configuration
- [ ] Updated Unified Backend CORS with frontend URLs
- [ ] Updated Weekly Sales Backend CORS with frontend URL
- [ ] Redeployed both backends

---

## 🧪 Testing Checklist

### Backend Health Checks
- [ ] FastAPI: `curl https://your-fastapi-url/health`
  - Expected: `{"status": "ok"}`
  
- [ ] Unified Backend: `curl https://your-unified-backend.vercel.app/health`
  - Expected: `{"status": "ok", "message": "..."}`
  
- [ ] Weekly Sales: `curl https://your-weekly-backend.vercel.app/api/health`
  - Expected: `{"status": "ok"}`

### Frontend Tests
- [ ] Business Compass loads without errors
- [ ] Unified Landing Page loads
- [ ] Weekly Sales Dashboard loads

### End-to-End Test
- [ ] Open Unified Landing Page
- [ ] Upload test CSV (NSW.csv or combined file)
- [ ] Click "Continue to Business Compass"
- [ ] Verify data displays correctly
- [ ] Check all tabs: Focus, Targets, Cash, etc.
- [ ] Download Excel export works

### Branch Code Extraction Test
- [ ] Upload combined CSV with company names
- [ ] Verify segments show as: WA, NSW, QLD (not full company names)
- [ ] Check expansion shows: "QLD vs WA (primary)", "NSW vs WA (primary)"

---

## 📊 Monitoring Setup

### Vercel Analytics
- [ ] Enabled Analytics for Business Compass
- [ ] Enabled Analytics for Unified Landing
- [ ] Enabled Analytics for Weekly Sales

### Usage Monitoring
- [ ] Check Vercel Dashboard → Usage (100GB bandwidth limit)
- [ ] Check Railway Dashboard → Usage ($5/month credit)
- [ ] Set up alerts for 80% usage threshold

### Log Monitoring
- [ ] Know how to access Vercel logs
- [ ] Know how to access Railway logs
- [ ] Test viewing logs for each deployment

---

## 🔐 Security Review

- [ ] All API endpoints protected
- [ ] CORS properly configured (not using '*')
- [ ] Environment variables secure (not in code)
- [ ] File upload size limits set (50MB)
- [ ] No API keys exposed in frontend code
- [ ] HTTPS enabled (automatic on Vercel/Railway)

---

## 📄 Documentation

- [ ] DEPLOYMENT_URLS.md created with all URLs
- [ ] Shared URLs with team/users
- [ ] Saved admin panel links
- [ ] Documented any custom configurations

---

## 🚨 Troubleshooting Preparation

### Common Issues Reference
- [ ] Know how to check Vercel logs
- [ ] Know how to redeploy: `vercel --prod`
- [ ] Know how to update env vars: `vercel env add <KEY> production`
- [ ] Railway app wake-up time documented (30-60 seconds)

### Rollback Plan
- [ ] Know how to rollback in Vercel: Dashboard → Deployments → Redeploy previous
- [ ] Have local backup of working code
- [ ] Know how to check Railway deployment history

---

## 💰 Cost Management

### Free Tier Limits
- [ ] Vercel: 100GB bandwidth/month (documented)
- [ ] Vercel: 100GB-hrs serverless execution/month (documented)
- [ ] Railway: $5 credit/month ≈ 500 hours (documented)

### Optimization
- [ ] Verified bundle sizes are reasonable
- [ ] Checked for unnecessary large dependencies
- [ ] Caching configured (Vercel automatic)

---

## 🎉 Post-Deployment

### Final Steps
- [ ] Sent production URLs to users
- [ ] Created user documentation/guide
- [ ] Set calendar reminder to check Railway usage
- [ ] Bookmarked Vercel and Railway dashboards
- [ ] Celebrated successful deployment! 🎊

### Continuous Integration (Optional)
- [ ] Connected Vercel to GitHub (auto-deploy on push)
- [ ] Set up preview deployments for branches
- [ ] Configured deployment notifications

---

## 📝 Notes

Use this section for deployment-specific notes:

```
FastAPI URL: ________________________________
Unified Backend: ____________________________
Unified Frontend: ___________________________
Weekly Backend: _____________________________
Weekly Frontend: ____________________________
Business Compass: ___________________________

Deployment Date: ____________________________
Deployed By: ________________________________

Issues Encountered:
-
-
-

Solutions Applied:
-
-
-
```

---

## 🔄 Maintenance Schedule

- [ ] **Weekly**: Check Railway usage (to avoid hitting $5 limit)
- [ ] **Weekly**: Test all three frontends
- [ ] **Monthly**: Review Vercel analytics
- [ ] **Monthly**: Update dependencies if needed
- [ ] **Quarterly**: Review and optimize bundle sizes

---

## ✅ Deployment Complete!

**Date Completed**: `____________`

**All items checked?** You're ready for production! 🚀

---

*Keep this checklist for future deployments or updates.*
