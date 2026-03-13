@echo off
:: This or That - Stop All Services

echo Stopping This or That services...

:: Stop server windows
taskkill /FI "WINDOWTITLE eq This or That - Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq This or That - Frontend*" /F >nul 2>&1

:: Stop any node processes on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Stop any python processes on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Optionally stop PostgreSQL container (comment out if you want to keep data)
:: docker stop this-or-that-postgres >nul 2>&1

echo.
echo All services stopped.
echo (PostgreSQL container is still running to preserve data)
echo.
echo To stop PostgreSQL: docker stop this-or-that-postgres
echo To remove all data: docker rm this-or-that-postgres
echo.
pause
