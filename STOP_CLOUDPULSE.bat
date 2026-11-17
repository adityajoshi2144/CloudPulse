@echo off
title CloudPulse Shutdown
cls
echo ========================================================================
echo                  CLOUDPULSE RESILIENCE PLATFORM
echo                     One-Click System Shutdown
echo ========================================================================
echo.
echo Stopping CloudPulse backend and frontend servers...

powershell -Command "Get-NetTCPConnection -LocalPort 8001, 5174 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo All CloudPulse services have been safely stopped.
echo.
timeout /t 3
