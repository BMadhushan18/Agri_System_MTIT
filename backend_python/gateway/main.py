from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

app = FastAPI(title="Smart Agriculture API Gateway", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SERVICES = {
    "crops":           "http://localhost:8001",
    "weather":         "http://localhost:8002",
    "soil":            "http://localhost:8003",
    "recommendations": "http://localhost:8004",
    "crop_images":     "http://localhost:8005",
}

@app.get("/health")
async def health():
    results = {}
    async with httpx.AsyncClient(timeout=3.0) as client:
        for name, url in SERVICES.items():
            try:
                r = await client.get(f"{url}/health")
                results[name] = r.json()
            except:
                results[name] = {"status": "unreachable"}
    return {"gateway": "ok", "services": results}

async def proxy(request: Request, service_url: str, path: str):
    url = f"{service_url}/{path}"
    params = dict(request.query_params)
    try:
        body = await request.body()
    except:
        body = b""
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ["host", "content-length"]}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.request(
                method=request.method,
                url=url,
                params=params,
                content=body,
                headers=headers
            )
            return JSONResponse(content=r.json(), status_code=r.status_code)
        except httpx.ConnectError:
            raise HTTPException(503, f"Service unavailable: {service_url}")
        except Exception as e:
            raise HTTPException(500, str(e))

@app.api_route("/api/crops/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def crops_route(request: Request, path: str = ""):
    return await proxy(request, SERVICES["crops"], f"crops/{path}" if path else "crops")

@app.api_route("/api/crops", methods=["GET","POST"])
async def crops_root(request: Request):
    return await proxy(request, SERVICES["crops"], "crops")

@app.api_route("/api/crop-library/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def crop_library_route(request: Request, path: str = ""):
    return await proxy(request, SERVICES["crops"], f"crop-library/{path}" if path else "crop-library")

@app.api_route("/api/crop-library", methods=["GET"])
async def crop_library_root(request: Request):
    return await proxy(request, SERVICES["crops"], "crop-library")

@app.api_route("/api/upload-crop-image", methods=["POST"])
async def crop_image_upload(request: Request):
    return await proxy(request, SERVICES["crops"], "upload-crop-image")

@app.api_route("/api/crops-from-library", methods=["POST"])
async def crops_from_library(request: Request):
    return await proxy(request, SERVICES["crops"], "crops-from-library")

@app.api_route("/api/images", methods=["GET"])
async def crop_images(request: Request):
    return await proxy(request, SERVICES["crops"], "images")

@app.api_route("/api/weather/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def weather_route(request: Request, path: str = ""):
    return await proxy(request, SERVICES["weather"], f"weather/{path}" if path else "weather")

@app.api_route("/api/weather", methods=["GET","POST"])
async def weather_root(request: Request):
    return await proxy(request, SERVICES["weather"], "weather")

@app.api_route("/api/soil/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def soil_route(request: Request, path: str = ""):
    return await proxy(request, SERVICES["soil"], f"soil/{path}" if path else "soil")

@app.api_route("/api/soil", methods=["GET","POST"])
async def soil_root(request: Request):
    return await proxy(request, SERVICES["soil"], "soil")

@app.api_route("/api/recommendations/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def reco_route(request: Request, path: str = ""):
    return await proxy(request, SERVICES["recommendations"], f"recommendations/{path}" if path else "recommendations")

@app.api_route("/api/recommendations", methods=["GET","POST"])
async def reco_root(request: Request):
    return await proxy(request, SERVICES["recommendations"], "recommendations")

@app.api_route("/api/crop_images/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def crop_images_route(request: Request, path: str = ""):
    return await proxy(request, SERVICES["crop_images"], f"crop_images/{path}" if path else "crop_images")

@app.api_route("/api/crop_images", methods=["GET","POST"])
async def crop_images_root(request: Request):
    return await proxy(request, SERVICES["crop_images"], "crop_images")
