@echo off
title NEMO Conductor v3.1
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       NEMO CONDUCTOR v3.1                ║
echo  ║       5-Key Council Dashboard            ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Starting backend server...
echo.

cd /d "E:\.skills\nemo-conductor\gui\backend"

:: Start server and open browser
start "" "http://localhost:7777"
npm start
