from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database import get_db
from auth_routes import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductCreate(BaseModel):
    barcode: str
    name: str
    price: float
    category: Optional[str] = "General"
    weight: Optional[float] = None


class Product(BaseModel):
    id: str
    barcode: str
    name: str
    price: float
    category: str
    weight: Optional[float] = None
    created_at: str


# ── GET all products (herkes görebilir) ───────────────────────────────────────
@router.get("")
async def get_products():
    db = get_db()
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products


# ── GET by barcode ─────────────────────────────────────────────────────────────
@router.get("/barcode/{barcode}")
async def get_by_barcode(barcode: str):
    db = get_db()
    product = await db.products.find_one({"barcode": barcode}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ── POST create (sadece admin) ─────────────────────────────────────────────────
@router.post("")
async def create_product(data: ProductCreate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    db = get_db()

    # Aynı barkod var mı?
    existing = await db.products.find_one({"barcode": data.barcode})
    if existing:
        raise HTTPException(status_code=400, detail="Barcode already exists")

    product = {
        "id": str(uuid.uuid4()),
        "barcode": data.barcode,
        "name": data.name,
        "price": data.price,
        "category": data.category or "General",
        "weight": data.weight,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.products.insert_one(product)
    await db.products.update_one({"id": product["id"]}, {"$unset": {"_id": ""}})
    return product


# ── DELETE ─────────────────────────────────────────────────────────────────────
@router.delete("/{product_id}")
async def delete_product(product_id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    db = get_db()
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}
