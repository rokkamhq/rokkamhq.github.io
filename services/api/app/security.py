import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from . import config
from .db import get_db
from .models import AdminUser, Seller

PBKDF2_ITERATIONS = 600_000


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(hash_password(password, salt), stored)


def hash_otp(phone: str, code: str) -> str:
    return hashlib.sha256(f"{phone}:{code}:{config.JWT_SECRET}".encode()).hexdigest()


def make_token(subject: str, role: str) -> str:
    payload = {
        "sub": subject,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.JWT_TTL_HOURS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def _decode(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    try:
        return jwt.decode(auth[7:], config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")


def current_seller(request: Request, db: Session = Depends(get_db)) -> Seller:
    payload = _decode(request)
    if payload.get("role") != "seller":
        raise HTTPException(403, "Seller token required")
    seller = db.get(Seller, int(payload["sub"]))
    if not seller:
        raise HTTPException(401, "Unknown seller")
    return seller


def admin_with_roles(*roles: str):
    def dep(request: Request, db: Session = Depends(get_db)) -> AdminUser:
        payload = _decode(request)
        if payload.get("role") not in roles:
            raise HTTPException(403, f"Requires role: {', '.join(roles)}")
        user = db.get(AdminUser, int(payload["sub"]))
        if not user or not user.active:
            raise HTTPException(401, "Unknown or inactive admin user")
        return user

    return dep
