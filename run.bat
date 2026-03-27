@echo off
SETLOCAL EnableDelayedExpansion
TITLE LRMC Image GEO TAG Toolkit

:: --- Color Palette (TrueColor/ANSI) ---
SET "ESC="
SET "ORANGE=%ESC%[38;2;255;125;0m"
SET "SLATE=%ESC%[38;2;148;163;184m"
SET "WHITE=%ESC%[38;2;255;255;255m"
SET "RED=%ESC%[38;2;239;68;68m"
SET "GREEN=%ESC%[38;2;34;197;94m"
SET "RESET=%ESC%[0m"

:: --- Header Implementation ---
cls
echo %ORANGE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo  %ORANGE%LRMC%RESET% %WHITE%image %ORANGE%GEO TAG%RESET% %WHITE%Toolkit%RESET% %SLATE%[v1.2]%RESET%
echo  %SLATE%Source:%RESET% %~dp0
echo %ORANGE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

:: --- Step 1: Environment Validation ---
echo %SLATE%[%ORANGE%01%SLATE%]%RESET% Validating Environment...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  %RED%[!] SYSTEM ERROR: Node.js runtime not detected.%RESET%
    echo  %SLATE%Please install Node.js to use the LRMC processing engine.%RESET%
    echo.
    pause
    exit /b
)
echo  %GREEN%OK%RESET% %SLATE%- Node.js detected.%RESET%

:: --- Step 2: Directory Context ---
cd /d "%~dp0"

:: --- Step 3: Execution ---
echo %SLATE%[%ORANGE%02%SLATE%]%RESET% Initializing LRMC Engine...
echo.
node index.js
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  %RED%[!] EXECUTION ERROR: index.js failed to complete.%RESET%
) ELSE (
    echo.
    echo %ORANGE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
    echo  %GREEN%SUCCESS:%RESET% %WHITE%Process finalized successfully.%RESET%
)

:: --- Step 4: Finalize ---
echo %ORANGE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.
echo %SLATE%Task complete. Press any key to exit toolkit.%RESET%
pause >nul