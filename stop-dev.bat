@echo off
rem ============================================================
rem  Rokkam — stop the local demo stack
rem  Kills whatever is listening on ports 8000 / 3000 / 3001
rem  and closes the "Rokkam ..." server windows.
rem ============================================================

powershell -NoProfile -Command "$p = Get-NetTCPConnection -LocalPort 8000,3000,3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { $p | ForEach-Object { Write-Host ('stopping PID ' + $_); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } } else { Write-Host 'nothing running on 8000/3000/3001' }"

taskkill /FI "WINDOWTITLE eq Rokkam API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Rokkam Web*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Rokkam Admin*" /T /F >nul 2>&1

echo.
echo All Rokkam dev servers stopped.
pause
