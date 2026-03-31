# Crop Image Selection - Quick Guide

## What Changed?

### 🖼️ Crop Form - Now with Image Selection!

**Before:**
- Text input for crop name
- Text input for crop type
- 7 other optional fields
- **No images**

**After:**
```
┌─────────────────────────────────────────┐
│ Add New Crop                          × │
├─────────────────────────────────────────┤
│                                         │
│ 📍 SELECT FROM CROP LIBRARY             │
│ ┌───────────────────────────────────┐  │
│ │ 🌾    │ 🌽    │ 🥔    │ 🍅    │  │
│ │ Rice  │ Corn  │Potat..│Tomato │  │
│ │Grain  │Grain  │ Veg.. │ Veg.. │  │
│ └───────────────────────────────────┘  │
│ (scroll for more)                      │
│                                         │
│ ─────────────────────────────────────  │
│ 📤 OR UPLOAD CUSTOM IMAGE              │
│ [Choose File] [Preview]                │
│                                         │
│ ═════════════════════════════════════  │
│ 🖼️ [Image Preview]                     │
│    Rice (Grain)                        │
│                                         │
│ 📝 CROP DETAILS                        │
│ Crop Name *: ________________          │
│ Crop Type *: ________________          │
│ Planting Date: __/__/____               │
│ Harvest Date: __/__/____                │
│ Field Location: ________________        │
│ Farmer Name: ________________           │
│ Status: [Growing ▼]                    │
│                                         │
│ [Cancel]  [Save Crop]                  │
└─────────────────────────────────────────┘
```

---

## How to Use

### Option 1: Select from Library (Recommended for Common Crops)

1. Click "**+ Add Crop**" button
2. See crop library grid with 8 common crops:
   - Rice, Corn, Wheat, Tomato
   - Potato, Banana, Coconut, Sugarcane
3. **Click on a crop card** (e.g., Tomato)
4. ✅ Crop name & type auto-filled
5. ✅ Crop image displayed
6. Fill in: Dates, Location, Farmer, Status
7. Click "Save Crop"

### Option 2: Upload Custom Image (For Specialty Crops)

1. Click "**+ Add Crop**" button
2. Click "**Choose File**" under "Upload Custom Image"
3. Select an image from your computer
4. Click "**Preview**" (image auto-uploads)
5. ✅ Image preview shows
6. Manual Entry:
   - Crop Name (required)
   - Crop Type (required)
   - Fill in: Dates, Location, Farmer, Status
7. Click "Save Crop"

---

## Database Changes

### New Crop Library Table

```sql
CREATE TABLE crop_library (
    id INTEGER PRIMARY KEY,
    crop_name TEXT UNIQUE,        -- e.g., "Rice"
    crop_type TEXT,               -- e.g., "Grain"
    description TEXT,             -- e.g., "High yield cereal"
    ideal_temp TEXT,              -- e.g., "20-30°C"
    ideal_humidity TEXT,          -- e.g., "70-80%"
    crop_image_path TEXT,         -- Path to image
    created_at TIMESTAMP
)
```

### Updated Crops Table

```sql
-- NEW COLUMN ADDED:
ALTER TABLE crops ADD COLUMN crop_image_path TEXT;

-- Now stores path to crop image when saved
-- Example: "/images/crop_rice.png"
```

---

## API Endpoints (New)

### 1. Get Crop Library
```
GET /api/crop-library
Response: [
  {
    "id": 1,
    "crop_name": "Rice",
    "crop_type": "Grain",
    "description": "High yield cereal crop",
    "ideal_temp": "20-30°C",
    "ideal_humidity": "70-80%",
    "crop_image_path": "/images/crop_rice.png"
  },
  ...
]
```

### 2. Upload Crop Image
```
POST /api/upload-crop-image
Content-Type: multipart/form-data
Body: {file: <image file>}

Response: {
  "filename": "crop_1732934285.png",
  "image_url": "/images/crop_1732934285.png",
  "message": "Image uploaded successfully"
}
```

### 3. Create Crop (Modified)
```
POST /api/crops
Body: {
  "crop_name": "Tomato",
  "crop_type": "Vegetable",
  "crop_image_path": "/images/crop_tomato.png",
  ...other fields...
}
```

---

## Sample Crop Library

| ID | Crop | Type | Image | Ideal Temp | Humidity |
|----|------|------|-------|-----------|----------|
| 1 | Rice | Grain | 🌾 | 20-30°C | 70-80% |
| 2 | Corn | Grain | 🌽 | 18-27°C | 40-60% |
| 3 | Wheat | Grain | 🌾 | 15-25°C | 50-70% |
| 4 | Tomato | Vegetable | 🍅 | 20-30°C | 60-70% |
| 5 | Potato | Vegetable | 🥔 | 15-20°C | 70-80% |
| 6 | Banana | Fruit | 🍌 | 24-28°C | 75-85% |
| 7 | Coconut | Palmate | 🥥 | 25-35°C | 70-80% |
| 8 | Sugarcane | Industrial | 🌿 | 20-30°C | 60-75% |

---

## File Locations

```
services/crop_service/
├── crop_images/                    (NEW - Image storage)
│   ├── crop_rice.png               (8 sample images)
│   ├── crop_corn.png
│   ├── crop_wheat.png
│   ├── crop_tomato.png
│   ├── crop_potato.png
│   ├── crop_banana.png
│   ├── crop_coconut.png
│   └── crop_sugarcane.png
├── main.py                         (UPDATED)
├── crop.db                         (RECREATED with new schema)
├── seed_images.py                  (NEW - Image generator)
└── check_db.py                     (NEW - DB checker)
```

---

## JavaScript Functions

| Function | Purpose |
|----------|---------|
| `loadCropLibrary()` | Fetch and render crop library grid |
| `selectCropFromLibrary(...)` | Auto-fill form from library crop |
| `previewCropImage()` | Show image preview before upload |
| `uploadCropImage(file)` | Send image to backend |
| `clearCropForm()` | Reset all form fields |
| `saveCrop()` | Save crop with image path |

---

## Workflow Comparison

### OLD WORKFLOW ❌
```
Manual Entry Only
└─ Enter Crop Name (text)
└─ Enter Crop Type (text)
└─ Enter other fields
└─ Save
└─ Result: No image associated
```

### NEW WORKFLOW ✅
```
Visual Selection First
├─ Option A: Browse & Click Library Crop
│  └─ Auto-fill Name, Type, Image
│
├─ Option B: Upload Custom Image
│  └─ Preview & Upload
│
└─ Complete Remaining Fields
   └─ Save with Image Path
   └─ Result: Rich crop record with image
```

---

## Missing Parts - All Fixed! ✅

| What Was Missing | How Fixed |
|------------------|-----------|
| ❌ No image storage | ✅ Created `crop_images/` directory with StaticFiles mounting |
| ❌ No crop library | ✅ Created `crop_library` table + seeded 8 crops |
| ❌ No image upload | ✅ Added `/upload-crop-image` endpoint |
| ❌ No UI for images | ✅ Enhanced modal with library grid + upload section |
| ❌ Static form only | ✅ Dynamic form with auto-fill from selection |
| ❌ Text-only entry | ✅ Visual crop selection with thumbnails |
| ❌ No workflow | ✅ Created 4-step guided workflow |

---

## Getting Started

1. **Start All Services (Automated):**
   ```bash
   # Windows
   .\start.bat

   # Linux/Mac
   ./start.sh
   ```

   This will automatically:
   - ✅ Install Python dependencies
   - ✅ Start all 4 microservices (ports 8001-8004)
   - ✅ Start API Gateway (port 8000)
   - ✅ Start Frontend Server (port 3000)
   - ✅ Open browser to http://localhost:3000

2. **Alternative Manual Start:**
   ```bash
   # Backend services
   cd services/crop_service
   uvicorn main:app --port 8001 --reload

   # Frontend (in another terminal)
   cd frontend
   python -m http.server 3000
   ```

3. **Try It:**
   - Browser should open automatically to http://localhost:3000
   - Click "**+ Add Crop**" button
   - Browse crop library
   - Click on Rice (or any crop)
   - Watch fields auto-fill! 🎉
   - Fill in dates/location
   - Save crop
   - See it in table

---

## Key Improvements

✨ **User Experience:**
- Visual crop selection instead of typing
- Auto-fill reduces data entry errors
- Thumbnails enable quick recognition
- Optional custom uploads for specialty crops

🔧 **Technical:**
- Clean separation: library vs. user crops
- Image hosting via StaticFiles
- Scalable to many crops
- Backward compatible API

📊 **Data:**
- Rich crop records with images
- Crop metadata (ideal temp/humidity)
- Future-proof for crop analysis features
