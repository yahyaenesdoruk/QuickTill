from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from auth_routes import get_current_user
from database import get_db

router = APIRouter(prefix="/api/recipes")


class RecipeIngredient(BaseModel):
    name: str
    amount: str


class RecipeStep(BaseModel):
    order: int
    description: str


class CreateRecipeRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    ingredients: List[RecipeIngredient]
    steps: List[RecipeStep]
    category: Optional[str] = "Genel"
    prep_time: Optional[int] = None
    servings: Optional[int] = None


class AddCommentRequest(BaseModel):
    text: str


def _serialize(r: dict) -> dict:
    return {
        "id": r["id"],
        "title": r["title"],
        "description": r.get("description", ""),
        "ingredients": r["ingredients"],
        "steps": r["steps"],
        "category": r.get("category", "Genel"),
        "prep_time": r.get("prep_time"),
        "servings": r.get("servings"),
        "author_id": r["author_id"],
        "author_name": r["author_name"],
        "author_username": r["author_username"],
        "comments": r.get("comments", []),
        "comment_count": len(r.get("comments", [])),
        "created_at": (
            r["created_at"].isoformat()
            if isinstance(r.get("created_at"), datetime)
            else r.get("created_at", "")
        ),
    }


@router.get("")
async def list_recipes(search: str = "", category: str = ""):
    db = get_db()
    query: dict = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"ingredients.name": {"$regex": search, "$options": "i"}},
        ]
    if category and category not in ("Tümü", ""):
        query["category"] = category

    recipes = await db.recipes.find(query).sort("created_at", -1).to_list(200)
    return [_serialize(r) for r in recipes]


@router.post("")
async def create_recipe(
    req: CreateRecipeRequest, current_user=Depends(get_current_user)
):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Başlık boş olamaz")
    if not req.ingredients:
        raise HTTPException(status_code=400, detail="En az bir malzeme ekleyin")
    if not req.steps:
        raise HTTPException(status_code=400, detail="En az bir adım ekleyin")

    db = get_db()
    recipe_id = str(uuid.uuid4())
    doc = {
        "id": recipe_id,
        "title": req.title.strip(),
        "description": (req.description or "").strip(),
        "ingredients": [i.dict() for i in req.ingredients],
        "steps": sorted([s.dict() for s in req.steps], key=lambda x: x["order"]),
        "category": req.category or "Genel",
        "prep_time": req.prep_time,
        "servings": req.servings,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "author_username": current_user["username"],
        "comments": [],
        "created_at": datetime.utcnow(),
    }
    await db.recipes.insert_one(doc)
    return _serialize(doc)


@router.get("/{recipe_id}")
async def get_recipe(recipe_id: str):
    db = get_db()
    r = await db.recipes.find_one({"id": recipe_id})
    if not r:
        raise HTTPException(status_code=404, detail="Tarif bulunamadı")
    return _serialize(r)


@router.delete("/{recipe_id}")
async def delete_recipe(recipe_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    r = await db.recipes.find_one({"id": recipe_id})
    if not r:
        raise HTTPException(status_code=404, detail="Tarif bulunamadı")
    if r["author_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu tarifi silemezsiniz")
    await db.recipes.delete_one({"id": recipe_id})
    return {"message": "Tarif silindi"}


@router.post("/{recipe_id}/comments")
async def add_comment(
    recipe_id: str,
    req: AddCommentRequest,
    current_user=Depends(get_current_user),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Yorum boş olamaz")

    db = get_db()
    comment = {
        "id": str(uuid.uuid4()),
        "text": req.text.strip(),
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "author_username": current_user["username"],
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.recipes.update_one(
        {"id": recipe_id}, {"$push": {"comments": comment}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarif bulunamadı")
    return comment


@router.delete("/{recipe_id}/comments/{comment_id}")
async def delete_comment(
    recipe_id: str,
    comment_id: str,
    current_user=Depends(get_current_user),
):
    db = get_db()
    r = await db.recipes.find_one({"id": recipe_id})
    if not r:
        raise HTTPException(status_code=404, detail="Tarif bulunamadı")

    comment = next(
        (c for c in r.get("comments", []) if c["id"] == comment_id), None
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    if (
        comment["author_id"] != current_user["id"]
        and current_user.get("role") != "admin"
    ):
        raise HTTPException(status_code=403, detail="Bu yorumu silemezsiniz")

    await db.recipes.update_one(
        {"id": recipe_id}, {"$pull": {"comments": {"id": comment_id}}}
    )
    return {"message": "Yorum silindi"}
