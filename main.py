from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend.database import init_db
from backend.routers import auth, cards, battle, farm

app = FastAPI(title="젖소 배틀 카드 게임")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(battle.router)
app.include_router(farm.router)

# 프론트엔드 정적 파일 서빙
frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.exists(frontend_path):
    app.mount("/images", StaticFiles(directory=os.path.join(frontend_path, "images")), name="images")
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))

    @app.get("/{page}.html")
    def serve_page(page: str):
        path = os.path.join(frontend_path, f"{page}.html")
        if os.path.exists(path):
            return FileResponse(path)
        return FileResponse(os.path.join(frontend_path, "index.html"))

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"status": "ok"}
