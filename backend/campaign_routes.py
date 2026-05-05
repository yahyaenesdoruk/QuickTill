from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

from auth_routes import get_current_user, get_admin_user
from database import get_db

router = APIRouter(prefix="/api/campaigns")


class CreateCampaignRequest(BaseModel):
    title: str
    description: str
    discount_type: str  # "percent" or "fixed"
    discount_value: float
    start_date: str
    end_date: str
    target_emails: List[str] = []


def _serialize(c: dict) -> dict:
    return {
        "id": c["id"],
        "title": c["title"],
        "description": c["description"],
        "discount_type": c["discount_type"],
        "discount_value": c["discount_value"],
        "start_date": c["start_date"],
        "end_date": c["end_date"],
        "target_emails": c.get("target_emails", []),
        "is_active": c.get("is_active", True),
        "created_at": (
            c["created_at"].isoformat()
            if isinstance(c.get("created_at"), datetime)
            else c.get("created_at", "")
        ),
    }


@router.get("")
async def list_campaigns(current_user=Depends(get_current_user)):
    db = get_db()
    if current_user["role"] == "admin":
        docs = await db.campaigns.find().sort("created_at", -1).to_list(200)
    else:
        docs = await db.campaigns.find(
            {
                "$or": [
                    {"target_emails": []},
                    {"target_emails": current_user["email"].lower()},
                ],
                "is_active": True,
            }
        ).sort("created_at", -1).to_list(200)
    return [_serialize(c) for c in docs]


@router.post("")
async def create_campaign(
    req: CreateCampaignRequest, current_user=Depends(get_admin_user)
):
    if req.discount_type not in ("percent", "fixed"):
        raise HTTPException(
            status_code=400, detail="discount_type 'percent' veya 'fixed' olmalı"
        )
    if req.discount_value <= 0:
        raise HTTPException(
            status_code=400, detail="İndirim değeri pozitif olmalı"
        )

    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "title": req.title.strip(),
        "description": req.description.strip(),
        "discount_type": req.discount_type,
        "discount_value": req.discount_value,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "target_emails": [e.lower() for e in req.target_emails],
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    await db.campaigns.insert_one(doc)
    return _serialize(doc)


@router.put("/{campaign_id}/toggle")
async def toggle_campaign(
    campaign_id: str, current_user=Depends(get_admin_user)
):
    db = get_db()
    c = await db.campaigns.find_one({"id": campaign_id})
    if not c:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    new_status = not c.get("is_active", True)
    await db.campaigns.update_one(
        {"id": campaign_id}, {"$set": {"is_active": new_status}}
    )
    return {"is_active": new_status}


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str, current_user=Depends(get_admin_user)
):
    db = get_db()
    result = await db.campaigns.delete_one({"id": campaign_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    return {"message": "Kampanya silindi"}
