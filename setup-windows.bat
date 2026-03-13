@echo off
setlocal EnableDelayedExpansion

:: This or That - Windows Setup & Run Script
:: This script checks for and installs all required dependencies

title This or That - Setup

echo.
echo ======================================================================
echo                    THIS OR THAT - WINDOWS SETUP
echo ======================================================================
echo.
echo This script will check and install required dependencies:
echo   - Docker Desktop (for PostgreSQL database)
echo   - Node.js (for backend server)
echo   - Python (for frontend server)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

cd /d "%~dp0"

:: Create a temp folder for downloads
if not exist "temp_setup" mkdir temp_setup

:: ============================================================
:: CHECK AND INSTALL DOCKER
:: ============================================================
echo.
echo [1/4] Checking Docker...
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker not found. Checking for Docker Desktop installer...
    
    if not exist "temp_setup\DockerDesktopInstaller.exe" (
        echo.
        echo ======================================================================
        echo DOCKER DESKTOP REQUIRED
        echo ======================================================================
        echo.
        echo Docker Desktop is required but not installed.
        echo.
        echo Please download Docker Desktop manually:
        echo   https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
        echo.
        echo Save it to: %cd%\temp_setup\DockerDesktopInstaller.exe
        echo Then run this script again.
        echo.
        echo Alternatively, download and install from:
        echo   https://www.docker.com/products/docker-desktop/
        echo.
        pause
        exit /b 1
    )
    
    echo Installing Docker Desktop...
    echo This may take several minutes and require a restart.
    start /wait temp_setup\DockerDesktopInstaller.exe install --quiet
    
    echo.
    echo ======================================================================
    echo RESTART REQUIRED
    echo ======================================================================
    echo Docker Desktop has been installed.
    echo Please RESTART your computer, then run this script again.
    echo.
    pause
    exit /b 0
) else (
    echo [OK] Docker is installed
)

:: Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo Docker is installed but not running.
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    echo Waiting for Docker to start (this may take 1-2 minutes)...
    
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo Still waiting for Docker...
        goto wait_docker
    )
    echo [OK] Docker is now running
)

:: ============================================================
:: CHECK AND INSTALL NODE.JS
:: ============================================================
echo.
echo [2/4] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js not found. Downloading installer...
    
    if not exist "temp_setup\node-installer.msi" (
        echo Downloading Node.js...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'temp_setup\node-installer.msi'"
    )
    
    echo Installing Node.js...
    msiexec /i temp_setup\node-installer.msi /quiet /norestart
    
    :: Refresh PATH
    set "PATH=%PATH%;C:\Program Files\nodejs"
    
    echo [OK] Node.js installed
) else (
    echo [OK] Node.js is installed
)

:: ============================================================
:: CHECK AND INSTALL PYTHON
:: ============================================================
echo.
echo [3/4] Checking Python...
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python not found. Downloading installer...
    
    if not exist "temp_setup\python-installer.exe" (
        echo Downloading Python...
        powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.1/python-3.12.1-amd64.exe' -OutFile 'temp_setup\python-installer.exe'"
    )
    
    echo Installing Python...
    temp_setup\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    
    :: Refresh PATH
    set "PATH=%PATH%;C:\Program Files\Python312;C:\Program Files\Python312\Scripts"
    
    echo [OK] Python installed
) else (
    echo [OK] Python is installed
)

:: ============================================================
:: CHECK FOR PSQL (PostgreSQL client)
:: ============================================================
echo.
echo [4/4] Checking PostgreSQL client...
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo PostgreSQL client not found.
    echo We'll use Docker to run psql commands instead.
    set USE_DOCKER_PSQL=1
) else (
    echo [OK] PostgreSQL client is installed
    set USE_DOCKER_PSQL=0
)

echo.
echo ======================================================================
echo                    SETUP COMPLETE - STARTING APP
echo ======================================================================
echo.

:: Now run the main start script
call "%~dp0start.bat"
