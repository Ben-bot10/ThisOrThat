#!/bin/bash

# This or That - Startup Script (Linux/macOS)
# Starts PostgreSQL, applies schema/seed, and runs backend + frontend

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}                         THIS OR THAT                                    ${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$(dirname "$0")"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================================
# PRE-FLIGHT CHECKS
# ============================================================
echo -e "${CYAN}Checking requirements...${NC}"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed.${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker installed"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}Docker daemon not running. Attempting to start...${NC}"
    if command -v systemctl &> /dev/null; then
        sudo systemctl start docker 2>/dev/null || true
    fi
    sleep 2
    if ! docker info &> /dev/null; then
        echo -e "${RED}[ERROR] Cannot connect to Docker daemon.${NC}"
        echo "Please start Docker and try again."
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Docker running"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed.${NC}"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js installed"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR] Python3 is not installed.${NC}"
    echo "Please install Python3"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python3 installed"

echo ""

# ============================================================
# START POSTGRESQL
# ============================================================
echo -e "${YELLOW}[1/5] Starting PostgreSQL...${NC}"

if docker ps -a --format '{{.Names}}' | grep -q '^this-or-that-postgres$'; then
    docker start this-or-that-postgres > /dev/null 2>&1 || true
else
    docker run -d \
        --name this-or-that-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=this_or_that \
        -p 5432:5432 \
        postgres:15 > /dev/null 2>&1
fi
echo -e "${GREEN}✓ PostgreSQL started${NC}"

# ============================================================
# WAIT FOR DATABASE
# ============================================================
echo -e "${YELLOW}[2/5] Waiting for database...${NC}"
sleep 2
for i in {1..30}; do
    if docker exec this-or-that-postgres pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    sleep 1
done
echo -e "${GREEN}✓ Database ready${NC}"

# ============================================================
# SETUP DATABASE
# ============================================================
echo -e "${YELLOW}[3/5] Setting up database...${NC}"

# Copy and execute SQL files via Docker
docker cp db/schema.sql this-or-that-postgres:/schema.sql > /dev/null 2>&1
docker cp db/seed.sql this-or-that-postgres:/seed.sql > /dev/null 2>&1
docker exec this-or-that-postgres psql -U postgres -d this_or_that -f /schema.sql > /dev/null 2>&1 || true
docker exec this-or-that-postgres psql -U postgres -d this_or_that -f /seed.sql > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Database initialized${NC}"

# ============================================================
# INSTALL DEPENDENCIES
# ============================================================
echo -e "${YELLOW}[4/5] Installing dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

# Ensure .env exists with local config
cat > .env << 'EOF'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/this_or_that
JWT_SECRET=this-or-that-local-secret-key
CLIENT_ORIGIN=http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000
PGSSL=false
EOF

echo -e "${GREEN}✓ Dependencies ready${NC}"

# ============================================================
# START SERVERS
# ============================================================
echo -e "${YELLOW}[5/5] Starting servers...${NC}"

npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

python3 -m http.server 8000 > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                    APPLICATION RUNNING!                                ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:8000"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:3000"
echo ""
echo -e "  ${CYAN}Test accounts (username or email / password):${NC}"
echo -e "    Admin:  ${YELLOW}admin${NC} / password"
echo -e "    User:   ${YELLOW}alex${NC} / password"
echo -e "    User:   ${YELLOW}jamie${NC} / password"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all servers"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Wait for interrupt
wait
