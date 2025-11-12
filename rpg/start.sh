#!/bin/bash

# Dungeon Explorer - Quick Start Script
# This script handles server setup and launches the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏰 Dungeon Explorer - Quick Start${NC}"
echo "=================================="
echo ""

# Check if we're in the rpg directory
if [ ! -f "dungeon.js" ]; then
    echo -e "${RED}Error: Please run this script from the rpg directory${NC}"
    echo "cd to /Users/ram/Github/interactive-worlds/rpg"
    exit 1
fi

# Kill any existing servers on port 8080
echo -e "${YELLOW}⏳ Checking for existing servers...${NC}"
if lsof -i :8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Found server on port 8080, killing it...${NC}"
    lsof -ti :8080 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is not installed${NC}"
    echo "Please install Python 3 to run the local server"
    exit 1
fi

# Go to parent directory to serve from correct path
cd ..
PROJECT_ROOT=$(pwd)
echo -e "${GREEN}✓ Project root: $PROJECT_ROOT${NC}"

# Start the server in the background
echo -e "${YELLOW}⏳ Starting HTTP server on port 8080...${NC}"
python3 -m http.server 8080 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if ! ps -p $SERVER_PID > /dev/null 2>&1; then
    echo -e "${RED}✗ Failed to start server${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Server running (PID: $SERVER_PID)${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Server is ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📝 URLs:${NC}"
echo -e "   Test Page:  ${YELLOW}http://localhost:8080/rpg/test.html${NC}"
echo -e "   Main App:   ${YELLOW}http://localhost:8080/rpg/index.html${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "   • Start with the test page to verify all assets load"
echo "   • Use WASD + Mouse to navigate in first-person"
echo "   • Press R to generate a new random dungeon"
echo "   • Press ESC to release mouse control"
echo ""
echo -e "${BLUE}🛑 To stop the server:${NC}"
echo "   kill $SERVER_PID"
echo "   or: pkill -f 'python3 -m http.server 8080'"
echo ""

# Save PID to file for easy cleanup
echo $SERVER_PID > /tmp/dungeon_server.pid

# Open test page in browser
echo -e "${YELLOW}⏳ Opening test page in browser...${NC}"
sleep 1

if command -v open &> /dev/null; then
    # macOS
    open "http://localhost:8080/rpg/test.html"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:8080/rpg/test.html"
else
    echo -e "${YELLOW}⚠ Could not auto-open browser${NC}"
    echo "Please manually open: http://localhost:8080/rpg/test.html"
fi

echo -e "${GREEN}✓ Done! Browser should open automatically.${NC}"
echo ""
echo -e "${BLUE}Server is running in the background.${NC}"
echo "Press Ctrl+C to return to terminal (server will keep running)"
echo ""

# Keep script running to show any server output
wait $SERVER_PID
