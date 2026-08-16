"""End-to-end API tests on a throwaway SQLite DB seeded from the real seeds/."""

import importlib
import os
import sys
from pathlib import Path

import pytest

API_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_DIR))


@pytest.fixture(scope="session")
def client(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("db") / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ["DEV_MODE"] = "1"

    for mod in [m for m in list(sys.modules) if m == "app" or m.startswith("app.")]:
        del sys.modules[mod]
    from app import db as app_db  # noqa: F401

    import scripts.load_seeds as loader

    importlib.reload(loader)
    loader.main()

    from app.db import SessionLocal
    from app.models import AdminUser
    from app.security import hash_password

    session = SessionLocal()
    session.add(
        AdminUser(email="admin@test", name="Test Admin", role="admin", password_hash=hash_password("pw123"), totp_secret="")
    )
    session.commit()
    session.close()

    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)


@pytest.fixture(scope="session")
def seller_token(client):
    r = client.post("/auth/otp/request", json={"phone": "9876543210"})
    assert r.status_code == 200, r.text
    code = r.json()["dev_code"]
    r = client.post("/auth/otp/verify", json={"phone": "9876543210", "code": code})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post("/auth/admin/login", json={"email": "admin@test", "password": "pw123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    assert client.get("/health").json()["ok"] is True


def test_phone_quote_matches_engine(client):
    r = client.post(
        "/quotes",
        json={
            "category": "phones",
            "model_slug": "apple-iphone-13",
            "variant_label": "128GB",
            "answers": {"display_condition": "cracked", "battery": "okay", "accessories": ["charger"]},
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "locked"
    assert body["base_price_inr"] == 24500
    assert body["final_price_inr"] == 24500 - 7350 - 1470 + 250
    assert len(body["ledger"]) == 3
    assert body["public_code"].startswith("RKM-")


def test_laptop_quote_composed_base(client):
    r = client.post(
        "/quotes",
        json={
            "category": "laptops",
            "model_slug": "lenovo-thinkpad-t14-gen-3",
            "axis_selection": {"cpu": "Core i7-1255U", "ram_gb": "32", "storage": "1TB SSD", "gpu": "Integrated"},
            "answers": {"account_lock": "yes"},
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["base_price_inr"] == 32000 + 3500 + 5000 + 3000


def test_kills_deal_declined_not_stored(client):
    r = client.post(
        "/quotes",
        json={"category": "phones", "model_slug": "apple-iphone-13", "variant_label": "128GB", "answers": {"authenticity": "clone"}},
    )
    assert r.status_code == 200
    assert r.json() == {"status": "declined"}


def test_unknown_model_404(client):
    r = client.post("/quotes", json={"category": "phones", "model_slug": "nokia-3310", "variant_label": "1GB", "answers": {}})
    assert r.status_code == 404


def test_otp_rate_limit(client):
    phone = "9000000001"
    for _ in range(3):
        assert client.post("/auth/otp/request", json={"phone": phone}).status_code == 200
    assert client.post("/auth/otp/request", json={"phone": phone}).status_code == 429


def test_otp_wrong_code_rejected(client):
    client.post("/auth/otp/request", json={"phone": "9000000002"})
    r = client.post("/auth/otp/verify", json={"phone": "9000000002", "code": "000000"})
    assert r.status_code == 401


def test_slots_zone_a_and_outside(client):
    r = client.get("/slots", params={"pincode": "500081"})
    body = r.json()
    assert body["serviceable"] is True and body["zone"] == "A" and len(body["slots"]) == 3
    assert client.get("/slots", params={"pincode": "110001"}).json()["serviceable"] is False


def test_booking_happy_path(client, seller_token):
    quote = client.post(
        "/quotes",
        json={"category": "phones", "model_slug": "apple-iphone-14", "variant_label": "128GB", "answers": {}},
    ).json()
    slots = client.get("/slots", params={"pincode": "500081"}).json()["slots"]
    r = client.post(
        "/orders",
        headers=auth(seller_token),
        json={
            "quote_code": quote["public_code"],
            "line1": "12-3-456, Road No 1",
            "pincode": "500081",
            "slot_start": slots[0]["start"],
            "slot_end": slots[0]["end"],
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "booked" and body["zone"] == "A"

    mine = client.get("/orders/mine", headers=auth(seller_token)).json()
    assert len(mine) == 1 and mine[0]["quote_code"] == quote["public_code"]

    # Converted quotes can't be booked twice.
    r = client.post(
        "/orders",
        headers=auth(seller_token),
        json={
            "quote_code": quote["public_code"],
            "line1": "x",
            "pincode": "500081",
            "slot_start": slots[0]["start"],
            "slot_end": slots[0]["end"],
        },
    )
    assert r.status_code == 409


def test_booking_requires_auth(client):
    assert client.post("/orders", json={}).status_code == 401


def test_booking_outside_zone_rejected(client, seller_token):
    quote = client.post(
        "/quotes",
        json={"category": "phones", "model_slug": "apple-iphone-15", "variant_label": "128GB", "answers": {}},
    ).json()
    r = client.post(
        "/orders",
        headers=auth(seller_token),
        json={"quote_code": quote["public_code"], "line1": "x", "pincode": "110001",
              "slot_start": "2030-01-01T10:00:00+05:30", "slot_end": "2030-01-01T11:30:00+05:30"},
    )
    assert r.status_code == 422


def test_admin_price_update_writes_audit_and_affects_quotes(client, admin_token):
    prices = client.get("/admin/prices", headers=auth(admin_token)).json()
    row = next(p for p in prices if p["model_slug"] == "apple-iphone-13" and p["label"] == "128GB")
    assert row["price_inr"] == 24500 and row["stale"] is False

    r = client.put(
        "/admin/prices",
        headers=auth(admin_token),
        json={"variant_id": row["variant_id"], "price_inr": 25000, "note": "weekly reprice"},
    )
    assert r.status_code == 200

    quote = client.post(
        "/quotes",
        json={"category": "phones", "model_slug": "apple-iphone-13", "variant_label": "128GB", "answers": {}},
    ).json()
    assert quote["base_price_inr"] == 25000

    audit = client.get("/admin/audit", headers=auth(admin_token)).json()
    entry = next(a for a in audit if a["action"] == "price.set")
    assert entry["before"] == {"price_inr": 24500} and entry["after"]["price_inr"] == 25000


def test_admin_order_queue_and_transitions(client, admin_token):
    queue = client.get("/admin/orders", headers=auth(admin_token)).json()
    assert len(queue) >= 1
    order_id = queue[0]["order_id"]
    assert client.patch(f"/admin/orders/{order_id}", headers=auth(admin_token), json={"status": "completed"}).status_code == 409
    assert client.patch(f"/admin/orders/{order_id}", headers=auth(admin_token), json={"status": "assigned"}).status_code == 200


def test_quote_override_requires_reason_and_audits(client, admin_token):
    quote = client.post(
        "/quotes",
        json={"category": "phones", "model_slug": "apple-iphone-16", "variant_label": "128GB", "answers": {}},
    ).json()
    code = quote["public_code"]
    assert client.post(f"/admin/quotes/{code}/override", headers=auth(admin_token), json={"final_price_inr": 50000, "reason": ""}).status_code == 422
    r = client.post(f"/admin/quotes/{code}/override", headers=auth(admin_token), json={"final_price_inr": 50000, "reason": "matched competitor"})
    assert r.status_code == 200
    assert client.get(f"/quotes/{code}").json()["final_price_inr"] == 50000


def test_admin_endpoints_reject_seller_token(client, seller_token):
    assert client.get("/admin/prices", headers=auth(seller_token)).status_code == 403


def test_seed_loader_idempotent(client, admin_token):
    import scripts.load_seeds as loader

    loader.changes.clear()
    loader.main()
    # Re-run applies nothing new: no duplicate brands/questions, prices untouched.
    assert not any(c.startswith(("brand +", "model +", "variant +", "question +", "option +", "zone +")) for c in loader.changes)
    prices = client.get("/admin/prices", headers=auth(admin_token)).json()
    row = next(p for p in prices if p["model_slug"] == "apple-iphone-13" and p["label"] == "128GB")
    assert row["price_inr"] == 25000  # admin price survives reseeding
