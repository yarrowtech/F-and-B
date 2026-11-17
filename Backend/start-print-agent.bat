@echo off
title Local Print Agent
cd /d "%~dp0"
rem Cloud print queue: lets other devices print through this PC.
set PRINT_QUEUE_URL=https://api.efnbmms.com/api/print-queue
set PRINT_AGENT_KEY=8160abe3700818215ac6c2f221077b7fcd681a389fbd1f5a
set PRINT_RESTAURANT_ID=6a2be9f7c9f06dcb99e9b6f5
:loop
node scripts\localDevicePrintAgent.js
echo Print agent stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
