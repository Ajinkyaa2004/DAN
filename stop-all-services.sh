#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}    Stopping All DAN Project Services      ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Stopping $service on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ $service stopped${NC}"
        else
            echo -e "${RED}✗ Failed to stop $service${NC}"
        fi
    else
        echo -e "${YELLOW}$service (port $port) is not running${NC}"
    fi
}

# Stop all services
kill_port 3000 "Business Compass"
kill_port 3001 "Weekly Sales Client"
kill_port 3002 "Unified Landing Frontend"
kill_port 5000 "Weekly Sales Server"
kill_port 8000 "FastAPI Backend"
kill_port 8080 "Unified Landing Backend"

echo ""
echo -e "${GREEN}All services stopped successfully!${NC}"
echo ""
