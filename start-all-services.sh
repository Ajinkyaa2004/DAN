#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DAN Dashboard Suite - Service Starter      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}✗ Port $1 is already in use${NC}"
        echo -e "  ${YELLOW}Run: lsof -ti:$1 | xargs kill -9${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Port $1 is available${NC}"
        return 0
    fi
}

echo -e "${YELLOW}Checking ports...${NC}"
check_port 3000  # Business Compass
check_port 3002  # Weekly Sales Frontend
check_port 3003  # Unified Landing Page
check_port 5000  # Weekly Sales Backend
check_port 8000  # FastAPI
check_port 8080  # Shared Storage
echo ""

echo -e "${YELLOW}Starting services...${NC}"
echo -e "${BLUE}Open each URL in your browser after all services start:${NC}"
echo ""
echo -e "  📊 Unified Landing Page:  ${GREEN}http://localhost:3003${NC}"
echo -e "  📈 Business Compass:       ${GREEN}http://localhost:3000${NC}"
echo -e "  📉 Sales Analysis:         ${GREEN}http://localhost:3002${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start all services in background
echo -e "${BLUE}[1/6]${NC} Starting Shared Storage Backend (Port 8080)..."
cd "$(dirname "$0")/Unified-Landing-Page/backend" && npm start > /tmp/shared-storage.log 2>&1 &
SHARED_STORAGE_PID=$!

sleep 2

echo -e "${BLUE}[2/6]${NC} Starting FastAPI Backend (Port 8000)..."
cd "$(dirname "$0")/fastapi-backend" && source venv/bin/activate && python main.py > /tmp/fastapi.log 2>&1 &
FASTAPI_PID=$!

sleep 2

echo -e "${BLUE}[3/6]${NC} Starting Weekly Sales Backend (Port 5000)..."
cd "$(dirname "$0")/Weekly-Sales-MERN-main/server" && npm start > /tmp/weekly-sales-backend.log 2>&1 &
WEEKLY_BACKEND_PID=$!

sleep 2

echo -e "${BLUE}[4/6]${NC} Starting Business Compass (Port 3000)..."
cd "$(dirname "$0")/Business-Compass-main" && npm run dev > /tmp/business-compass.log 2>&1 &
BUSINESS_COMPASS_PID=$!

sleep 3

echo -e "${BLUE}[5/6]${NC} Starting Weekly Sales Frontend (Port 3002)..."
cd "$(dirname "$0")/Weekly-Sales-MERN-main/client" && PORT=3002 npm start > /tmp/weekly-sales-frontend.log 2>&1 &
WEEKLY_FRONTEND_PID=$!

sleep 3

echo -e "${BLUE}[6/6]${NC} Starting Unified Landing Page (Port 3003)..."
cd "$(dirname "$0")/Unified-Landing-Page/frontend" && PORT=3003 npm start > /tmp/unified-landing.log 2>&1 &
LANDING_PID=$!

sleep 5

echo ""
echo -e "${GREEN}✓ All services started!${NC}"
echo ""
echo -e "${YELLOW}Process IDs:${NC}"
echo -e "  Shared Storage:     $SHARED_STORAGE_PID"
echo -e "  FastAPI:            $FASTAPI_PID"
echo -e "  Weekly Backend:     $WEEKLY_BACKEND_PID"
echo -e "  Business Compass:   $BUSINESS_COMPASS_PID"
echo -e "  Weekly Frontend:    $WEEKLY_FRONTEND_PID"
echo -e "  Landing Page:       $LANDING_PID"
echo ""
echo -e "${YELLOW}Logs are available at:${NC}"
echo -e "  /tmp/shared-storage.log"
echo -e "  /tmp/fastapi.log"
echo -e "  /tmp/weekly-sales-backend.log"
echo -e "  /tmp/business-compass.log"
echo -e "  /tmp/weekly-sales-frontend.log"
echo -e "  /tmp/unified-landing.log"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo -e '${YELLOW}Stopping all services...${NC}'; kill $SHARED_STORAGE_PID $FASTAPI_PID $WEEKLY_BACKEND_PID $BUSINESS_COMPASS_PID $WEEKLY_FRONTEND_PID $LANDING_PID 2>/dev/null; echo -e '${GREEN}✓ All services stopped${NC}'; exit 0" INT

echo -e "${GREEN}Ready! Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
wait
