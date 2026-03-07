#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log directory
LOG_DIR="./logs"
mkdir -p $LOG_DIR

# Print header
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}    Starting All DAN Project Services      ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Cleanup function
cleanup() {
    echo -e "\n${RED}Stopping all services...${NC}"
    kill_port 3000
    kill_port 3001
    kill_port 3002
    kill_port 5000
    kill_port 8000
    kill_port 8080
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Check and clear ports if needed
echo -e "${BLUE}Checking ports...${NC}"
for port in 3000 3001 3002 5000 8000 8080; do
    if check_port $port; then
        echo -e "${YELLOW}Port $port is already in use. Killing existing process...${NC}"
        kill_port $port
        sleep 1
    fi
done
echo ""

# 1. Start Business Compass (Next.js) - Port 3000
echo -e "${GREEN}[1/6] Starting Business Compass (Next.js) on port 3000...${NC}"
cd Business-Compass-main
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > $LOG_DIR/business-compass-install.log 2>&1
fi
npm run dev > ../logs/business-compass.log 2>&1 &
BUSINESS_COMPASS_PID=$!
echo -e "${GREEN}✓ Business Compass started (PID: $BUSINESS_COMPASS_PID)${NC}"
echo -e "${CYAN}  URL: http://localhost:3000${NC}"
cd ..
sleep 2

# 2. Start Weekly Sales Server (Express) - Port 5000
echo -e "\n${GREEN}[2/6] Starting Weekly Sales Server (Express) on port 5000...${NC}"
cd Weekly-Sales-MERN-main/server
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > ../../logs/weekly-sales-server-install.log 2>&1
fi
npm run dev > ../../logs/weekly-sales-server.log 2>&1 &
WEEKLY_SERVER_PID=$!
echo -e "${GREEN}✓ Weekly Sales Server started (PID: $WEEKLY_SERVER_PID)${NC}"
echo -e "${CYAN}  URL: http://localhost:5000${NC}"
cd ../..
sleep 2

# 3. Start Weekly Sales Client (React) - Port 3001
echo -e "\n${GREEN}[3/6] Starting Weekly Sales Client (React) on port 3001...${NC}"
cd Weekly-Sales-MERN-main/client
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > ../../logs/weekly-sales-client-install.log 2>&1
fi
PORT=3001 npm start > ../../logs/weekly-sales-client.log 2>&1 &
WEEKLY_CLIENT_PID=$!
echo -e "${GREEN}✓ Weekly Sales Client started (PID: $WEEKLY_CLIENT_PID)${NC}"
echo -e "${CYAN}  URL: http://localhost:3001${NC}"
cd ../..
sleep 2

# 4. Start FastAPI Backend - Port 8000
echo -e "\n${GREEN}[4/6] Starting FastAPI Backend on port 8000...${NC}"
cd fastapi-backend
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -r requirements.txt > ../logs/fastapi-install.log 2>&1
else
    source venv/bin/activate
fi
python3 -m uvicorn main:app --reload --port 8000 > ../logs/fastapi.log 2>&1 &
FASTAPI_PID=$!
deactivate
echo -e "${GREEN}✓ FastAPI Backend started (PID: $FASTAPI_PID)${NC}"
echo -e "${CYAN}  URL: http://localhost:8000${NC}"
echo -e "${CYAN}  Docs: http://localhost:8000/docs${NC}"
cd ..
sleep 2

# 5. Start Unified Landing Page Backend - Port 8080
echo -e "\n${GREEN}[5/6] Starting Unified Landing Backend on port 8080...${NC}"
cd Unified-Landing-Page/backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > ../../logs/unified-backend-install.log 2>&1
fi
npm run dev > ../../logs/unified-backend.log 2>&1 &
UNIFIED_BACKEND_PID=$!
echo -e "${GREEN}✓ Unified Landing Backend started (PID: $UNIFIED_BACKEND_PID)${NC}"
echo -e "${CYAN}  URL: http://localhost:8080${NC}"
cd ../..
sleep 2

# 6. Start Unified Landing Page Frontend - Port 3002
echo -e "\n${GREEN}[6/6] Starting Unified Landing Frontend on port 3002...${NC}"
cd Unified-Landing-Page/frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > ../../logs/unified-frontend-install.log 2>&1
fi
PORT=3002 npm start > ../../logs/unified-frontend.log 2>&1 &
UNIFIED_FRONTEND_PID=$!
echo -e "${GREEN}✓ Unified Landing Frontend started (PID: $UNIFIED_FRONTEND_PID)${NC}"
echo -e "${CYAN}  URL: http://localhost:3002${NC}"
cd ../..
sleep 3

# Print summary
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}         All Services Started!              ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${MAGENTA}Service URLs:${NC}"
echo -e "${GREEN}  • Business Compass:        ${CYAN}http://localhost:3000${NC}"
echo -e "${GREEN}  • Weekly Sales Client:     ${CYAN}http://localhost:3001${NC}"
echo -e "${GREEN}  • Weekly Sales Server:     ${CYAN}http://localhost:5000${NC}"
echo -e "${GREEN}  • Unified Landing Frontend:${CYAN}http://localhost:3002${NC}"
echo -e "${GREEN}  • Unified Landing Backend: ${CYAN}http://localhost:8080${NC}"
echo -e "${GREEN}  • FastAPI Backend:         ${CYAN}http://localhost:8000${NC}"
echo -e "${GREEN}  • FastAPI Docs:            ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Logs are available in: ${LOG_DIR}/${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for user interrupt
wait
