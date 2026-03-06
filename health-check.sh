#!/bin/bash

# Quick health check script for all deployed services

echo "🏥 DAN Dashboard Suite - Health Check"
echo "======================================"
echo ""

# Read URLs from user
read -p "FastAPI URL: " FASTAPI_URL
read -p "Unified Backend URL: " UNIFIED_BACKEND_URL
read -p "Weekly Sales Backend URL: " WEEKLY_BACKEND_URL

echo ""
echo "Running health checks..."
echo ""

# Check FastAPI
echo "1. FastAPI Backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FASTAPI_URL/health")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "   ✅ FastAPI: OK ($HTTP_CODE)"
else
    echo "   ❌ FastAPI: FAILED ($HTTP_CODE)"
fi

# Check Unified Backend
echo "2. Unified Backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$UNIFIED_BACKEND_URL/health")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "   ✅ Unified Backend: OK ($HTTP_CODE)"
else
    echo "   ❌ Unified Backend: FAILED ($HTTP_CODE)"
fi

# Check Weekly Sales Backend
echo "3. Weekly Sales Backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEEKLY_BACKEND_URL/api/health")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "   ✅ Weekly Sales Backend: OK ($HTTP_CODE)"
else
    echo "   ❌ Weekly Sales Backend: FAILED ($HTTP_CODE)"
fi

echo ""
echo "Health check complete!"
