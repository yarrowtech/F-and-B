@echo off
rem Opens the billing site in Chrome so Print goes straight to the default
rem printer with NO print dialog. Close all Chrome windows first.
rem Edit the URL if needed.
start "" chrome.exe --kiosk-printing --app=https://www.efnbmms.com
