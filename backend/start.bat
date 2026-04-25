@echo off
setlocal

cd /d "%~dp0"

echo Starting CodeSecureX Backend...
echo.

REM Use the backend virtual environment
set "PYTHON=%~dp0.venv\Scripts\python.exe"
if "%HOST%"=="" set "HOST=127.0.0.1"
if "%PORT%"=="" set "PORT=8000"

if not exist "%PYTHON%" (
    echo [ERROR] Virtual environment not found at: %PYTHON%
    echo Run: python -m venv .venv
    echo Then: .venv\Scripts\python.exe -m pip install -r requirements.txt
    pause
    exit /b 1
)

echo [OK] Using Python:
"%PYTHON%" --version
echo [OK] Backend URL: http://%HOST%:%PORT%
echo.

REM Start uvicorn via python -m (guarantees correct interpreter)
"%PYTHON%" -m uvicorn main:app --reload --host %HOST% --port %PORT%

pause
