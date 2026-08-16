import re
import secrets
from datetime import datetime, timedelta, timezone

import pyotp
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import config
from ..db import get_db
from ..models import AdminUser, OtpCode, Seller
from ..security import hash_otp, make_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

PHONE_RE = re.compile(r"^[6-9]\d{9}$")


class OtpRequest(BaseModel):
    phone: str


class OtpVerify(BaseModel):
    phone: str
    code: str


class AdminLogin(BaseModel):
    email: str
    password: str
    totp_code: str = ""


def _now():
    return datetime.now(timezone.utc)


@router.post("/otp/request")
def request_otp(body: OtpRequest, db: Session = Depends(get_db)):
    phone = body.phone.strip()
    if not PHONE_RE.match(phone):
        raise HTTPException(422, "Enter a 10-digit Indian mobile number")

    window_start = _now() - timedelta(minutes=config.OTP_WINDOW_MINUTES)
    recent = (
        db.query(OtpCode).filter(OtpCode.phone == phone, OtpCode.created_at >= window_start).count()
    )
    if recent >= config.OTP_MAX_PER_WINDOW:
        raise HTTPException(429, "Too many OTP requests — try again in a few minutes")

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        OtpCode(
            phone=phone,
            code_hash=hash_otp(phone, code),
            expires_at=_now() + timedelta(minutes=config.OTP_TTL_MINUTES),
        )
    )
    db.commit()

    # SMS provider (MSG91) lands with the ops phase; dev mode hands the code back.
    response = {"sent": True, "ttl_minutes": config.OTP_TTL_MINUTES}
    if config.DEV_MODE:
        response["dev_code"] = code
    return response


@router.post("/otp/verify")
def verify_otp(body: OtpVerify, db: Session = Depends(get_db)):
    phone = body.phone.strip()
    row = (
        db.query(OtpCode)
        .filter(OtpCode.phone == phone, OtpCode.consumed.is_(False))
        .order_by(OtpCode.id.desc())
        .first()
    )
    expires_at = row.expires_at.replace(tzinfo=timezone.utc) if row and row.expires_at.tzinfo is None else (row.expires_at if row else None)
    if not row or expires_at < _now() or row.code_hash != hash_otp(phone, body.code.strip()):
        raise HTTPException(401, "Wrong or expired code")
    row.consumed = True

    seller = db.query(Seller).filter(Seller.phone == phone).first()
    if not seller:
        seller = Seller(phone=phone)
        db.add(seller)
        db.flush()
    db.commit()
    return {"token": make_token(str(seller.id), "seller"), "seller_id": seller.id, "phone": phone}


@router.post("/admin/login")
def admin_login(body: AdminLogin, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.email == body.email.strip().lower()).first()
    if not user or not user.active or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    if user.totp_secret:
        if not body.totp_code or not pyotp.TOTP(user.totp_secret).verify(body.totp_code, valid_window=1):
            raise HTTPException(401, "Invalid TOTP code")
    return {"token": make_token(str(user.id), user.role), "role": user.role, "name": user.name}
