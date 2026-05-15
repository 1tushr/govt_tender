#!/bin/bash

echo "🚀 GovTender Scout - Complete Startup Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MongoDB is running
check_mongodb() {
    echo -e "${BLUE}Checking MongoDB status...${NC}"
    if pgrep -x "mongod" > /dev/null; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ MongoDB is not running${NC}"
        echo "Please start MongoDB with: sudo systemctl start mongod"
        echo "Or install MongoDB: https://www.mongodb.com/docs/manual/installation/"
        return 1
    fi
}

# Install backend dependencies
install_backend() {
    echo -e "\n${BLUE}Installing backend dependencies...${NC}"
    cd /workspace/backend
    
    if [ ! -d "node_modules" ]; then
        npm install --no-optional
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Backend dependencies installed${NC}"
        else
            echo -e "${RED}✗ Failed to install backend dependencies${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
    fi
}

# Setup environment file
setup_env() {
    echo -e "\n${BLUE}Setting up environment configuration...${NC}"
    cd /workspace/backend
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file from template${NC}"
        echo -e "${YELLOW}⚠ Please edit .env with your MongoDB URI and other settings${NC}"
    else
        echo -e "${GREEN}✓ .env file already exists${NC}"
    fi
}

# Seed database
seed_database() {
    echo -e "\n${BLUE}Seeding database with sample data...${NC}"
    cd /workspace/backend
    
    npm run seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database seeded successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Database seeding failed (MongoDB may not be running)${NC}"
        return 1
    fi
}

# Start backend server
start_backend() {
    echo -e "\n${BLUE}Starting backend server...${NC}"
    cd /workspace/backend
    
    # Start in background
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend.pid
    
    sleep 3
    
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
        echo -e "${BLUE}📝 Backend logs: tail -f /tmp/backend.log${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to start backend server${NC}"
        cat /tmp/backend.log
        return 1
    fi
}

# Install frontend dependencies
install_frontend() {
    echo -e "\n${BLUE}Installing frontend dependencies...${NC}"
    cd /workspace/frontend
    
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
        else
            echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
    fi
}

# Start frontend server
start_frontend() {
    echo -e "\n${BLUE}Starting frontend server...${NC}"
    cd /workspace/frontend
    
    # Start in background
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/frontend.pid
    
    sleep 5
    
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
        echo -e "${BLUE}📝 Frontend logs: tail -f /tmp/frontend.log${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to start frontend server${NC}"
        cat /tmp/frontend.log
        return 1
    fi
}

# Show status
show_status() {
    echo -e "\n${GREEN}=============================================${NC}"
    echo -e "${GREEN}   GovTender Scout is ready!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
    echo -e "${BLUE}Backend API:${NC} http://localhost:5000"
    echo ""
    echo -e "${YELLOW}Test Credentials:${NC}"
    echo "  Admin: admin@govtenderscout.in / admin123"
    echo "  User:  test@example.com / test1234"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  View backend logs:  tail -f /tmp/backend.log"
    echo "  View frontend logs: tail -f /tmp/frontend.log"
    echo "  Stop all servers:   ./stop.sh"
    echo ""
    echo -e "${BLUE}API Documentation:${NC}"
    echo "  Health Check: http://localhost:5000/health"
    echo "  Tenders API:  http://localhost:5000/api/tenders"
    echo "  Auth API:     http://localhost:5000/api/auth/login"
    echo ""
}

# Main execution
main() {
    cd /workspace
    
    echo -e "${BLUE}Current directory:$(pwd)${NC}"
    echo -e "${BLUE}Disk space available:${NC}"
    df -h /workspace | tail -1
    
    check_mongodb
    MONGODB_STATUS=$?
    
    install_backend
    setup_env
    
    if [ $MONGODB_STATUS -eq 0 ]; then
        seed_database
    fi
    
    start_backend
    install_frontend
    start_frontend
    
    show_status
}

# Run main function
main "$@"
