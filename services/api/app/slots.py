"""Zone → pickup slot windows (CLAUDE.md §7 zone SLAs).

Working hours 10:00–20:00 IST. Zone A gets 90-minute windows starting soon;
Zone B same-day 2-hour windows (spilling to next morning late in the day);
Zone C next-day windows. Redis slot-capacity locks come with the ops phase —
v1 offers times without capacity limits.
"""

from datetime import datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from .models import Zone

IST = timezone(timedelta(hours=5, minutes=30))
DAY_START = time(10, 0)
DAY_END = time(20, 0)


def zone_for_pincode(db: Session, pincode: str) -> Zone | None:
    zones = db.query(Zone).filter(Zone.active).all()
    for zone in zones:
        if pincode in (zone.active_pincodes or []):
            return zone
    for zone in zones:
        if any(pincode.startswith(p) for p in (zone.pincode_prefixes or [])):
            return zone
    return None


def _round_up_half_hour(dt: datetime) -> datetime:
    minutes = (30 - dt.minute % 30) % 30
    return (dt + timedelta(minutes=minutes or 30)).replace(second=0, microsecond=0)


def slot_windows(zone_code: str, now: datetime | None = None, count: int = 3) -> list[dict]:
    now = (now or datetime.now(IST)).astimezone(IST)
    window = timedelta(minutes=90 if zone_code == "A" else 120)
    if zone_code == "A":
        first = _round_up_half_hour(now + timedelta(minutes=60))
    elif zone_code == "B":
        first = _round_up_half_hour(now + timedelta(hours=3))
    else:
        first = datetime.combine(now.date() + timedelta(days=1), DAY_START, IST)

    slots: list[dict] = []
    cursor = max(first, datetime.combine(first.date(), DAY_START, IST))
    while len(slots) < count:
        end = cursor + window
        if end.time() > DAY_END or end.date() > cursor.date():
            cursor = datetime.combine(cursor.date() + timedelta(days=1), DAY_START, IST)
            continue
        slots.append({"start": cursor.isoformat(), "end": end.isoformat()})
        cursor = end
    return slots
