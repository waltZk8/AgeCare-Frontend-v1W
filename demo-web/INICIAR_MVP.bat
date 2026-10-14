@echo off
cd /d "%~dp0"
set "AGECARE_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
echo AgeCare local: http://localhost:3000
echo Mantenga esta ventana abierta mientras prueba el MVP.
if exist "%AGECARE_PY%" (
  start "" "http://localhost:3000"
  "%AGECARE_PY%" -m http.server 3000 --bind 127.0.0.1
) else (
  python --version >nul 2>&1
  if errorlevel 1 (
    echo Se necesita Python. Tambien puede abrir index.html directamente.
    pause
    exit /b 1
  )
  start "" "http://localhost:3000"
  python -m http.server 3000 --bind 127.0.0.1
)
