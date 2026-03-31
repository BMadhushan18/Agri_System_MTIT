#!/bin/bash
# Smart Agriculture Platform - Start All Services

echo ""
echo "========================================"
echo "  Smart Agriculture Platform"
echo "  Starting all microservices..."
echo "========================================"
echo ""

# Get script directory
DIR="$(cd "$(dirname "$0")" && pwd)"

# Install dependencies
echo "[1/6] Installing Python dependencies..."
python -m pip install -r "$DIR/requirements.txt" -q

echo ""
echo "[2/6] Starting Crop Management Service (port 8001)..."
cd "$DIR/services/crop_service"
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
CROP_PID=$!

sleep 1
echo "[3/6] Starting Weather Data Service (port 8002)..."
cd "$DIR/services/weather_service"
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload &
WEATHER_PID=$!

sleep 1
echo "[4/6] Starting Soil Monitoring Service (port 8003)..."
cd "$DIR/services/soil_service"
python -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload &
SOIL_PID=$!

sleep 1
echo "[5/6] Starting Recommendation Service (port 8004)..."
cd "$DIR/services/recommendation_service"
python -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload &
RECO_PID=$!

sleep 1
echo "[6/6] Starting API Gateway (port 8010)..."
cd "$DIR/gateway"
python -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload &
GATEWAY_PID=$!

sleep 2
echo ""
echo "========================================"
echo "  All services started!"
echo "========================================"
echo ""
echo "  API Gateway:      http://localhost:8010"
echo "  Crop Service:     http://localhost:8001/docs"
echo "  Weather Service:  http://localhost:8002/docs"
echo "  Soil Service:     http://localhost:8003/docs"
echo "  Reco. Service:    http://localhost:8004/docs"
echo ""

echo "[7/7] Starting Frontend Server (port 3000)..."
cd "$DIR/frontend"
python -m http.server 3000 &
FRONTEND_PID=$!

sleep 1
echo ""
echo "========================================"
echo "  Frontend available at: http://localhost:3000"
echo "========================================"
echo ""

echo "Opening frontend in default browser..."
# Try different commands to open browser (works on Linux, macOS, WSL)
if command -v xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:3000
elif command -v open > /dev/null 2>&1; then
    open http://localhost:3000
elif command -v start > /dev/null 2>&1; then
    start http://localhost:3000
else
    echo "Please manually open: http://localhost:3000"
fi

echo ""
echo "  Press Ctrl+C to stop all services."
echo "========================================"
echo ""

# Keep running
trap "echo 'Stopping all services...'; kill $CROP_PID $WEATHER_PID $SOIL_PID $RECO_PID $GATEWAY_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
