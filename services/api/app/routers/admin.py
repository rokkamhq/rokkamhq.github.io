from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import config
from ..audit import write_audit
from ..db import get_db
from ..models import (
    ORDER_TRANSITIONS,
    AdminUser,
    AuditLog,
    BasePrice,
    Brand,
    ConditionOption,
    ConditionQuestion,
    Model,
    Order,
    Quote,
    Variant,
)
from ..pricing_data import current_price
from ..security import admin_with_roles

router = APIRouter(prefix="/admin", tags=["admin"])

pricing_roles = admin_with_roles("admin", "pricing")
ops_roles = admin_with_roles("admin", "ops")
any_admin = admin_with_roles("admin", "pricing", "ops")


class PriceUpdate(BaseModel):
    variant_id: int
    price_inr: int
    note: str = ""


class DeductionUpdate(BaseModel):
    option_id: int
    deduction_type: str | None = None  # flat|pct|null
    deduction_value: float | None = None
    kills_deal: bool | None = None


class OrderStatusUpdate(BaseModel):
    status: str
    reason: str = ""


class QuoteOverride(BaseModel):
    final_price_inr: int
    reason: str


@router.get("/prices")
def price_matrix(user: AdminUser = Depends(any_admin), db: Session = Depends(get_db)):
    stale_cutoff = datetime.now(timezone.utc) - timedelta(days=config.PRICE_STALE_DAYS)
    rows = (
        db.query(Variant, Model, Brand)
        .join(Model, Variant.model_id == Model.id)
        .join(Brand, Model.brand_id == Brand.id)
        .filter(Variant.active, Model.active)
        .order_by(Brand.category, Brand.sort, Model.slug, Variant.id)
        .all()
    )
    out = []
    for variant, model, brand in rows:
        price = current_price(db, variant.id)
        effective = None
        if price:
            effective = price.effective_from if price.effective_from.tzinfo else price.effective_from.replace(tzinfo=timezone.utc)
        out.append(
            {
                "variant_id": variant.id,
                "category": brand.category,
                "brand": brand.name,
                "model": model.name,
                "model_slug": model.slug,
                "label": variant.label,
                "price_inr": price.price_inr if price else None,
                "effective_from": effective.isoformat() if effective else None,
                "set_by": price.set_by if price else None,
                "stale": (effective < stale_cutoff) if effective else True,
            }
        )
    return out


@router.put("/prices")
def set_price(body: PriceUpdate, user: AdminUser = Depends(pricing_roles), db: Session = Depends(get_db)):
    variant = db.get(Variant, body.variant_id)
    if not variant:
        raise HTTPException(404, "Unknown variant")
    if body.price_inr <= 0:
        raise HTTPException(422, "Price must be positive")
    old = current_price(db, variant.id)
    db.add(BasePrice(variant_id=variant.id, price_inr=body.price_inr, set_by=user.email, note=body.note))
    write_audit(
        db, user.email, "price.set", "variant", variant.id,
        before={"price_inr": old.price_inr if old else None},
        after={"price_inr": body.price_inr, "note": body.note},
    )
    db.commit()
    return {"ok": True, "variant_id": variant.id, "price_inr": body.price_inr}


@router.get("/deductions")
def deduction_rules(category: str, user: AdminUser = Depends(any_admin), db: Session = Depends(get_db)):
    questions = (
        db.query(ConditionQuestion)
        .filter(ConditionQuestion.category == category)
        .order_by(ConditionQuestion.sort)
        .all()
    )
    return [
        {
            "question_id": q.id,
            "qkey": q.qkey,
            "section": q.section_title_en or q.section,
            "text": q.question_text_en,
            "type": q.type,
            "options": [
                {
                    "option_id": o.id,
                    "okey": o.okey,
                    "label": o.label_en,
                    "deduction_type": o.deduction_type,
                    "deduction_value": o.deduction_value,
                    "kills_deal": o.kills_deal,
                }
                for o in sorted(q.options, key=lambda o: o.sort)
            ],
        }
        for q in questions
    ]


@router.put("/deductions")
def set_deduction(body: DeductionUpdate, user: AdminUser = Depends(pricing_roles), db: Session = Depends(get_db)):
    option = db.get(ConditionOption, body.option_id)
    if not option:
        raise HTTPException(404, "Unknown option")
    if body.deduction_type not in (None, "flat", "pct"):
        raise HTTPException(422, "deduction_type must be flat, pct or null")
    before = {
        "deduction_type": option.deduction_type,
        "deduction_value": option.deduction_value,
        "kills_deal": option.kills_deal,
    }
    option.deduction_type = body.deduction_type
    option.deduction_value = body.deduction_value if body.deduction_type else None
    if body.kills_deal is not None:
        option.kills_deal = body.kills_deal
    write_audit(
        db, user.email, "deduction.set", "condition_option", option.id,
        before=before,
        after={
            "deduction_type": option.deduction_type,
            "deduction_value": option.deduction_value,
            "kills_deal": option.kills_deal,
        },
    )
    db.commit()
    return {"ok": True, "option_id": option.id}


@router.get("/orders")
def order_queue(status: str | None = None, user: AdminUser = Depends(any_admin), db: Session = Depends(get_db)):
    query = (
        db.query(Order, Quote, Variant, Model, Brand)
        .join(Quote, Order.quote_id == Quote.id)
        .join(Variant, Quote.variant_id == Variant.id)
        .join(Model, Variant.model_id == Model.id)
        .join(Brand, Model.brand_id == Brand.id)
        .order_by(Order.id.desc())
    )
    if status:
        query = query.filter(Order.status == status)
    return [
        {
            "order_id": order.id,
            "status": order.status,
            "zone": order.zone,
            "quote_code": quote.public_code,
            "device": f"{brand.name} {model.name}" + ("" if variant.label == "__base__" else f" · {variant.label}"),
            "amount_inr": quote.final_price,
            "slot_start": order.slot_start.isoformat(),
            "slot_end": order.slot_end.isoformat(),
            "created_at": order.created_at.isoformat(),
        }
        for order, quote, variant, model, brand in query.limit(200).all()
    ]


@router.patch("/orders/{order_id}")
def transition_order(order_id: int, body: OrderStatusUpdate, user: AdminUser = Depends(ops_roles), db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Unknown order")
    allowed = ORDER_TRANSITIONS.get(order.status, set())
    if body.status not in allowed:
        raise HTTPException(409, f"Cannot go {order.status} → {body.status}; allowed: {sorted(allowed)}")
    before = {"status": order.status}
    order.status = body.status
    if body.reason:
        order.deviation_reason = body.reason
    write_audit(db, user.email, "order.status", "order", order.id, before=before, after={"status": body.status, "reason": body.reason})
    db.commit()
    return {"ok": True, "order_id": order.id, "status": order.status}


@router.post("/quotes/{public_code}/override")
def override_quote(public_code: str, body: QuoteOverride, user: AdminUser = Depends(pricing_roles), db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.public_code == public_code).first()
    if not quote:
        raise HTTPException(404, "Quote not found")
    if not body.reason.strip():
        raise HTTPException(422, "Override requires a reason")
    if body.final_price_inr <= 0:
        raise HTTPException(422, "Price must be positive")
    before = {"final_price": quote.final_price}
    quote.final_price = body.final_price_inr
    write_audit(
        db, user.email, "quote.override", "quote", quote.public_code,
        before=before, after={"final_price": body.final_price_inr, "reason": body.reason},
    )
    db.commit()
    return {"ok": True, "public_code": quote.public_code, "final_price_inr": quote.final_price}


@router.get("/audit")
def audit_trail(limit: int = 100, user: AdminUser = Depends(any_admin), db: Session = Depends(get_db)):
    rows = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(min(limit, 500)).all()
    return [
        {
            "id": r.id,
            "actor": r.actor_id,
            "action": r.action,
            "entity": f"{r.entity}:{r.entity_id}",
            "before": r.before_json,
            "after": r.after_json,
            "ts": r.ts.isoformat(),
        }
        for r in rows
    ]
