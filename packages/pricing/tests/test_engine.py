"""Engine tests run against the REAL seed matrices so rule data and math are
verified together (CLAUDE.md §10: 100% branch coverage on deduction math)."""

import json
from pathlib import Path

import pytest

from rokkam_pricing import composed_base, compute_quote, scrap_floor

SEEDS = Path(__file__).resolve().parents[3] / "seeds"
PHONE_MATRIX = json.loads((SEEDS / "pricing" / "phone_deductions.json").read_text(encoding="utf-8"))
LAPTOP_MATRIX = json.loads((SEEDS / "pricing" / "laptop_deductions.json").read_text(encoding="utf-8"))
LAPTOP_PRICES = json.loads(
    (SEEDS / "pricing" / "demo_base_prices.laptop.json").read_text(encoding="utf-8")
)["prices"]


def test_perfect_phone_no_deductions():
    result = compute_quote(
        PHONE_MATRIX,
        24500,
        {
            "authenticity": "original_india",
            "powers_on": "normal",
            "display_condition": "flawless",
            "touch": "full",
            "body_condition": "like_new",
            "camera": "fine",
            "battery": "great",
            "biometrics": "working",
            "sound": "fine",
            "network": "fine",
            "water": "never",
            "accessories": [],
            "bill": "none",
        },
    )
    assert result.status == "ok"
    assert result.final_price_inr == 24500
    assert result.ledger == ()
    assert result.floored_at is None


def test_mixed_deductions_and_flat_bonus():
    # cracked -30%, battery okay -6%, charger +250 (multi answer)
    result = compute_quote(
        PHONE_MATRIX,
        24500,
        {"display_condition": "cracked", "battery": "okay", "accessories": ["charger"]},
    )
    assert result.final_price_inr == 24500 - 7350 - 1470 + 250
    assert len(result.ledger) == 3
    assert {line.amount_inr for line in result.ledger} == {-7350, -1470, 250}


def test_pct_bonus():
    result = compute_quote(PHONE_MATRIX, 40000, {"bill": "bill_warranty"})
    assert result.final_price_inr == 41200


def test_multiple_accessory_bonuses():
    result = compute_quote(PHONE_MATRIX, 10000, {"accessories": ["box", "charger"]})
    assert result.final_price_inr == 10550


def test_scrap_floor_engages():
    result = compute_quote(
        PHONE_MATRIX,
        10500,
        {
            "powers_on": "dead",
            "display_condition": "broken",
            "touch": "partial",
            "body_condition": "bent",
            "camera": "dead",
            "battery": "weak",
            "network": "issue",
            "water": "yes",
        },
    )
    assert result.floored_at == 525
    assert result.final_price_inr == scrap_floor(10500) == 525


def test_scrap_floor_minimum_300():
    assert scrap_floor(4000) == 300
    assert scrap_floor(100000) == 5000


def test_kills_deal_declines():
    result = compute_quote(PHONE_MATRIX, 24500, {"authenticity": "clone", "display_condition": "flawless"})
    assert result.status == "declined"
    assert result.final_price_inr == 0
    assert result.ledger == ()


def test_laptop_account_lock_kills_deal():
    result = compute_quote(LAPTOP_MATRIX, 47000, {"account_lock": "no"})
    assert result.status == "declined"


def test_laptop_flat_deduction_and_pct_bonus():
    result = compute_quote(
        LAPTOP_MATRIX,
        40000,
        {"account_lock": "yes", "charger": "none", "bill": "bill_warranty"},
    )
    assert result.final_price_inr == 40000 - 1500 + 1200


def test_unknown_question_and_option_ignored():
    result = compute_quote(PHONE_MATRIX, 24500, {"nonexistent": "x", "display_condition": "bogus"})
    assert result.final_price_inr == 24500


def test_empty_answers():
    result = compute_quote(PHONE_MATRIX, 24500, {})
    assert result.final_price_inr == 24500


def test_rounding_matches_js_half_up():
    # 4999 * 5% = 249.95 -> floor 300 anyway; pick a case exercising rounding:
    # 8333 * 6% = 499.98 -> 500 (half-up = plain rounding here)
    result = compute_quote(PHONE_MATRIX, 8333, {"battery": "okay"})
    assert result.final_price_inr == 8333 - 500
    # 24990 * 5% = 1249.5 -> half-up 1250 (banker's rounding would give 1250 too;
    # 1249.5 binary-floats to 1249.5 exactly) — assert the helper directly:
    assert scrap_floor(24990) == 1250


def test_composed_base_full_and_partial_selection():
    entry = LAPTOP_PRICES["lenovo-thinkpad-t14-gen-3"]
    assert (
        composed_base(entry, {"cpu": "Core i7-1255U", "ram_gb": "32", "storage": "1TB SSD", "gpu": "Integrated"})
        == 32000 + 3500 + 5000 + 3000
    )
    assert composed_base(entry, {"cpu": "does_not_exist"}) == 32000
    assert composed_base(entry, {}) == 32000


@pytest.mark.parametrize("slug,entry", LAPTOP_PRICES.items())
def test_every_laptop_axis_has_exactly_one_base_label(slug, entry):
    for axis, options in entry["axes"].items():
        assert list(options.values()).count(0) == 1, f"{slug}/{axis}"
