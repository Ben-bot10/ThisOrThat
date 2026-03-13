#!/bin/bash

# This or That - Stop All Services (Linux/macOS)

echo "Stopping This or That services..."

# Kill processes on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Alternative method using fuser
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true

echo ""
echo "All services stopped."
echo "(PostgreSQL container is still running to preserve data)"
echo ""
echo "To stop PostgreSQL: docker stop this-or-that-postgres"
echo "To remove all data: docker rm this-or-that-postgres"
