"""DB → engine-shaped data: deduction matrix per category and base-price resolution."""

from sqlalchemy import desc
from sqlalchemy.orm import Session

from .models import BasePrice, ConditionQuestion, Model, Variant

COMPOSED_BASE_LABEL = "__base__"


def matrix_for(db: Session, category: str) -> dict:
    questions = (
        db.query(ConditionQuestion)
        .filter(ConditionQuestion.category == category)
        .order_by(ConditionQuestion.sort)
        .all()
    )
    return {
        "sections": [
            {
                "id": q.section,
                "questions": [
                    {
                        "id": q.qkey,
                        "type": q.type,
                        "options": [
                            {
                                "id": o.okey,
                                "label_en": o.label_en,
                                "kills_deal": o.kills_deal,
                                "deduction": (
                                    {"type": o.deduction_type, "value": o.deduction_value}
                                    if o.deduction_type is not None
                                    else None
                                ),
                            }
                            for o in sorted(q.options, key=lambda o: o.sort)
                        ],
                    }
                ],
            }
            for q in questions
        ]
    }


def current_price(db: Session, variant_id: int) -> BasePrice | None:
    return (
        db.query(BasePrice)
        .filter(BasePrice.variant_id == variant_id)
        .order_by(desc(BasePrice.effective_from), desc(BasePrice.id))
        .first()
    )


def resolve_base_price(
    db: Session, model: Model, variant_label: str | None, axis_selection: dict[str, str] | None
) -> tuple[Variant, int] | None:
    """Fixed: the variant's current price. Composed: __base__ price + axis modifiers."""
    if model.variant_mode == "fixed":
        variant = next((v for v in model.variants if v.label == variant_label and v.active), None)
        if not variant:
            return None
        price = current_price(db, variant.id)
        return (variant, price.price_inr) if price else None

    variant = next((v for v in model.variants if v.label == COMPOSED_BASE_LABEL), None)
    if not variant:
        return None
    price = current_price(db, variant.id)
    if not price:
        return None
    total = price.price_inr
    for axis_row in model.axes:
        if (axis_selection or {}).get(axis_row.axis) == axis_row.label and axis_row.modifier_inr is not None:
            total += axis_row.modifier_inr
    return (variant, total)
