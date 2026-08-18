@echo off
rem ============================================================
rem  Rokkam — start the full local demo stack
rem  API :8000  |  Seller site :3000  |  Admin :3001
rem  Each server opens in its own window (close = that server dies).
rem  Stop everything cleanly with stop-dev.bat
rem ============================================================
setlocal
set ROOT=%~dp0

if not exist "%ROOT%apps\web\.env.local" (
  echo NEXT_PUBLIC_API_URL=http://localhost:8000> "%ROOT%apps\web\.env.local"
  echo created apps\web\.env.local
)

start "Rokkam API" cmd /k "cd /d %ROOT%services\api && %ROOT%.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
start "Rokkam Web" cmd /k "cd /d %ROOT%apps\web && npm run dev"
start "Rokkam Admin" cmd /k "cd /d %ROOT%apps\admin && npm run dev"

echo Waiting for servers to come up...
timeout /t 12 /nobreak >nul
start http://localhost:3000
start http://localhost:3001

echo.
echo   Seller site   http://localhost:3000
echo   Admin         http://localhost:3001   (login: see ADMIN_CREDENTIALS.txt)
echo   API docs      http://localhost:8000/docs
echo.
echo   Run stop-dev.bat to shut everything down.
echo.
pause
