from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Address, Order, Quote, Seller, Variant
from ..security import current_seller
from ..slots import slot_windows, zone_for_pincode

router = APIRouter(tags=["orders"])


class BookingCreate(BaseModel):
    quote_code: str
    line1: str
    line2: str = ""
    pincode: str
    slot_start: datetime
    slot_end: datetime


@router.get("/slots")
def get_slots(pincode: str, db: Session = Depends(get_db)):
    if len(pincode) != 6 or not pincode.isdigit():
        raise HTTPException(422, "Enter a 6-digit pincode")
    zone = zone_for_pincode(db, pincode)
    if not zone:
        # Graceful outside-GHMC path (CLAUDE.md §7): capture interest, no booking.
        return {"serviceable": False}
    return {
        "serviceable": True,
        "zone": zone.code,
        "zone_name": zone.name,
        "sla_label": zone.sla_label,
        "slots": slot_windows(zone.code),
    }


@router.post("/orders")
def book_pickup(body: BookingCreate, seller: Seller = Depends(current_seller), db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.public_code == body.quote_code).first()
    if not quote:
        raise HTTPException(404, "Quote not found")
    locked_until = quote.locked_until if quote.locked_until.tzinfo else quote.locked_until.replace(tzinfo=timezone.utc)
    if quote.status != "locked" or locked_until < datetime.now(timezone.utc):
        raise HTTPException(409, "Quote is no longer locked — get a fresh price")
    if quote.seller_id not in (None, seller.id):
        raise HTTPException(403, "Quote belongs to another seller")

    zone = zone_for_pincode(db, body.pincode)
    if not zone:
        raise HTTPException(422, "Not in our pickup area yet")

    address = Address(
        seller_id=seller.id, line1=body.line1.strip(), line2=body.line2.strip(),
        pincode=body.pincode, zone=zone.code,
    )
    db.add(address)
    db.flush()

    quote.seller_id = seller.id
    quote.status = "converted"
    order = Order(
        quote_id=quote.id,
        seller_id=seller.id,
        address_id=address.id,
        zone=zone.code,
        slot_start=body.slot_start,
        slot_end=body.slot_end,
        status="booked",
    )
    db.add(order)
    db.commit()
    return {
        "order_id": order.id,
        "status": order.status,
        "zone": zone.code,
        "sla_label": zone.sla_label,
        "slot_start": order.slot_start.isoformat(),
        "slot_end": order.slot_end.isoformat(),
        "amount_inr": quote.final_price,
    }


@router.get("/orders/mine")
def my_orders(seller: Seller = Depends(current_seller), db: Session = Depends(get_db)):
    rows = (
        db.query(Order, Quote, Variant)
        .join(Quote, Order.quote_id == Quote.id)
        .join(Variant, Quote.variant_id == Variant.id)
        .filter(Order.seller_id == seller.id)
        .order_by(Order.id.desc())
        .all()
    )
    return [
        {
            "order_id": order.id,
            "status": order.status,
            "quote_code": quote.public_code,
            "amount_inr": quote.final_price,
            "slot_start": order.slot_start.isoformat(),
            "slot_end": order.slot_end.isoformat(),
        }
        for order, quote, variant in rows
    ]
