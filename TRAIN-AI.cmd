@echo off
setlocal
title AgroRotate - Real Data AI Training
cd /d "%~dp0"

echo ============================================================
echo  AgroRotate - Training the AI on REAL data
echo  Sources: MAPSPAM 2020 + NASA POWER + SoilGrids + WoSIS
echo ============================================================
echo.

set "PY="
if exist "%~dp0AI\.venv\Scripts\python.exe" (
  set "PY=%~dp0AI\.venv\Scripts\python.exe"
) else (
  where py >nul 2>nul
  if not errorlevel 1 set "PY=py"
)
if not defined PY (
  where python >nul 2>nul
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo [X] Python was not found.
  echo     Install Python 3.10+ or restore AI\.venv, then run this file again.
  pause
  exit /b 1
)

echo Using: %PY%
%PY% -c "import pandas, numpy, torch, sklearn, scipy" >nul 2>nul
if errorlevel 1 (
  echo [X] Required packages are missing in this Python.
  echo     Run:  %PY% -m pip install pandas numpy pyarrow scikit-learn scipy torch psutil
  pause
  exit /b 1
)

echo.
echo [1/4] Building the real training table...
echo [2/4] Training, validating and benchmarking...
echo [3/4] Calibrating uncertainty from real WoSIS pairs...
echo [4/4] Installing the model into the app...
echo.

%PY% "%~dp0AI\pipeline\run_all.py" --deploy
if errorlevel 1 (
  echo.
  echo [X] Training failed. Scroll up for the first error.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  DONE. The new model is active in:
echo    public\models
echo    server\models
echo  Report: AI\models\real_v1\MODEL_CARD.md
echo  Start the app with START-HERE.cmd
echo ============================================================
pause
endlocal
