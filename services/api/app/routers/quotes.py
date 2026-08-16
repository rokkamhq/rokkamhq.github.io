import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from rokkam_pricing import compute_quote
from sqlalchemy.orm import Session

from .. import config
from ..db import get_db
from ..models import Brand, Model, Quote
from ..pricing_data import matrix_for, resolve_base_price

router = APIRouter(prefix="/quotes", tags=["quotes"])

CATEGORY_MAP = {"phones": "phone", "laptops": "laptop"}
CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


class QuoteCreate(BaseModel):
    category: str  # "phones" | "laptops" (web route slugs)
    model_slug: str
    variant_label: str | None = None
    axis_selection: dict[str, str] | None = None
    answers: dict
    channel: str = "web"


def _public_code() -> str:
    return "RKM-" + "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))


@router.post("")
def create_quote(body: QuoteCreate, db: Session = Depends(get_db)):
    category = CATEGORY_MAP.get(body.category)
    if not category:
        raise HTTPException(422, "Unknown category")
    model = (
        db.query(Model)
        .join(Brand)
        .filter(Model.slug == body.model_slug, Brand.category == category, Model.active)
        .first()
    )
    if not model:
        raise HTTPException(404, "Unknown model")

    resolved = resolve_base_price(db, model, body.variant_label, body.axis_selection)
    if not resolved:
        raise HTTPException(409, "No price set for this configuration yet")
    variant, base_price = resolved

    result = compute_quote(matrix_for(db, category), base_price, body.answers)
    if result.status == "declined":
        return {"status": "declined"}

    quote = Quote(
        public_code=_public_code(),
        variant_id=variant.id,
        answers_json={"axes": body.axis_selection or {}, "answers": body.answers},
        base_price=base_price,
        deductions_json=[
            {
                "question": line.question_id,
                "option": line.option_id,
                "label": line.label,
                "amount_inr": line.amount_inr,
            }
            for line in result.ledger
        ],
        final_price=result.final_price_inr,
        status="locked",
        locked_until=datetime.now(timezone.utc) + timedelta(days=config.QUOTE_LOCK_DAYS),
        channel=body.channel,
    )
    db.add(quote)
    db.commit()
    return {
        "status": "locked",
        "public_code": quote.public_code,
        "base_price_inr": base_price,
        "final_price_inr": quote.final_price,
        "floored_at": result.floored_at,
        "ledger": quote.deductions_json,
        "locked_until": quote.locked_until.isoformat(),
    }


@router.get("/{public_code}")
def get_quote(public_code: str, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.public_code == public_code).first()
    if not quote:
        raise HTTPException(404, "Quote not found")
    return {
        "public_code": quote.public_code,
        "status": quote.status,
        "base_price_inr": quote.base_price,
        "final_price_inr": quote.final_price,
        "ledger": quote.deductions_json,
        "locked_until": quote.locked_until.isoformat(),
    }
