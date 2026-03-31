from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
import os
from pymongo import MongoClient
import json

app = FastAPI(title="Soil Service")
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
    return {"soil": []}


def _save_file_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

_mongo_client: Optional[MongoClient] = None


def _get_collection():
    global _mongo_client
    try:
        if _mongo_client is None:
            _mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
        _mongo_client.admin.command("ping")
        return _mongo_client[MONGO_DB]["soil"]
    except Exception:
        return None

class SoilIn(BaseModel):
    crop_id: Optional[str] = None
    field_name: str
    soil_type: Optional[str] = None
    ph_value: Optional[float] = None
    moisture_level: Optional[float] = None
    nitrogen_level: Optional[float] = None
    phosphorus_level: Optional[float] = None
    potassium_level: Optional[float] = None
    recorded_date: Optional[str] = None

class Soil(SoilIn):
    id: str

SOIL: List[Soil] = []

@app.get("/health")
def health():
    return {"service": "soil", "status": "ok"}

@app.get("/soil", response_model=List[Soil])
def list_soil():
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        return [Soil(**d) for d in (db.get("soil", []) or [])]
    docs = list(col.find({}, {"_id": 0}).sort("recorded_date", -1))
    return [Soil(**d) for d in docs]

@app.get("/soil/{record_id}", response_model=Soil)
def get_soil(record_id: str):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        for d in (db.get("soil", []) or []):
            if d.get("id") == record_id:
                return Soil(**d)
        raise HTTPException(status_code=404, detail="Record not found")
    doc = col.find_one({"id": record_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")
    return Soil(**doc)

@app.post("/soil", status_code=201, response_model=Soil)
def create_soil(payload: SoilIn):
    record = Soil(id=str(uuid4()), **payload.dict())
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("soil", []) or []
        items.insert(0, record.dict())
        db["soil"] = items
        _save_file_db(db)
        return record
    col.insert_one(record.dict())
    return record

@app.put("/soil/{record_id}", response_model=Soil)
def update_soil(record_id: str, payload: SoilIn):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("soil", []) or []
        for idx, d in enumerate(items):
            if d.get("id") == record_id:
                updated = Soil(id=record_id, **payload.dict())
                items[idx] = updated.dict()
                db["soil"] = items
                _save_file_db(db)
                return updated
        raise HTTPException(status_code=404, detail="Record not found")
    existing = col.find_one({"id": record_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")
    updated = Soil(id=record_id, **payload.dict())
    col.replace_one({"id": record_id}, updated.dict())
    return updated

@app.delete("/soil/{record_id}")
def delete_soil(record_id: str):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("soil", []) or []
        for idx, d in enumerate(items):
            if d.get("id") == record_id:
                items.pop(idx)
                db["soil"] = items
                _save_file_db(db)
                return {"status": "deleted"}
        raise HTTPException(status_code=404, detail="Record not found")
    res = col.delete_one({"id": record_id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"status": "deleted"}
