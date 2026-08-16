"""Rokkam pricing engine (CLAUDE.md §6).

final = base_price - Σ deductions + Σ bonuses, floored at max(base × 5%, ₹300).
Bonuses are stored as negative deduction values (sign convention shared with the
seed files and the TypeScript mirror in apps/web/src/lib/quote.ts — keep both in
sync; the seed JSON files are the single source of rule data).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

SCRAP_FLOOR_PCT = 0.05
SCRAP_FLOOR_MIN_INR = 300


@dataclass(frozen=True)
class LedgerLine:
    question_id: str
    option_id: str
    label: str
    amount_inr: int  # signed: negative = deduction, positive = bonus


@dataclass(frozen=True)
class QuoteResult:
    status: str  # "ok" | "declined"
    base_price_inr: int
    ledger: tuple[LedgerLine, ...] = field(default_factory=tuple)
    final_price_inr: int = 0
    floored_at: int | None = None


def _round_half_up(x: float) -> int:
    # Match JS Math.round (half away from zero for positives); Python's round()
    # is banker's rounding and would drift from the web ledger by ₹1.
    return int(x + 0.5)


def scrap_floor(base_inr: int) -> int:
    return max(_round_half_up(base_inr * SCRAP_FLOOR_PCT), SCRAP_FLOOR_MIN_INR)


def _amount_for(base_inr: int, dtype: str, value: float) -> int:
    magnitude = _round_half_up(base_inr * abs(value) / 100) if dtype == "pct" else _round_half_up(abs(value))
    return -magnitude if value > 0 else magnitude


def compute_quote(matrix: dict[str, Any], base_inr: int, answers: dict[str, Any]) -> QuoteResult:
    """Pure quote computation over a deduction matrix (seeds/pricing/*_deductions.json shape)."""
    ledger: list[LedgerLine] = []

    for section in matrix["sections"]:
        for question in section["questions"]:
            answer = answers.get(question["id"])
            if answer is None:
                continue
            chosen = answer if isinstance(answer, list) else [answer]
            for option_id in chosen:
                option = next((o for o in question["options"] if o["id"] == option_id), None)
                if option is None:
                    continue
                if option.get("kills_deal"):
                    return QuoteResult(status="declined", base_price_inr=base_inr)
                deduction = option.get("deduction")
                if deduction:
                    ledger.append(
                        LedgerLine(
                            question_id=question["id"],
                            option_id=option["id"],
                            label=option["label_en"],
                            amount_inr=_amount_for(base_inr, deduction["type"], deduction["value"]),
                        )
                    )

    raw = base_inr + sum(line.amount_inr for line in ledger)
    floor = scrap_floor(base_inr)
    floored = raw < floor
    return QuoteResult(
        status="ok",
        base_price_inr=base_inr,
        ledger=tuple(ledger),
        final_price_inr=floor if floored else raw,
        floored_at=floor if floored else None,
    )


def composed_base(entry: dict[str, Any], selection: dict[str, str]) -> int:
    """Composed-mode (laptop) base: base_config buyback + selected axis modifiers."""
    total = int(entry["base"])
    for axis, options in entry["axes"].items():
        chosen = selection.get(axis)
        if chosen is not None and chosen in options:
            total += int(options[chosen])
    return total
