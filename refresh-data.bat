@echo off
REM Double-click to refresh the dashboard data from the Google Sheet.
REM Imports only NEW Data_Dates into the shared cloud database, so the online
REM website + team see the new data immediately.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo ============================================================
echo   Refresh Dashboard Data  (import new dates from the sheet)
echo ============================================================
echo.
node ".\node_modules\tsx\dist\cli.mjs" scripts\import-sheet.ts %*
echo.
pause
