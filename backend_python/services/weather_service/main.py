from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
import os
from pymongo import MongoClient
import json

app = FastAPI(title="Weather Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "agriculture")

BASE_DIR = os.path.dirname(__file__)
DB_FILE = os.path.join(BASE_DIR, "db.json")


def _load_file_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"weather": []}


def _save_file_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

_mongo_client: Optional[MongoClient] = None


def _get_collection():
    """Return Mongo collection or None if MongoDB not reachable."""
    global _mongo_client
    try:
        if _mongo_client is None:
            _mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
        _mongo_client.admin.command("ping")
        return _mongo_client[MONGO_DB]["weather"]
    except Exception:
        return None


def _doc_to_weather(doc) -> "Weather":
    data = dict(doc)
    data.pop("_id", None)
    return Weather(**data)

class WeatherIn(BaseModel):
    crop_id: Optional[str] = None
    time: Optional[str] = None
    area_name: str
    date: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    wind_speed: Optional[float] = None
    forecast_condition: Optional[str] = None

class Weather(WeatherIn):
    id: str

WEATHER: List[Weather] = []

@app.get("/health")
def health():
    return {"service": "weather", "status": "ok"}

@app.get("/weather", response_model=List[Weather])
def list_weather():
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        return [Weather(**d) for d in (db.get("weather", []) or [])]
    docs = list(col.find({}, {"_id": 0}).sort([("date", -1), ("time", -1)]))
    return [Weather(**d) for d in docs]

@app.get("/weather/{record_id}", response_model=Weather)
def get_weather(record_id: str):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        for d in (db.get("weather", []) or []):
            if d.get("id") == record_id:
                return Weather(**d)
        raise HTTPException(status_code=404, detail="Record not found")
    doc = col.find_one({"id": record_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")
    return Weather(**doc)

@app.post("/weather", status_code=201, response_model=Weather)
def create_weather(payload: WeatherIn):
    record = Weather(id=str(uuid4()), **payload.dict())
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("weather", []) or []
        items.insert(0, record.dict())
        db["weather"] = items
        _save_file_db(db)
        return record
    doc = record.dict()
    col.insert_one(doc)
    return record

@app.put("/weather/{record_id}", response_model=Weather)
def update_weather(record_id: str, payload: WeatherIn):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("weather", []) or []
        for idx, d in enumerate(items):
            if d.get("id") == record_id:
                updated = Weather(id=record_id, **payload.dict())
                items[idx] = updated.dict()
                db["weather"] = items
                _save_file_db(db)
                return updated
        raise HTTPException(status_code=404, detail="Record not found")
    existing = col.find_one({"id": record_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")
    updated = Weather(id=record_id, **payload.dict())
    doc = updated.dict()
    col.replace_one({"id": record_id}, doc)
    return updated

@app.delete("/weather/{record_id}")
def delete_weather(record_id: str):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("weather", []) or []
        for idx, d in enumerate(items):
            if d.get("id") == record_id:
                items.pop(idx)
                db["weather"] = items
                _save_file_db(db)
                return {"status": "deleted"}
        raise HTTPException(status_code=404, detail="Record not found")
    res = col.delete_one({"id": record_id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"status": "deleted"}
