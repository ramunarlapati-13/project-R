@echo off
title RAM-AI Portfolio Server
echo ==========================================================
echo   Starting RAM-AI Portfolio Server...
echo ==========================================================
cd /d "%~dp0"

echo Checking for Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed or not in your system PATH!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b
)

echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo Starting Node.js server...
echo.
node server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The server stopped unexpectedly.
    echo Check if port 3000 is already in use or check the error above.
)
pause
