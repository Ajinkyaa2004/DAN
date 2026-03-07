# 🚀 Quick Start - Deploy in 15 Minutes

Follow this streamlined guide to get your DAN Dashboard Suite live FAST.

## Prerequisites (5 minutes)

1. **Create accounts** (use GitHub to sign up):
   - [Vercel](https://vercel.com/signup) 
   - [Railway](https://railway.app/) or [Render](https://render.com/)

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   ```

3. **Push to GitHub** (if not already):
   ```bash
   cd /Users/ajinkya/Desktop/DAN
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create dan-dashboard --private --source=. --push
   ```

---

## 🎯 Deploy FastAPI Backend (2 minutes)

### Railway (Easiest)

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your repository → `fastapi-backend` folder
4. Railway auto-detects Python and deploys
5. **Generate Domain**: Settings → Networking → Generate Domain
6. **Copy URL**: `https://your-app-production.up.railway.app`

✅ **Test**: `curl https://your-app.up.railway.app/health`

---

## 🚀 Deploy All 5 Components (8 minutes)

Run these commands one by one:

```bash
cd /Users/ajinkya/Desktop/DAN

# 1. Deploy Unified Backend (1 min)
cd Unified-Landing-Page/backend
vercel --prod
# Save the URL shown

# 2. Deploy Weekly Sales Backend (1 min)
cd ../../Weekly-Sales-MERN-main/server
vercel --prod
# Save the URL shown

# 3. Deploy Business Compass Frontend (2 min)
cd ../../Business-Compass-main
echo "NEXT_PUBLIC_FASTAPI_URL=YOUR_RAILWAY_URL_HERE" > .env.production
echo "NEXT_PUBLIC_SHARED_STORAGE_URL=YOUR_UNIFIED_BACKEND_URL" >> .env.production
vercel --prod
# Save the URL shown

# 4. Deploy Unified Landing Frontend (2 min)
cd ../Unified-Landing-Page/frontend
echo "REACT_APP_API_URL=YOUR_UNIFIED_BACKEND_URL" > .env.production
echo "REACT_APP_BUSINESS_COMPASS_URL=YOUR_BUSINESS_COMPASS_URL" >> .env.production
vercel --prod
# Save the URL shown

# 5. Deploy Weekly Sales Frontend (2 min)
cd ../../Weekly-Sales-MERN-main/client
echo "REACT_APP_API_URL=YOUR_WEEKLY_BACKEND_URL" > .env.production
vercel --prod
# Save the URL shown
```

---

## ✅ Final Step: Update CORS (1 minute)

Update backend CORS to allow your frontend domains:

```bash
# Update Unified Backend
cd /Users/ajinkya/Desktop/DAN/Unified-Landing-Page/backend
vercel env add CORS_ORIGINS production
# Paste: https://your-unified-frontend.vercel.app,https://your-business-compass.vercel.app
vercel --prod

# Update Weekly Sales Backend
cd ../../Weekly-Sales-MERN-main/server
vercel env add CORS_ORIGINS production
# Paste: https://your-weekly-sales-frontend.vercel.app
vercel --prod
```

---

## 🎉 Done! Test Your Deployment

Visit your Unified Landing Page URL and upload a CSV file!

### Your URLs:
- 📊 **Business Compass**: `https://dan-business-compass.vercel.app`
- 🎯 **Unified Landing**: `https://dan-unified-landing.vercel.app`
- 📈 **Weekly Sales**: `https://dan-weekly-sales.vercel.app`

---

## 🐛 Common Issues

**"Module not found"**
```bash
cd <project-directory>
npm install
vercel --prod
```

**CORS errors**
- Add your frontend URLs to backend CORS_ORIGINS
- Redeploy backend: `vercel --prod`

**FastAPI timeout**
- Railway free tier sleeps after inactivity
- First request takes 30-60 seconds to wake up

---

## 📚 Need more details?

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete documentation.

## 💡 Pro Tips

1. **Auto-deploy on push**: Connect Vercel to your GitHub repo
2. **Custom domains**: Add in Vercel dashboard (Settings → Domains)
3. **Analytics**: Enable in Vercel dashboard for free
4. **Keep Railway active**: Visit your FastAPI URL once a day (or set up a cron job)

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Check logs**: In Vercel/Railway dashboard → Deployments → Logs
