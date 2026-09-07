from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import issues, map, analytics

app = FastAPI(title="CitySync API", version="0.6.0")
app.add_middleware(CORSMiddleware, allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status":"ok","service":"CitySync API"}

app.include_router(issues.router)
app.include_router(map.router)
app.include_router(analytics.router)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
