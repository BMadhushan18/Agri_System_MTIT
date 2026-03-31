from pathlib import Path

BASE = (Path(__file__).parent / ".." / ".." / ".." / "frontend_react" / "public" / "crop_images").resolve()
BASE.mkdir(parents=True, exist_ok=True)

print(f"Crop images directory ready at: {BASE}")
