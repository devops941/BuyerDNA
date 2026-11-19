import os
import time
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config.db import connect_db, disconnect_db
from app.config.env import settings
from app.routers import auth, datasets, analysis, customers, dashboard, reports, history
from app.routers import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="BuyerDNA Python Backend API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_path = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(upload_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "BuyerDNA Python Backend API",
        "timestamp": time.time(),
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"\n[Backend Error] Exception on {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": str(exc)},
    )


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["datasets"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(history.router, prefix="/api/v1/history", tags=["history"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["settings"])
