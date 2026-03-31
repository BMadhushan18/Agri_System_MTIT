# Smart Agriculture Monitoring Platform
## Microservices System — Python FastAPI + HTML/CSS/JS

---

## System Architecture

```
Frontend (HTML/CSS/JS)
        |
        v
API Gateway (port 8000)
        |
   _____|_____________________
   |         |        |       |
Crop      Weather   Soil   Recommendation
Service   Service  Service   Service
(8001)    (8002)   (8003)    (8004)
   |         |        |       |
crop.db  weather.db soil.db reco.db
```

---

## Requirements

- Python 3.8+
- pip

---

## How to Run

### Linux / Mac
```bash
chmod +x start.sh
./start.sh
```

### Windows
Double-click `start.bat`

Or manually:
```bash
pip install -r requirements.txt

# Terminal 1:
cd services/crop_service && uvicorn main:app --port 8001 --reload

# Terminal 2:
cd services/weather_service && uvicorn main:app --port 8002 --reload

# Terminal 3:
cd services/soil_service && uvicorn main:app --port 8003 --reload

# Terminal 4:
cd services/recommendation_service && uvicorn main:app --port 8004 --reload

# Terminal 5 (Gateway):
cd gateway && uvicorn main:app --port 8000 --reload
```

---

## Frontend

Open `frontend/index.html` in your browser.

Or run a simple server:
```bash
python -m http.server 3000 -d frontend/
# Then go to: http://localhost:3000
```

---

## API Endpoints (via Gateway)

### Crop Management
- `GET    /api/crops`           — List all crops
- `POST   /api/crops`           — Add new crop
- `GET    /api/crops/{id}`      — Get one crop
- `PUT    /api/crops/{id}`      — Update crop
- `DELETE /api/crops/{id}`      — Delete crop

### Weather Data
- `GET    /api/weather`         — List all records
- `POST   /api/weather`         — Add record
- `GET    /api/weather/{id}`    — Get one record
- `PUT    /api/weather/{id}`    — Update record
- `DELETE /api/weather/{id}`    — Delete record

### Soil Monitoring
- `GET    /api/soil`            — List all records
- `POST   /api/soil`            — Add record
- `GET    /api/soil/{id}`       — Get one record
- `PUT    /api/soil/{id}`       — Update record
- `DELETE /api/soil/{id}`       — Delete record

### Recommendations
- `GET    /api/recommendations`              — List all
- `POST   /api/recommendations/generate`    — Auto-generate (needs cropId, soilId, weatherId)
- `DELETE /api/recommendations/{id}`         — Delete

### System
- `GET    /health`              — Check all service health

---

## Swagger API Docs

Each service has built-in Swagger docs:
- Crop Service:     http://localhost:8001/docs
- Weather Service:  http://localhost:8002/docs
- Soil Service:     http://localhost:8003/docs
- Reco Service:     http://localhost:8004/docs

---

## Team Member Responsibilities

| Member | Service | Port | File |
|--------|---------|------|------|
| Member 1 | Crop Management Service | 8001 | services/crop_service/main.py |
| Member 2 | Weather Data Service | 8002 | services/weather_service/main.py |
| Member 3 | Soil Monitoring Service | 8003 | services/soil_service/main.py |
| Member 4 | Recommendation Service | 8004 | services/recommendation_service/main.py |

---

## Recommendation Logic

The recommendation engine analyzes:
- **pH levels** → Lime or Sulfur advice
- **NPK levels** → Fertilizer type recommendations
- **Rainfall + Moisture** → Irrigation schedule
- **Humidity + Temperature** → Pest and disease alerts
- **Forecast** → Skip irrigation if rain expected

---

## Tech Stack

- **Backend:** Python FastAPI
- **Database:** SQLite (one per service)
- **Gateway:** FastAPI reverse proxy
- **Frontend:** HTML5 + CSS3 + Vanilla JS
- **API Docs:** Swagger UI (built into FastAPI)
