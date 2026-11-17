@echo off
title CloudPulse One-Click Launcher
cls
echo ========================================================================
echo                  CLOUDPULSE RESILIENCE PLATFORM
echo                     One-Click System Launcher
echo ========================================================================
echo.
echo [1/3] Starting Backend API Server (Port 8001)...
start "CloudPulse-Backend" /min cmd /c "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

echo [2/3] Starting Frontend Dev Server (Port 5174)...
start "CloudPulse-Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5174"

echo [3/3] Initializing services and waiting for readiness...
timeout /t 3 /nobreak >nul

echo.
echo Launching CloudPulse in your default browser...
start http://127.0.0.1:5174

echo.
echo ========================================================================
echo   SUCCESS! CloudPulse is live and running at http://127.0.0.1:5174
echo   Keep the minimized server windows open while using the platform.
echo   To shut down all services, double-click STOP_CLOUDPULSE.bat.
echo ========================================================================
echo.
timeout /t 5
