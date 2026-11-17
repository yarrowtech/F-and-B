@echo off
title Local Print Agent
cd /d "%~dp0"
:loop
node scripts\localDevicePrintAgent.js
echo Print agent stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
