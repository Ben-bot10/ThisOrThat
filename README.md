# This or That

A realtime “This or That” voting app where users sign up, vote on polls (text, image, or mixed), and see results update live. Admins can manage polls, view analytics, and ban users.

## Features

- Email/password auth with JWT
- Role-based access (Admin/User)
- One vote per user per poll
- Live updates via Socket.IO
- Comments, history, admin analytics
- Image polls with URL or upload (stored in DB)
- Dark mode, responsive UI, loading animations

## Tech Stack

**Backend**
- Node.js + Express
- PostgreSQL
- JWT, bcrypt
- Socket.IO

**Frontend**
- Vue 3 (CDN)
- Vue Router
- Plain CSS

**Infra**
- Dockerized Postgres (optional)
- Static server for frontend

## Quick Start

One command:

```bash
./start.sh
```

Then open:

```
http://localhost:8000/frontend/index.html
```

Seed logins:

- Admin: `admin@thisorthat.app` / `password`
- User: `alex@thisorthat.app` / `password`

## Manual Run

1) Start Postgres (Docker example)

```bash
sudo docker run --name this-or-that-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=this_or_that \
  -p 5432:5432 \
  -d postgres:16
```

2) Apply schema + seed

```bash
cd backend
psql "postgres://postgres:postgres@localhost:5432/this_or_that" -f ../db/schema.sql
psql "postgres://postgres:postgres@localhost:5432/this_or_that" -f ../db/seed.sql
```

3) Start backend

```bash
cd backend
npm install
npm run dev
```

4) Start frontend

```bash
cd ..
python -m http.server 8000
```

## Environment

Create `backend/.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/this_or_that
JWT_SECRET=replace_me
CLIENT_ORIGIN=http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000
PGSSL=false
```

## API Overview

Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

Polls
- `GET /api/polls`
- `GET /api/polls/:id`
- `POST /api/polls`
- `POST /api/polls/:id/vote`
- `POST /api/polls/:id/comments`

Admin
- `GET /api/admin/analytics`
- `GET /api/admin/polls/pending`
- `POST /api/admin/polls/:id/approve`
- `DELETE /api/admin/polls/:id`
- `GET /api/admin/users`
- `POST /api/admin/users/:id/ban`

## Architecture Diagram

See `docs/architecture.mmd`.
