# ROKKAM SEED SCHEMA v1.0

One JSON file per brand per category: `seeds/{category}/{brand-slug}.seed.json`.
Categories: `phone`, `laptop`, `camera`. Loader: `services/api/scripts/load_seeds.py`
(idempotent upsert on slug; never deletes; logs diffs to audit_log).

## Two variant modes

**`fixed`** (phones, cameras): every sellable configuration is enumerated. Phones =
RAM/storage combos. Cameras = body-only vs kit.

**`composed`** (laptops): configs are combinatorial (CPU × RAM × storage × GPU), so
enumerating is hopeless. The seller picks the model, then the questionnaire asks the
axes. Price = model `base_config_price` + axis modifiers. The quote engine resolves
`composed` models by summing modifier values from `variant_axes`.

## Top-level shape

```json
{
  "schema_version": "1.0",
  "category": "phone | laptop | camera",
  "brand": { "name": "", "slug": "", "sort": 0, "active": true },
  "models": [ ... ]
}
```

## Model object

| Field | Type | Notes |
|---|---|---|
| `name` | str | Display name, no brand prefix ("iPhone 13", not "Apple iPhone 13") |
| `slug` | str | Unique per category. `{brand}-{model}` kebab-case |
| `launch_year` | int | Drives depreciation curve + catalog cutoff (>= current_year − 7) |
| `series` | str | Grouping for picker UI ("Galaxy S", "ThinkPad", "EOS R") |
| `discontinued` | bool | Informational only; does not gate buyback |
| `aliases` | [str] | Regional/board names, model numbers (A2633, 21H1...) — feeds search |
| `image_ref` | str | `press:{path}` (manufacturer press asset) or `own:{path}` (house photo). Never aggregator URLs |
| `variant_mode` | str | `fixed` or `composed` |
| `variants` | [obj] | Required when `fixed` |
| `base_config` + `variant_axes` | obj | Required when `composed` |
| `notes` | str? | Ops notes (e.g., "eSIM-only US units — check region") |

## Fixed variant object (phones, cameras)

```json
{ "label": "8GB/256GB", "attrs": { "ram_gb": 8, "storage_gb": 256 },
  "launch_price_inr": 79999, "base_price_inr": null }
```

- Camera attrs: `{ "kit": "body" }` or `{ "kit": "18-55mm" }`.
- `launch_price_inr`: historical India launch price (public data) — anchors the
  depreciation curve. Fill where known, else null.
- `base_price_inr`: **always null in seeds.** Buyback prices are set in the
  `base_prices` table via the admin pricing pass, never hardcoded in seeds.

## Composed config (laptops)

```json
"base_config": {
  "description": "i5-1135G7 / 8GB / 512GB SSD / integrated",
  "launch_price_inr": 62999
},
"variant_axes": {
  "cpu":     [ { "label": "Core i5 (11th gen)", "modifier_inr": 0 },
               { "label": "Core i7 (11th gen)", "modifier_inr": null } ],
  "ram_gb":  [ { "label": "8",  "modifier_inr": 0 },
               { "label": "16", "modifier_inr": null } ],
  "storage": [ { "label": "512GB SSD", "modifier_inr": 0 },
               { "label": "1TB SSD",   "modifier_inr": null } ],
  "gpu":     [ { "label": "Integrated", "modifier_inr": 0 },
               { "label": "MX450 2GB",  "modifier_inr": null } ]
}
```

- Exactly one option per axis carries `modifier_inr: 0` — that's the base config.
- Modifiers are null in seeds (priced in admin alongside base prices).
- Serial/service-tag capture happens in the order flow, not the catalog.

## Category-specific condition sections (registered in condition_questions, not seeds)

- **phone:** power, display, touch, body, camera, battery health, biometrics,
  speaker/mic, network/SIM, water damage, accessories, bill/warranty.
- **laptop:** power/boot, display, keyboard/trackpad, body/hinge, battery cycle
  health, ports, storage health (SMART), OS license, charger included, bill/warranty.
- **camera:** power, shutter count tier (<10k / 10–50k / 50–100k / >100k), sensor
  (dust/scratches/fungus), LCD/EVF, body, lens condition (if kit: fungus/haze/AF),
  battery+charger included, box/strap, bill/warranty.

## Generation rules (Claude CLI sessions)

1. One brand per session. Cutoff: launch_year >= 2019 (phones), >= 2018 (laptops,
   cameras — slower depreciation).
2. India-market models only (skip Japan/China exclusives unless common grey imports —
   flag those in `notes`).
3. Verify every model/variant list against GSMArena (phones) or manufacturer spec
   archives (laptops/cameras) manually before marking the file `"verified": true`.
4. Launch prices: India launch MRP where confidently known; null otherwise. Never guess.
5. Run `load_seeds.py --dry-run` and review the diff before committing.
