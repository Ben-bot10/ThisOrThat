#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Starting Postgres (Docker)"
if ! sudo docker ps -a --format "{{.Names}}" | grep -q "^this-or-that-postgres$"; then
  sudo docker run --name this-or-that-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=this_or_that \
    -p 5432:5432 \
    -d postgres:16
else
  sudo docker start this-or-that-postgres >/dev/null
fi

echo "==> Applying schema + seed"
psql "postgres://postgres:postgres@localhost:5432/this_or_that" -f "$ROOT_DIR/db/schema.sql"
psql "postgres://postgres:postgres@localhost:5432/this_or_that" -f "$ROOT_DIR/db/seed.sql"

echo "==> Installing backend deps"
cd "$ROOT_DIR/backend"
npm install

echo "==> Starting backend (dev)"
npm run dev &
BACKEND_PID=$!

echo "==> Starting frontend static server"
cd "$ROOT_DIR"
python -m http.server 8000 &
FRONTEND_PID=$!

echo "==> Running"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Open: http://localhost:8000/frontend/index.html"

wait
