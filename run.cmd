@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title AgroRotate - launcher

set "API_PORT=8000"
set "WEB_PORT=5173"

if /I "%~1"=="check" goto :check
if /I "%~1"=="dry" goto :dry

echo ============================================
echo   AgroRotate - v5 evidence build
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH.
  echo Install Node.js 18 or newer from https://nodejs.org then run this file again.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo Node.js %NODE_VERSION% found.

if not exist "node_modules\" (
  echo.
  echo Installing dependencies, this runs only once...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

echo.
netstat -ano | findstr ":%API_PORT%" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Starting local API on http://127.0.0.1:%API_PORT% ...
  start "AgroRotate API" /D "%~dp0." cmd /k "npm run dev:api"
) else (
  echo Local API already listening on port %API_PORT%, reusing it.
)

netstat -ano | findstr ":%WEB_PORT%" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Starting web app on http://127.0.0.1:%WEB_PORT% ...
  start "AgroRotate Web" /D "%~dp0." cmd /k "npm run dev -- --open"
) else (
  echo Web app already listening on port %WEB_PORT%, opening it instead.
  start "" "http://127.0.0.1:%WEB_PORT%/"
)

echo.
echo Two windows were opened:
echo   - "AgroRotate API"  - NASA POWER cache + plan storage
echo   - "AgroRotate Web"  - the interface (browser opens automatically)
echo.
echo Close both windows to stop the project.
echo If a window reports "port already in use", close the old one and retry.
echo.
timeout /t 5 >nul
exit /b 0

:check
echo Node:
where node
node -v
echo.
if exist "node_modules\" (echo Dependencies: installed) else (echo Dependencies: missing - run this file without "check")
echo.
echo Ports:
netstat -ano | findstr ":%API_PORT%" | findstr "LISTENING" >nul
if errorlevel 1 (echo   %API_PORT%: free) else (echo   %API_PORT%: in use)
netstat -ano | findstr ":%WEB_PORT%" | findstr "LISTENING" >nul
if errorlevel 1 (echo   %WEB_PORT%: free) else (echo   %WEB_PORT%: in use)
exit /b 0

:dry
echo [dry-run] would start: start "AgroRotate API" /D "%~dp0." cmd /k "npm run dev:api"
echo [dry-run] would start: start "AgroRotate Web" /D "%~dp0." cmd /k "npm run dev -- --open"
exit /b 0
