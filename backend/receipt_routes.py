from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import uuid

from auth_routes import get_current_user
from database import get_db

router = APIRouter(prefix="/api/receipts")


# ── Request / Response models ─────────────────────────────────────────────────

class ReceiptItemModel(BaseModel):
    name: str
    quantity: int
    unitPrice: float
    subtotal: float
    weight: Optional[float] = None


class SaveReceiptRequest(BaseModel):
    receiptId: str
    date: str
    time: str
    items: List[ReceiptItemModel]
    total: float
    itemCount: int
    paymentMethod: str   # 'NFC' | 'Simulated' | 'Pi'


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("")
async def save_receipt(
    req: SaveReceiptRequest,
    current_user=Depends(get_current_user),
):
    db = get_db()
    receipt_id = str(uuid.uuid4())
    doc = {
        "id": receipt_id,
        "user_id": current_user["id"],
        "receiptId": req.receiptId,
        "date": req.date,
        "time": req.time,
        "items": [i.dict() for i in req.items],
        "total": req.total,
        "itemCount": req.itemCount,
        "paymentMethod": req.paymentMethod,
        "created_at": datetime.utcnow(),
    }
    await db.receipts.insert_one(doc)
    return {"id": receipt_id, "message": "Fiş kaydedildi"}


@router.get("")
async def get_receipts(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.receipts.find(
        {"user_id": current_user["id"]},
        {"_id": 0},
    ).sort("created_at", -1)
    receipts = await cursor.to_list(length=200)
    return receipts


@router.delete("/{receipt_id}")
async def delete_receipt(
    receipt_id: str,
    current_user=Depends(get_current_user),
):
    db = get_db()
    result = await db.receipts.delete_one(
        {"id": receipt_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fiş bulunamadı")
    return {"message": "Fiş silindi"}
