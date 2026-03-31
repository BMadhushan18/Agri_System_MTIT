from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Union
from uuid import uuid4
import os
from pymongo import MongoClient
import json

app = FastAPI(title="Recommendation Service")
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
    return {"recommendations": []}


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
        return _mongo_client[MONGO_DB]["recommendation"]
    except Exception:
        return None

class AdviceItem(BaseModel):
    advice_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    water_amount: Optional[float] = None
    water_unit: Optional[str] = None
    advice_text: str


class RecommendationIn(BaseModel):
    crop_id: str
    target_date: Optional[str] = None
    target_date_end: Optional[str] = None
    advices: Optional[List[Union[AdviceItem, str]]] = None
    fertilizer_advice: Optional[str] = None
    irrigation_advice: Optional[str] = None
    pest_alert: Optional[str] = None
    general_notes: Optional[str] = None
    recommendation_type: Optional[str] = "expert_task"

class Recommendation(RecommendationIn):
    id: str

RECOMMENDATIONS: List[Recommendation] = []

@app.get("/health")
def health():
    return {"service": "recommendations", "status": "ok"}

@app.get("/recommendations", response_model=List[Recommendation])
def list_recommendations():
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("recommendations", []) or []
        return [Recommendation(**d) for d in items]
    docs = list(col.find({}, {"_id": 0}).sort([("target_date_end", -1), ("target_date", -1)]))
    return [Recommendation(**d) for d in docs]

@app.get("/recommendations/{rec_id}", response_model=Recommendation)
def get_recommendation(rec_id: str):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        for d in (db.get("recommendations", []) or []):
            if d.get("id") == rec_id:
                return Recommendation(**d)
        raise HTTPException(status_code=404, detail="Record not found")
    doc = col.find_one({"id": rec_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")
    return Recommendation(**doc)

@app.post("/recommendations", status_code=201, response_model=Recommendation)
def create_recommendation(payload: RecommendationIn):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    record = Recommendation(id=str(uuid4()), **data)
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("recommendations", []) or []
        items.insert(0, record.model_dump() if hasattr(record, "model_dump") else record.dict())
        db["recommendations"] = items
        _save_file_db(db)
        return record
    col.insert_one(record.model_dump() if hasattr(record, "model_dump") else record.dict())
    return record

@app.put("/recommendations/{rec_id}", response_model=Recommendation)
def update_recommendation(rec_id: str, payload: RecommendationIn):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("recommendations", []) or []
        for idx, d in enumerate(items):
            if d.get("id") == rec_id:
                updated = Recommendation(id=rec_id, **data)
                items[idx] = updated.model_dump() if hasattr(updated, "model_dump") else updated.dict()
                db["recommendations"] = items
                _save_file_db(db)
                return updated
        raise HTTPException(status_code=404, detail="Record not found")

    existing = col.find_one({"id": rec_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")
    updated = Recommendation(id=rec_id, **data)
    col.replace_one({"id": rec_id}, updated.model_dump() if hasattr(updated, "model_dump") else updated.dict())
    return updated

@app.delete("/recommendations/{rec_id}")
def delete_recommendation(rec_id: str):
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("recommendations", []) or []
        for idx, d in enumerate(items):
            if d.get("id") == rec_id:
                items.pop(idx)
                db["recommendations"] = items
                _save_file_db(db)
                return {"status": "deleted"}
        raise HTTPException(status_code=404, detail="Record not found")
    res = col.delete_one({"id": rec_id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"status": "deleted"}

@app.post("/recommendations/generate", status_code=201)
def generate_recommendation(payload: RecommendationIn):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    record = Recommendation(id=str(uuid4()), **data)
    col = _get_collection()
    if col is None:
        db = _load_file_db()
        items = db.get("recommendations", []) or []
        items.insert(0, record.model_dump() if hasattr(record, "model_dump") else record.dict())
        db["recommendations"] = items
        _save_file_db(db)
        return record
    col.insert_one(record.model_dump() if hasattr(record, "model_dump") else record.dict())
    return record
