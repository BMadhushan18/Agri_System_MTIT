@echo off
echo.
echo ========================================
echo   Smart Agriculture Platform
echo   Starting all microservices...
echo ========================================
echo.

set DIR=%~dp0

rem Normalize DIR (remove trailing backslash for nicer concatenation)
if "%DIR:~-1%"=="\" set "DIR=%DIR:~0,-1%"

echo [1/6] Installing Python dependencies...
python -m pip install -r "%DIR%requirements.txt"
if errorlevel 1 goto :error

echo.
echo [2/6] Starting Crop Management Service (port 8001)...
if not exist "%DIR%\services\crop_service\main.py" (
	echo ERROR: Missing %DIR%\services\crop_service\main.py
	goto :error
)
start "Crop Service" /D "%DIR%\services\crop_service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 2 /nobreak >nul

echo [3/6] Starting Weather Data Service (port 8002)...
if not exist "%DIR%\services\weather_service\main.py" (
	echo ERROR: Missing %DIR%\services\weather_service\main.py
	goto :error
)
start "Weather Service" /D "%DIR%\services\weather_service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"

timeout /t 2 /nobreak >nul

echo [4/6] Starting Soil Monitoring Service (port 8003)...
if not exist "%DIR%\services\soil_service\main.py" (
	echo ERROR: Missing %DIR%\services\soil_service\main.py
	goto :error
)
start "Soil Service" /D "%DIR%\services\soil_service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload"

timeout /t 2 /nobreak >nul

echo [5/6] Starting Recommendation Service (port 8004)...
if not exist "%DIR%\services\recommendation_service\main.py" (
	echo ERROR: Missing %DIR%\services\recommendation_service\main.py
	goto :error
)
start "Recommendation Service" /D "%DIR%\services\recommendation_service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload"

timeout /t 2 /nobreak >nul

echo [6/6] Starting Crop Images Service (port 8005)...
if not exist "%DIR%\services\crop_images_service\main.py" (
	echo ERROR: Missing %DIR%\services\crop_images_service\main.py
	goto :error
)
start "Crop Images Service" /D "%DIR%\services\crop_images_service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

timeout /t 2 /nobreak >nul

echo [7/7] Starting API Gateway (port 8010)...
if not exist "%DIR%\gateway\main.py" (
	echo ERROR: Missing %DIR%\gateway\main.py
	goto :error
)
start "API Gateway" /D "%DIR%\gateway" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   API Gateway:      http://localhost:8010
echo   Crop Service:     http://localhost:8001/docs
echo   Weather Service:  http://localhost:8002/docs
echo   Soil Service:     http://localhost:8003/docs
echo   Reco Service:     http://localhost:8004/docs
echo   Crop Images:      http://localhost:8005/docs
echo.

echo ========================================
echo   All backend services started successfully!
echo ========================================
echo.
echo To start the frontend, run in a separate terminal:
echo   cd frontend_react
echo   npm start
echo.
echo Frontend URL: http://localhost:5173
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo   Backend failed to start.
echo   Check the error output above.
echo ========================================
echo.
pause
exit /b 1
