@echo off
setlocal EnableDelayedExpansion

:: This or That - Windows Startup Script
:: Starts PostgreSQL, applies schema/seed, and runs backend + frontend

title This or That

echo.
echo ======================================================================
echo                          THIS OR THAT
echo ======================================================================
echo.

cd /d "%~dp0"

:: ============================================================
:: PRE-FLIGHT CHECKS
:: ============================================================
echo Checking requirements...

:: Check for Docker
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed.
    echo Please run setup-windows.bat first, or install Docker Desktop manually.
    echo Download: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    if %ERRORLEVEL% neq 0 (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    
    echo Waiting for Docker to start...
    :wait_docker
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo   Still waiting...
        goto wait_docker
    )
)
echo [OK] Docker is running

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please run setup-windows.bat first, or install Node.js manually.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check for Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed.
    echo Please run setup-windows.bat first, or install Python manually.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python found

echo.

:: ============================================================
:: START POSTGRESQL
:: ============================================================
echo [1/5] Starting PostgreSQL database...

:: Check if container exists
docker ps -a --format "{{.Names}}" | findstr /x "this-or-that-postgres" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    :: Container exists, start it
    docker start this-or-that-postgres >nul 2>&1
) else (
    :: Create new container
    docker run -d ^
        --name this-or-that-postgres ^
        -e POSTGRES_USER=postgres ^
        -e POSTGRES_PASSWORD=postgres ^
        -e POSTGRES_DB=this_or_that ^
        -p 5432:5432 ^
        postgres:15 >nul 2>&1
)

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start PostgreSQL container.
    echo Make sure Docker Desktop is running and try again.
    pause
    exit /b 1
)
echo [OK] PostgreSQL started

:: ============================================================
:: WAIT FOR DATABASE
:: ============================================================
echo [2/5] Waiting for database to be ready...
timeout /t 3 /nobreak >nul

:check_db
docker exec this-or-that-postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% neq 0 (
    timeout /t 2 /nobreak >nul
    goto check_db
)
echo [OK] Database is ready

:: ============================================================
:: SETUP DATABASE SCHEMA
:: ============================================================
echo [3/5] Setting up database schema and seed data...

:: Copy SQL files to container and execute
docker cp db\schema.sql this-or-that-postgres:/schema.sql >nul 2>&1
docker cp db\seed.sql this-or-that-postgres:/seed.sql >nul 2>&1

docker exec this-or-that-postgres psql -U postgres -d this_or_that -f /schema.sql >nul 2>&1
docker exec this-or-that-postgres psql -U postgres -d this_or_that -f /seed.sql >nul 2>&1

echo [OK] Database initialized

:: ============================================================
:: INSTALL BACKEND DEPENDENCIES
:: ============================================================
echo [4/5] Installing backend dependencies...
cd backend

if not exist "node_modules" (
    call npm install >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] npm install had issues, trying again...
        call npm install
    )
)

:: Create .env file for local development
(
echo DATABASE_URL=postgres://postgres:postgres@localhost:5432/this_or_that
echo JWT_SECRET=this-or-that-local-secret-key
echo CLIENT_ORIGIN=http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000
echo PGSSL=false
) > .env

echo [OK] Backend ready

:: ============================================================
:: START SERVERS
:: ============================================================
echo [5/5] Starting servers...
cd ..

:: Kill any existing instances
taskkill /FI "WINDOWTITLE eq This or That - Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq This or That - Frontend*" /F >nul 2>&1

:: Start backend server in new window
start "This or That - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Start frontend server in new window  
start "This or That - Frontend" cmd /k "cd /d "%~dp0" && python -m http.server 8000"

:: Wait for servers to start
timeout /t 4 /nobreak >nul

echo.
echo ======================================================================
echo                     APPLICATION RUNNING!
echo ======================================================================
echo.
echo   Frontend:  http://localhost:8000
echo   Backend:   http://localhost:3000
echo.
echo   Test accounts (username or email / password):
echo     Admin:  admin / password
echo     User:   alex / password  
echo     User:   jamie / password
echo.
echo   Two server windows have opened:
echo     - "This or That - Backend" (Node.js API server)
echo     - "This or That - Frontend" (Python web server)
echo.
echo   Close those windows to stop the servers.
echo.
echo ======================================================================
echo.

:: Open browser automatically
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo Press any key to open the app in browser again, or close this window...
pause >nul
start http://localhost:8000
goto :eof
