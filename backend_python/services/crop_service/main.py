from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
import os
import json

app = FastAPI(title="Crop Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

BASE_DIR = os.path.dirname(__file__)
IMAGES_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "..", "..", "frontend_react", "public", "crop_images")
)
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/crop_images", StaticFiles(directory=IMAGES_DIR), name="crop_images")

DB_FILE = os.path.join(BASE_DIR, 'db.json')

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {'images': [], 'crops': []}

def save_db(db):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


def refresh_image_collection():
    db = load_db()
    image_items = []
    for filename in sorted(os.listdir(IMAGES_DIR)):
        name, ext = os.path.splitext(filename)
        if ext.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
            continue
        image_items.append({'name': filename, 'path': f'/crop_images/{filename}'})
    db['images'] = image_items
    save_db(db)
    return db

DB = refresh_image_collection()

class CropIn(BaseModel):
    crop_name: str
    crop_type: str
    planting_date: Optional[str] = None
    harvest_date: Optional[str] = None
    field_location: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    village: Optional[str] = None
    farmer_name: Optional[str] = None
    status: Optional[str] = "growing"
    crop_image_path: Optional[str] = None
    crop_image_name: Optional[str] = None

class Crop(CropIn):
    id: str

class CropLibraryItem(BaseModel):
    id: str
    crop_name: str
    crop_type: str
    crop_image_path: Optional[str] = None
    description: Optional[str] = None
    ideal_temp: Optional[str] = None
    ideal_humidity: Optional[str] = None

LIBRARY_META = {
    "crop_rice": {
        "crop_name": "Rice",
        "crop_type": "Grain",
        "description": "Staple crop",
        "ideal_temp": "25-30C",
        "ideal_humidity": "70%",
    },
    "crop_mango": {
        "crop_name": "Mango",
        "crop_type": "Fruit",
        "description": "Tropical fruit",
        "ideal_temp": "24-30C",
        "ideal_humidity": "65%",
    },
    "crop_tomato": {
        "crop_name": "Tomato",
        "crop_type": "Vegetable",
        "description": "Garden crop",
        "ideal_temp": "18-25C",
        "ideal_humidity": "65%",
    },
}

def build_crop_library() -> List[CropLibraryItem]:
    items: List[CropLibraryItem] = []
    for filename in sorted(os.listdir(IMAGES_DIR)):
        name, ext = os.path.splitext(filename)
        if ext.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        meta = LIBRARY_META.get(name, {})
        fallback_name = name.replace("crop_", "").replace("_", " ").strip().title() or name
        items.append(
            CropLibraryItem(
                id=f"img-{name}",
                crop_name=meta.get("crop_name", fallback_name),
                crop_type=meta.get("crop_type", "Unknown"),
                crop_image_path=filename,
                description=meta.get("description"),
                ideal_temp=meta.get("ideal_temp"),
                ideal_humidity=meta.get("ideal_humidity"),
            )
        )
    return items

@app.get("/health")
def health():
    return {"service": "crops", "status": "ok"}

@app.get("/images")
def images():
    db = load_db()
    return db.get('images', [])

@app.get("/crops", response_model=List[Crop])
def list_crops():
    db = load_db()
    return [Crop(**item) for item in db.get('crops', [])]

@app.get("/crops/{crop_id}", response_model=Crop)
def get_crop(crop_id: str):
    db = load_db()
    for c in db.get('crops', []):
        if c.get('id') == crop_id:
            return Crop(**c)
    raise HTTPException(status_code=404, detail="Crop not found")

@app.post("/crops", status_code=201, response_model=Crop)
def create_crop(payload: CropIn):
    db = load_db()
    new_crop = Crop(id=str(uuid4()), **payload.dict())
    crops = db.get('crops', [])
    crops.insert(0, new_crop.dict())
    db['crops'] = crops
    save_db(db)
    return new_crop

@app.put("/crops/{crop_id}", response_model=Crop)
def update_crop(crop_id: str, payload: CropIn):
    db = load_db()
    crops = db.get('crops', [])
    for idx, c in enumerate(crops):
        if c.get('id') == crop_id:
            updated = Crop(id=crop_id, **payload.dict())
            crops[idx] = updated.dict()
            db['crops'] = crops
            save_db(db)
            return updated
    raise HTTPException(status_code=404, detail="Crop not found")

@app.delete("/crops/{crop_id}")
def delete_crop(crop_id: str):
    db = load_db()
    crops = db.get('crops', [])
    for idx, c in enumerate(crops):
        if c.get('id') == crop_id:
            crops.pop(idx)
            db['crops'] = crops
            save_db(db)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Crop not found")

@app.get("/crop-library", response_model=List[CropLibraryItem])
def list_crop_library():
    return build_crop_library()

@app.get("/crop-library/{library_id}", response_model=CropLibraryItem)
def get_crop_library_item(library_id: str):
    for item in build_crop_library():
        if item.id == library_id:
            return item
    raise HTTPException(status_code=404, detail="Library item not found")

@app.post("/crops-from-library", status_code=201, response_model=Crop)
def create_from_library(library_id: str):
    item = None
    for c in build_crop_library():
        if c.id == library_id:
            item = c
            break
    if not item:
        raise HTTPException(status_code=404, detail="Library item not found")
    new_crop = Crop(
        id=str(uuid4()),
        crop_name=item.crop_name,
        crop_type=item.crop_type,
        crop_image_path=item.crop_image_path,
        planting_date=None,
        harvest_date=None,
        field_location=None,
        province=None,
        city=None,
        village=None,
        farmer_name=None,
        status="growing",
    )
    CROPS.insert(0, new_crop)
    return new_crop

@app.post("/upload-crop-image")
async def upload_crop_image(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    filename = f"{uuid4()}{ext}"
    file_path = os.path.join(IMAGES_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    return {"image_url": f"/crop_images/{filename}"}
