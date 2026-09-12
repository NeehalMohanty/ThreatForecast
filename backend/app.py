from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .config import FRONTEND
from .routes import router
from . import services

@asynccontextmanager
async def lifespan(app):
    services.load_engine()
    yield

app = FastAPI(title="ThreatForecast API", version="2.1.0", lifespan=lifespan,
              description="SIH26153: traffic classification with heuristic next-stage forecasting.")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
app.include_router(router)
app.include_router(router, prefix="/api", include_in_schema=False)
if (FRONTEND / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND / "assets"), name="assets")

@app.get("/{path:path}", include_in_schema=False)
def frontend(path: str):
    if path.startswith(("api/", "assets/")):
        raise HTTPException(404, "Not found")
    target = (FRONTEND / path).resolve()
    if target.is_relative_to(FRONTEND.resolve()) and target.is_file():
        return FileResponse(target)
    if path in {"", "forecast", "threats", "monitoring", "workspace"} and (FRONTEND / "index.html").is_file():
        return FileResponse(FRONTEND / "index.html")
    raise HTTPException(404, "Build the frontend with npm ci and npm run build, or use /docs.")
