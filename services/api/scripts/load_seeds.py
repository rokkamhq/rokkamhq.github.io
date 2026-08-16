"""Idempotent seed loader (SEED_SCHEMA.md): upserts on slug, never deletes,
logs diffs to audit_log. Loads catalog seeds, demo base prices (only for
variants with no price yet — admin prices are never clobbered), deduction
matrices and zones.

Usage (from services/api):  python scripts/load_seeds.py [--dry-run]
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import config  # noqa: E402
from app.audit import write_audit  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    BasePrice,
    Brand,
    ConditionOption,
    ConditionQuestion,
    Model,
    Variant,
    VariantAxis,
    Zone,
)
from app.pricing_data import COMPOSED_BASE_LABEL, current_price  # noqa: E402

DRY_RUN = "--dry-run" in sys.argv
ACTOR = "load_seeds"
changes: list[str] = []


def note(msg: str):
    changes.append(msg)
    print(("[dry-run] " if DRY_RUN else "") + msg)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def upsert_catalog(db, seed_path: Path):
    seed = read_json(seed_path)
    category = seed["category"]
    b = seed["brand"]
    brand = db.query(Brand).filter(Brand.slug == b["slug"], Brand.category == category).first()
    if not brand:
        brand = Brand(name=b["name"], slug=b["slug"], category=category, sort=b.get("sort", 0), active=b.get("active", True))
        db.add(brand)
        db.flush()
        note(f"brand + {category}/{b['slug']}")
        write_audit(db, ACTOR, "seed.brand.create", "brand", brand.id, after={"slug": b["slug"], "category": category})

    for m in seed["models"]:
        model = db.query(Model).filter(Model.slug == m["slug"]).first()
        fields = {
            "brand_id": brand.id,
            "name": m["name"],
            "launch_year": m["launch_year"],
            "series": m.get("series", ""),
            "aliases": m.get("aliases", []),
            "image_url": m.get("image_ref", ""),
            "variant_mode": m.get("variant_mode", "fixed"),
            "base_config_desc": (m.get("base_config") or {}).get("description", ""),
        }
        if not model:
            model = Model(slug=m["slug"], **fields)
            db.add(model)
            db.flush()
            note(f"model + {m['slug']}")
            write_audit(db, ACTOR, "seed.model.create", "model", model.id, after={"slug": m["slug"]})
        else:
            for key, value in fields.items():
                setattr(model, key, value)

        if model.variant_mode == "fixed":
            for v in m.get("variants", []):
                variant = db.query(Variant).filter(Variant.model_id == model.id, Variant.label == v["label"]).first()
                if not variant:
                    db.add(Variant(model_id=model.id, label=v["label"], attrs_json=v.get("attrs", {})))
                    note(f"variant + {m['slug']} {v['label']}")
        else:
            base_variant = db.query(Variant).filter(Variant.model_id == model.id, Variant.label == COMPOSED_BASE_LABEL).first()
            if not base_variant:
                db.add(Variant(model_id=model.id, label=COMPOSED_BASE_LABEL, attrs_json={}))
                note(f"variant + {m['slug']} {COMPOSED_BASE_LABEL}")
            for axis, options in (m.get("variant_axes") or {}).items():
                for sort, opt in enumerate(options):
                    row = (
                        db.query(VariantAxis)
                        .filter(VariantAxis.model_id == model.id, VariantAxis.axis == axis, VariantAxis.label == opt["label"])
                        .first()
                    )
                    if not row:
                        db.add(
                            VariantAxis(
                                model_id=model.id, axis=axis, label=opt["label"],
                                modifier_inr=opt.get("modifier_inr"),
                                is_base=opt.get("modifier_inr") == 0, sort=sort,
                            )
                        )
                        note(f"axis + {m['slug']} {axis}/{opt['label']}")


def load_phone_prices(db, path: Path):
    data = read_json(path)
    for model_slug, variants in data["prices"].items():
        model = db.query(Model).filter(Model.slug == model_slug).first()
        if not model:
            note(f"WARN price for unknown model {model_slug}")
            continue
        for label, price in variants.items():
            variant = db.query(Variant).filter(Variant.model_id == model.id, Variant.label == label).first()
            if not variant:
                note(f"WARN price for unknown variant {model_slug}/{label}")
                continue
            if current_price(db, variant.id) is None:
                db.add(BasePrice(variant_id=variant.id, price_inr=price, set_by=data.get("set_by", "seed")))
                write_audit(db, ACTOR, "seed.price.set", "variant", variant.id, after={"price_inr": price})
                note(f"price + {model_slug}/{label} = {price}")


def load_laptop_prices(db, path: Path):
    data = read_json(path)
    for model_slug, entry in data["prices"].items():
        model = db.query(Model).filter(Model.slug == model_slug).first()
        if not model:
            note(f"WARN price for unknown model {model_slug}")
            continue
        variant = db.query(Variant).filter(Variant.model_id == model.id, Variant.label == COMPOSED_BASE_LABEL).first()
        if variant and current_price(db, variant.id) is None:
            db.add(BasePrice(variant_id=variant.id, price_inr=entry["base"], set_by=data.get("set_by", "seed")))
            write_audit(db, ACTOR, "seed.price.set", "variant", variant.id, after={"price_inr": entry["base"]})
            note(f"price + {model_slug}/base = {entry['base']}")
        for axis, options in entry["axes"].items():
            for label, modifier in options.items():
                row = (
                    db.query(VariantAxis)
                    .filter(VariantAxis.model_id == model.id, VariantAxis.axis == axis, VariantAxis.label == label)
                    .first()
                )
                if row and row.modifier_inr is None:
                    row.modifier_inr = modifier
                    row.is_base = modifier == 0
                    note(f"modifier + {model_slug} {axis}/{label} = {modifier}")


def load_matrix(db, path: Path, category: str):
    matrix = read_json(path)
    for section_sort, section in enumerate(matrix["sections"]):
        for q_sort, q in enumerate(section["questions"]):
            question = (
                db.query(ConditionQuestion)
                .filter(ConditionQuestion.category == category, ConditionQuestion.qkey == q["id"])
                .first()
            )
            if not question:
                question = ConditionQuestion(
                    category=category, section=section["id"], section_title_en=section.get("title_en", ""),
                    qkey=q["id"], question_text_en=q["text_en"], type=q["type"],
                    sort=section_sort * 100 + q_sort,
                )
                db.add(question)
                db.flush()
                note(f"question + {category}/{q['id']}")
            for o_sort, o in enumerate(q["options"]):
                option = (
                    db.query(ConditionOption)
                    .filter(ConditionOption.question_id == question.id, ConditionOption.okey == o["id"])
                    .first()
                )
                if not option:
                    deduction = o.get("deduction") or {}
                    db.add(
                        ConditionOption(
                            question_id=question.id, okey=o["id"], label_en=o["label_en"],
                            deduction_type=deduction.get("type"), deduction_value=deduction.get("value"),
                            kills_deal=o.get("kills_deal", False), note_en=o.get("note_en", ""), sort=o_sort,
                        )
                    )
                    note(f"option + {category}/{q['id']}/{o['id']}")


def load_zones(db, path: Path):
    data = read_json(path)
    for z in data["zones"]:
        zone = db.query(Zone).filter(Zone.code == z["id"]).first()
        if not zone:
            db.add(
                Zone(
                    code=z["id"], name=z["name"], sla_label=z["sla_label"], sla_minutes=z["sla_minutes"],
                    active_pincodes=z.get("pincodes", []), pincode_prefixes=z.get("pincode_prefixes", []),
                )
            )
            note(f"zone + {z['id']}")


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seeds = config.SEEDS_DIR
        for path in sorted((seeds / "phones").glob("*.seed.json")) + sorted((seeds / "laptops").glob("*.seed.json")):
            upsert_catalog(db, path)
        load_phone_prices(db, seeds / "pricing" / "demo_base_prices.phone.json")
        load_laptop_prices(db, seeds / "pricing" / "demo_base_prices.laptop.json")
        load_matrix(db, seeds / "pricing" / "phone_deductions.json", "phone")
        load_matrix(db, seeds / "pricing" / "laptop_deductions.json", "laptop")
        load_zones(db, seeds / "zones.json")
        if DRY_RUN:
            db.rollback()
            print(f"dry-run: {len(changes)} change(s) would be applied")
        else:
            db.commit()
            print(f"done: {len(changes)} change(s) applied")
    finally:
        db.close()


if __name__ == "__main__":
    main()
