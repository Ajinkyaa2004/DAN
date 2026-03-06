#!/bin/bash

# DAN Dashboard Suite - Automated Deployment Script
# This script helps deploy all components to Vercel and Railway

set -e  # Exit on error

echo "🚀 DAN Dashboard Suite - Deployment Helper"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists vercel; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git not found. Please install Git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "Business-Compass-main" ] || [ ! -d "Unified-Landing-Page" ]; then
    echo -e "${RED}❌ Error: Please run this script from the DAN folder${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Step 1: Collect URLs
echo -e "${BLUE}📝 Step 1: Collect Backend URLs${NC}"
echo ""

read -p "Enter your FastAPI URL (from Railway/Render): " FASTAPI_URL
if [ -z "$FASTAPI_URL" ]; then
    echo -e "${RED}❌ FastAPI URL is required${NC}"
    exit 1
fi

# Step 2: Deploy Unified Backend
echo ""
echo -e "${BLUE}🚀 Step 2: Deploying Unified Backend...${NC}"
cd Unified-Landing-Page/backend

vercel --prod --yes
UNIFIED_BACKEND_URL=$(vercel inspect --token=$(vercel whoami --token) 2>/dev/null | grep "url:" | awk '{print $2}' | head -1)

if [ -z "$UNIFIED_BACKEND_URL" ]; then
    read -p "Enter your Unified Backend URL (from Vercel output): " UNIFIED_BACKEND_URL
fi

echo -e "${GREEN}✅ Unified Backend deployed: $UNIFIED_BACKEND_URL${NC}"
cd ../..

# Step 3: Deploy Weekly Sales Backend
echo ""
echo -e "${BLUE}🚀 Step 3: Deploying Weekly Sales Backend...${NC}"
cd Weekly-Sales-MERN-main/server

vercel --prod --yes
WEEKLY_BACKEND_URL=$(vercel inspect --token=$(vercel whoami --token) 2>/dev/null | grep "url:" | awk '{print $2}' | head -1)

if [ -z "$WEEKLY_BACKEND_URL" ]; then
    read -p "Enter your Weekly Sales Backend URL (from Vercel output): " WEEKLY_BACKEND_URL
fi

echo -e "${GREEN}✅ Weekly Sales Backend deployed: $WEEKLY_BACKEND_URL${NC}"
cd ../..

# Step 4: Deploy Business Compass Frontend
echo ""
echo -e "${BLUE}🚀 Step 4: Deploying Business Compass Frontend...${NC}"
cd Business-Compass-main

# Create production env file
cat > .env.production << EOF
NEXT_PUBLIC_FASTAPI_URL=$FASTAPI_URL
NEXT_PUBLIC_SHARED_STORAGE_URL=$UNIFIED_BACKEND_URL
EOF

vercel --prod --yes
BUSINESS_COMPASS_URL=$(vercel inspect --token=$(vercel whoami --token) 2>/dev/null | grep "url:" | awk '{print $2}' | head -1)

if [ -z "$BUSINESS_COMPASS_URL" ]; then
    read -p "Enter your Business Compass URL (from Vercel output): " BUSINESS_COMPASS_URL
fi

echo -e "${GREEN}✅ Business Compass deployed: $BUSINESS_COMPASS_URL${NC}"
cd ..

# Step 5: Deploy Unified Landing Frontend
echo ""
echo -e "${BLUE}🚀 Step 5: Deploying Unified Landing Frontend...${NC}"
cd Unified-Landing-Page/frontend

# Create production env file
cat > .env.production << EOF
REACT_APP_API_URL=$UNIFIED_BACKEND_URL
REACT_APP_BUSINESS_COMPASS_URL=$BUSINESS_COMPASS_URL
EOF

vercel --prod --yes
UNIFIED_FRONTEND_URL=$(vercel inspect --token=$(vercel whoami --token) 2>/dev/null | grep "url:" | awk '{print $2}' | head -1)

if [ -z "$UNIFIED_FRONTEND_URL" ]; then
    read -p "Enter your Unified Landing URL (from Vercel output): " UNIFIED_FRONTEND_URL
fi

echo -e "${GREEN}✅ Unified Landing deployed: $UNIFIED_FRONTEND_URL${NC}"
cd ../..

# Step 6: Deploy Weekly Sales Frontend
echo ""
echo -e "${BLUE}🚀 Step 6: Deploying Weekly Sales Frontend...${NC}"
cd Weekly-Sales-MERN-main/client

# Create production env file
cat > .env.production << EOF
REACT_APP_API_URL=$WEEKLY_BACKEND_URL
EOF

vercel --prod --yes
WEEKLY_FRONTEND_URL=$(vercel inspect --token=$(vercel whoami --token) 2>/dev/null | grep "url:" | awk '{print $2}' | head -1)

if [ -z "$WEEKLY_FRONTEND_URL" ]; then
    read -p "Enter your Weekly Sales URL (from Vercel output): " WEEKLY_FRONTEND_URL
fi

echo -e "${GREEN}✅ Weekly Sales deployed: $WEEKLY_FRONTEND_URL${NC}"
cd ../..

# Step 7: Update CORS
echo ""
echo -e "${BLUE}🔄 Step 7: Updating CORS settings...${NC}"

cd Unified-Landing-Page/backend
vercel env add CORS_ORIGINS production << EOF
$UNIFIED_FRONTEND_URL,$BUSINESS_COMPASS_URL
EOF
vercel --prod --yes
cd ../..

cd Weekly-Sales-MERN-main/server
vercel env add CORS_ORIGINS production << EOF
$WEEKLY_FRONTEND_URL
EOF
vercel --prod --yes
cd ../..

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "🎉 Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Your Production URLs:"
echo ""
echo -e "${BLUE}Frontend Applications:${NC}"
echo "  📊 Business Compass: $BUSINESS_COMPASS_URL"
echo "  🎯 Unified Landing:  $UNIFIED_FRONTEND_URL"
echo "  📈 Weekly Sales:     $WEEKLY_FRONTEND_URL"
echo ""
echo -e "${BLUE}Backend APIs:${NC}"
echo "  🐍 FastAPI:          $FASTAPI_URL"
echo "  🔄 Unified Backend:  $UNIFIED_BACKEND_URL"
echo "  📊 Weekly Backend:   $WEEKLY_BACKEND_URL"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test your FastAPI: curl $FASTAPI_URL/health"
echo "  2. Visit your Unified Landing Page: $UNIFIED_FRONTEND_URL"
echo "  3. Upload a test CSV file"
echo ""
echo -e "${GREEN}URLs saved to DEPLOYMENT_URLS.txt${NC}"

# Save URLs to file
cat > DEPLOYMENT_URLS.txt << EOF
DAN Dashboard Suite - Production URLs
Generated: $(date)

Frontend Applications:
- Business Compass: $BUSINESS_COMPASS_URL
- Unified Landing: $UNIFIED_FRONTEND_URL
- Weekly Sales: $WEEKLY_FRONTEND_URL

Backend APIs:
- FastAPI: $FASTAPI_URL
- Unified Backend: $UNIFIED_BACKEND_URL
- Weekly Sales Backend: $WEEKLY_BACKEND_URL

Admin Panels:
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
EOF

echo ""
echo -e "${GREEN}✅ All done! Your dashboards are live!${NC}"
