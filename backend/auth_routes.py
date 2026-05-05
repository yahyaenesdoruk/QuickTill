from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import uuid

from email_service import generate_otp, send_otp_email
from database import get_db

router = APIRouter(prefix="/api/auth")
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ.get("JWT_SECRET", "quicktill-dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30


def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Geçersiz token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

    db = get_db()
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    return user


async def get_admin_user(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403, detail="Bu işlem için admin yetkisi gerekli"
        )
    return current_user


# ── Request models ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    username: str
    password: str


class OTPRequest(BaseModel):
    email: str
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateNameRequest(BaseModel):
    name: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(req: RegisterRequest):
    db = get_db()
    if await db.users.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    if await db.users.find_one({"username": req.username.strip().lower()}):
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")

    otp = generate_otp()
    await db.pending_registrations.replace_one(
        {"email": req.email},
        {
            "email": req.email,
            "name": req.name.strip(),
            "username": req.username.strip().lower(),
            "password_hash": hash_password(req.password),
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
        },
        upsert=True,
    )
    await send_otp_email(req.email, otp, "Kayıt")
    return {"message": "Doğrulama kodu e-posta adresinize gönderildi"}


@router.post("/verify-register")
async def verify_register(req: OTPRequest):
    db = get_db()
    pending = await db.pending_registrations.find_one({"email": req.email})
    if not pending:
        raise HTTPException(
            status_code=400, detail="Kayıt talebi bulunamadı. Tekrar kayıt olun."
        )
    if pending["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Doğrulama kodu yanlış")
    if datetime.utcnow() > pending["expires_at"]:
        raise HTTPException(status_code=400, detail="Kodun süresi dolmuş")

    admin_email = os.environ.get("ADMIN_EMAIL", "")
    role = "admin" if req.email.lower() == admin_email.lower() and admin_email else "user"

    user_id = str(uuid.uuid4())
    await db.users.insert_one(
        {
            "id": user_id,
            "email": pending["email"],
            "name": pending["name"],
            "username": pending["username"],
            "password_hash": pending["password_hash"],
            "role": role,
            "created_at": datetime.utcnow(),
        }
    )
    await db.pending_registrations.delete_one({"email": req.email})

    token = create_token(user_id, role)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": pending["email"],
            "name": pending["name"],
            "username": pending["username"],
            "role": role,
        },
    }


@router.post("/login")
async def login(req: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")

    otp = generate_otp()
    await db.login_otps.replace_one(
        {"email": req.email},
        {
            "email": req.email,
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
        },
        upsert=True,
    )
    await send_otp_email(req.email, otp, "Giriş")
    return {"message": "Doğrulama kodu e-posta adresinize gönderildi"}


@router.post("/verify-login")
async def verify_login(req: OTPRequest):
    db = get_db()
    record = await db.login_otps.find_one({"email": req.email})
    if not record or record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Doğrulama kodu yanlış")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Kodun süresi dolmuş")

    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    await db.login_otps.delete_one({"email": req.email})
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "username": user["username"],
            "role": user["role"],
        },
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email})
    if user:
        otp = generate_otp()
        await db.password_reset_otps.replace_one(
            {"email": req.email},
            {
                "email": req.email,
                "otp": otp,
                "expires_at": datetime.utcnow() + timedelta(minutes=10),
            },
            upsert=True,
        )
        await send_otp_email(req.email, otp, "Şifre Sıfırlama")
    return {"message": "Eğer bu e-posta kayıtlıysa doğrulama kodu gönderildi"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    db = get_db()
    record = await db.password_reset_otps.find_one({"email": req.email})
    if not record or record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Doğrulama kodu yanlış")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Kodun süresi dolmuş")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")

    await db.users.update_one(
        {"email": req.email},
        {"$set": {"password_hash": hash_password(req.new_password)}},
    )
    await db.password_reset_otps.delete_one({"email": req.email})
    return {"message": "Şifre başarıyla değiştirildi"}


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "username": current_user["username"],
        "role": current_user["role"],
    }


@router.put("/profile")
async def update_profile(
    req: UpdateNameRequest, current_user=Depends(get_current_user)
):
    db = get_db()
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="İsim boş olamaz")
    await db.users.update_one(
        {"id": current_user["id"]}, {"$set": {"name": req.name.strip()}}
    )
    return {"message": "İsim güncellendi", "name": req.name.strip()}


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest, current_user=Depends(get_current_user)
):
    db = get_db()
    if not verify_password(req.old_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=400, detail="Yeni şifre en az 6 karakter olmalı"
        )
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": hash_password(req.new_password)}},
    )
    return {"message": "Şifre başarıyla değiştirildi"}
