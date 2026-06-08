from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import logging
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import connect_db, close_db
from auth_routes import router as auth_router
from recipe_routes import router as recipe_router
from campaign_routes import router as campaign_router
from product_routes import router as product_router
from receipt_routes import router as receipt_router

app = FastAPI(title="QuickTill API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(recipe_router)
app.include_router(campaign_router)
app.include_router(product_router)
app.include_router(receipt_router)


@app.on_event("startup")
async def startup():
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    await close_db()


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
