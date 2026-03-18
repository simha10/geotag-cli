@echo off

echo ===============================
echo   GEO TAGGING TOOL STARTING
echo ===============================

cd /d %~dp0

node index.js

echo.
echo ===============================
echo   PROCESS FINISHED
echo ===============================

pause
