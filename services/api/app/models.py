"""Core tables per CLAUDE.md §5 — extended (never renamed) where the spec's
sketch needed operational columns (qkey/okey for stable rule ids, zone code,
admin_users for RBAC, otp_codes for phone auth)."""

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Brand(Base):
    __tablename__ = "brands"
    __table_args__ = (UniqueConstraint("slug", "category"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(80), index=True)
    category: Mapped[str] = mapped_column(String(20), index=True)  # phone|laptop|camera
    sort: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    models: Mapped[list["Model"]] = relationship(back_populates="brand")


class Model(Base):
    __tablename__ = "models"
    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    launch_year: Mapped[int] = mapped_column(Integer)
    series: Mapped[str] = mapped_column(String(80), default="")
    aliases: Mapped[list] = mapped_column(JSON, default=list)
    image_url: Mapped[str] = mapped_column(String(300), default="")
    variant_mode: Mapped[str] = mapped_column(String(10), default="fixed")  # fixed|composed
    base_config_desc: Mapped[str] = mapped_column(String(300), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    brand: Mapped[Brand] = relationship(back_populates="models")
    variants: Mapped[list["Variant"]] = relationship(back_populates="model")
    axes: Mapped[list["VariantAxis"]] = relationship(back_populates="model")


class Variant(Base):
    __tablename__ = "variants"
    __table_args__ = (UniqueConstraint("model_id", "label"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"), index=True)
    label: Mapped[str] = mapped_column(String(80))  # "__base__" for composed models
    attrs_json: Mapped[dict] = mapped_column(JSON, default=dict)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    model: Mapped[Model] = relationship(back_populates="variants")


class VariantAxis(Base):
    __tablename__ = "variant_axes"
    __table_args__ = (UniqueConstraint("model_id", "axis", "label"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"), index=True)
    axis: Mapped[str] = mapped_column(String(40))
    label: Mapped[str] = mapped_column(String(80))
    modifier_inr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_base: Mapped[bool] = mapped_column(Boolean, default=False)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    model: Mapped[Model] = relationship(back_populates="axes")


class BasePrice(Base):
    __tablename__ = "base_prices"
    id: Mapped[int] = mapped_column(primary_key=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"), index=True)
    price_inr: Mapped[int] = mapped_column(Integer)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    set_by: Mapped[str] = mapped_column(String(80), default="")
    note: Mapped[str] = mapped_column(String(300), default="")


class ConditionQuestion(Base):
    __tablename__ = "condition_questions"
    __table_args__ = (UniqueConstraint("category", "qkey"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(20), index=True)
    section: Mapped[str] = mapped_column(String(80))
    section_title_en: Mapped[str] = mapped_column(String(120), default="")
    qkey: Mapped[str] = mapped_column(String(60))
    question_text_en: Mapped[str] = mapped_column(Text)
    question_text_te: Mapped[str] = mapped_column(Text, default="")
    question_text_ur: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(10), default="single")  # single|multi
    sort: Mapped[int] = mapped_column(Integer, default=0)
    options: Mapped[list["ConditionOption"]] = relationship(back_populates="question")


class ConditionOption(Base):
    __tablename__ = "condition_options"
    __table_args__ = (UniqueConstraint("question_id", "okey"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("condition_questions.id"), index=True)
    okey: Mapped[str] = mapped_column(String(60))
    label_en: Mapped[str] = mapped_column(Text)
    label_te: Mapped[str] = mapped_column(Text, default="")
    label_ur: Mapped[str] = mapped_column(Text, default="")
    deduction_type: Mapped[str | None] = mapped_column(String(10), nullable=True)  # flat|pct
    deduction_value: Mapped[float | None] = mapped_column(Integer, nullable=True)
    kills_deal: Mapped[bool] = mapped_column(Boolean, default=False)
    note_en: Mapped[str] = mapped_column(Text, default="")
    sort: Mapped[int] = mapped_column(Integer, default=0)
    question: Mapped[ConditionQuestion] = relationship(back_populates="options")


class Seller(Base):
    __tablename__ = "sellers"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    kyc_status: Mapped[str] = mapped_column(String(20), default="none")
    kyc_doc_ref: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Address(Base):
    __tablename__ = "addresses"
    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("sellers.id"), index=True)
    line1: Mapped[str] = mapped_column(String(200))
    line2: Mapped[str] = mapped_column(String(200), default="")
    pincode: Mapped[str] = mapped_column(String(6))
    lat: Mapped[float | None] = mapped_column(nullable=True)
    lng: Mapped[float | None] = mapped_column(nullable=True)
    zone: Mapped[str] = mapped_column(String(5), default="")


class Zone(Base):
    __tablename__ = "zones"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(5), unique=True)  # A|B|C
    name: Mapped[str] = mapped_column(String(40))
    sla_label: Mapped[str] = mapped_column(String(80), default="")
    sla_minutes: Mapped[int] = mapped_column(Integer)
    active_pincodes: Mapped[list] = mapped_column(JSON, default=list)
    pincode_prefixes: Mapped[list] = mapped_column(JSON, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Quote(Base):
    __tablename__ = "quotes"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("variants.id"))
    answers_json: Mapped[dict] = mapped_column(JSON, default=dict)  # {"axes": {...}, "answers": {...}}
    base_price: Mapped[int] = mapped_column(Integer)
    deductions_json: Mapped[list] = mapped_column(JSON, default=list)  # full itemized ledger
    final_price: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(12), default="locked")  # draft|locked|expired|converted
    locked_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    seller_id: Mapped[int | None] = mapped_column(ForeignKey("sellers.id"), nullable=True)
    channel: Mapped[str] = mapped_column(String(10), default="web")  # web|wa|kiosk
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int] = mapped_column(ForeignKey("quotes.id"), unique=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("sellers.id"), index=True)
    address_id: Mapped[int] = mapped_column(ForeignKey("addresses.id"))
    zone: Mapped[str] = mapped_column(String(5))
    slot_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    slot_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="booked", index=True)
    agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verified_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    deviation_reason: Mapped[str] = mapped_column(String(300), default="")
    payout_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


ORDER_TRANSITIONS: dict[str, set[str]] = {
    "booked": {"assigned", "cancelled"},
    "assigned": {"enroute", "cancelled"},
    "enroute": {"verifying", "failed"},
    "verifying": {"deviation_pending", "completed", "failed"},
    "deviation_pending": {"completed", "failed"},
    "completed": set(),
    "cancelled": set(),
    "failed": set(),
}


class Payout(Base):
    __tablename__ = "payouts"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    amount: Mapped[int] = mapped_column(Integer)
    method: Mapped[str] = mapped_column(String(20), default="upi")
    razorpayx_ref: Mapped[str] = mapped_column(String(80), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[str] = mapped_column(String(80))
    action: Mapped[str] = mapped_column(String(60), index=True)
    entity: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[str] = mapped_column(String(60))
    before_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(15), index=True)
    code_hash: Mapped[str] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    consumed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AdminUser(Base):
    __tablename__ = "admin_users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(256))
    totp_secret: Mapped[str] = mapped_column(String(64), default="")
    role: Mapped[str] = mapped_column(String(20), default="admin")  # admin|pricing|ops|agent|refurb|b2b
    active: Mapped[bool] = mapped_column(Boolean, default=True)
