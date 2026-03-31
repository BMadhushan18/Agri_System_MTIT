from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
import os
import json

app = FastAPI(title="Crop Images Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

BASE_DIR = os.path.dirname(__file__)
DB_FILE = os.path.join(BASE_DIR, 'db.json')

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {'crop_images': []}

def save_db(db):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

class CropImageIn(BaseModel):
    crop_name: str
    crop_type: str
    crop_image_name: str
    image_url: Optional[str] = None

class CropImage(CropImageIn):
    id: str

@app.get("/health")
def health():
    return {"service": "crop_images", "status": "ok"}

@app.get("/crop_images", response_model=List[CropImage])
def list_crop_images():
    db = load_db()
    return [CropImage(**item) for item in db.get('crop_images', [])]

@app.get("/crop_images/{image_id}", response_model=CropImage)
def get_crop_image(image_id: str):
    db = load_db()
    for item in db.get('crop_images', []):
        if item.get('id') == image_id:
            return CropImage(**item)
    raise HTTPException(status_code=404, detail="Crop image not found")

@app.post("/crop_images", status_code=201, response_model=CropImage)
def create_crop_image(payload: CropImageIn):
    db = load_db()
    new_item = CropImage(id=str(uuid4()), **payload.dict())
    crop_images = db.get('crop_images', [])
    crop_images.insert(0, new_item.dict())
    db['crop_images'] = crop_images
    save_db(db)
    return new_item

@app.put("/crop_images/{image_id}", response_model=CropImage)
def update_crop_image(image_id: str, payload: CropImageIn):
    db = load_db()
    crop_images = db.get('crop_images', [])
    for idx, item in enumerate(crop_images):
        if item.get('id') == image_id:
            updated = CropImage(id=image_id, **payload.dict())
            crop_images[idx] = updated.dict()
            db['crop_images'] = crop_images
            save_db(db)
            return updated
    raise HTTPException(status_code=404, detail="Crop image not found")

@app.delete("/crop_images/{image_id}")
def delete_crop_image(image_id: str):
    db = load_db()
    crop_images = db.get('crop_images', [])
    for idx, item in enumerate(crop_images):
        if item.get('id') == image_id:
            crop_images.pop(idx)
            db['crop_images'] = crop_images
            save_db(db)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Crop image not found")
