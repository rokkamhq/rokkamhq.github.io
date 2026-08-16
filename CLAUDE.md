# ROKKAM_CLAUDE.md — Hyderabad Re-Commerce Platform (Cashify/Cashkr Class, Hyperlocal)

> Claude CLI governance file. Read fully before any session. This file is the single
> source of truth for scope, architecture, brand, and build order. Do not invent
> features outside this spec without flagging them as PROPOSAL blocks.

---

## 0. IDENTITY

- **Working name:** Rokkam (రొక్కం — "cash" in Telugu). Domain targets: rokkam.in / rokkam.co.in. Fallback names: PhoneDabbu, DeccanCash.
- **Operator:** Client venture, built and maintained by SK Creatives / apnisite.in (premium tier engagement).
- **One-liner:** Sell your phone in Hyderabad. 60-minute pickup. Certified data wipe. Cash before the agent leaves.
- **Geography:** Hyderabad + Secunderabad (GHMC limits) ONLY. No pan-India logic anywhere. Pincode-gate everything.
- **Category:** Device buyback → refurbish → resale (re-commerce), plus B2B fleet buyback.

## 1. WHY WE WIN (design every feature against these)

| Pillar | Cashify/Cashkr weakness | Rokkam counter |
|---|---|---|
| Speed | 24–48h pickup slots | Zone A: 60–90 min. Zone B: same-day. Zone C: next-day. |
| Trust at door | Agents re-quote/slash price at pickup (their #1 complaint) | Locked Quote Guarantee: itemized deductions shown BEFORE commit; quote honored if device matches declared condition. Agent app enforces this. |
| Data security | Nothing credible | NIST 800-88 wipe on every device + signed, QR-verifiable Data Destruction Certificate (PDF). B2B procurement-grade. |
| Legitimacy | Opaque | CEIR/IMEI blacklist screening pre-purchase, seller KYC, GST margin-scheme compliant invoicing. |
| Language | EN + HI | EN + Telugu + Urdu (Old City market untouched by competitors). |
| Channel | Website/app-first | WhatsApp-first quote bot; website is the credibility layer. |

## 2. BRAND & DESIGN SYSTEM

- **Tone:** Fast, local, straight-talking. No corporate fluff. Copy in plain verbs: "Get price", "Book pickup", "Paid in 60 seconds."
- **Palette (draft — refine in design session):**
  - `--ink: #101418` (near-black, body text / dark surfaces)
  - `--rokkam-green: #0E8F5B` (money/UPI-success green, primary CTA)
  - `--charminar-sand: #E8DCC8` (warm neutral background)
  - `--deccan-slate: #3B4754` (secondary text, borders)
  - `--alert-amber: #E0A400` (deductions, warnings)
- **Type:** Display: a characterful geometric/vernacular-friendly face with full Telugu + Urdu (Nastaliq or naskh fallback) coverage — candidates: Anek Telugu (display), Noto Sans Telugu + Noto Nastaliq Urdu (locale bodies), Inter (EN body/UI), JetBrains Mono (IMEI, quote IDs, certificates).
- **Signature element:** the **live deduction ledger** — as the seller answers condition questions, a running receipt animates each rupee deduction line-by-line. This is the trust product made visible. Reuse it on the certificate and agent app.
- **Do NOT** clone Cashify's UI. Study flows, not pixels. No copied copy, icons, or imagery.

## 3. SCOPE — PHASE MAP

### Phase 1 — SELL FLOW MVP (weeks 1–3)
- Public site (Next.js, Cloudflare Pages): landing, category → brand → model → variant picker, condition questionnaire, live quote with deduction ledger, pickup slot booking, OTP login (phone).
- Pricing engine v1 (see §6).
- Admin dashboard v1: price matrix CRUD, deduction rules CRUD, order queue, manual quote override with audit log.
- WhatsApp deep link ("Get quote on WhatsApp") — manual handling initially.
- Categories at launch: smartphones only. (Laptops + cameras = Phase 3; tablets, smartwatches = Phase 4.)
- Catalog seeded from `seeds/` files per SEED_SCHEMA.md — build all three category
  schemas (phone/laptop/camera) into the DB and quote engine from day one, even
  though only phones are seller-visible at launch.

### Phase 2 — OPS & PAYMENTS (weeks 4–6)
- Flutter agent app: assigned pickups, on-site verification checklist mirroring the questionnaire, photo capture, IMEI scan, quote confirm/deviation flow (deviation REQUIRES photo evidence + seller re-consent in-app), RazorpayX instant UPI payout trigger, digital receipt.
- CEIR IMEI verification step (API if access granted; manual portal check workflow otherwise — build the workflow UI regardless).
- KYC: seller name + phone OTP + one govt ID capture; DigiLocker integration later.
- Data wipe station workflow + Data Destruction Certificate generator (PDF, Ed25519-signed payload, QR verify page at /verify/{cert_id}).
- Zone/SLA engine: pincode → zone → slot availability.

### Phase 3 — RESALE, B2B & CATEGORY EXPANSION (weeks 7–10)
- Enable laptops (composed variant mode: seller picks model, questionnaire asks
  CPU/RAM/storage/GPU axes; price = base_config + axis modifiers) and cameras
  (fixed mode: body/kit variants; shutter-count tier, sensor fungus, lens condition
  in questionnaire; agent app gets EXIF shutter-count check step).
- Laptop pickup checklist additions: BIOS/supervisor password check, activation
  lock (Windows/Apple), SMART storage health, battery cycle count.
- Refurb inventory module: grading (A/B/C), cost ledger per device, repair tracking.
- Resale storefront: refurbished listings with warranty (3/6 months), Razorpay checkout, GST margin-scheme invoices.
- B2B portal: fleet buyback quotes (CSV upload of models/counts), bulk certificates, contract pricing.
- WhatsApp Business API bot: full quote flow in chat (EN/TE/UR).

### Phase 4 — GROWTH (ongoing)
- Category expansion (laptops next — B2B pull is strongest here).
- Mall kiosk mode (tablet UI, assisted flow).
- Referral program, price-alert subscriptions.

**Out of scope (do not build, do not suggest):** pan-India shipping, marketplace for third-party sellers, EMI/lending products, crypto payments.

## 4. ARCHITECTURE

- **Frontend:** Next.js (App Router) on Cloudflare Pages. Tailwind. i18n: next-intl with `en`, `te`, `ur` (RTL support for `ur` — test every screen).
- **Backend:** FastAPI (Python 3.12), PostgreSQL 16. SQLAlchemy 2 + Alembic. Redis for slot locks + quote-lock TTLs.
- **Agent app:** Flutter (Android-first; agents get company devices).
- **Payments:** Razorpay (resale checkout), RazorpayX (payouts to sellers — UPI/IMPS). Webhook-driven state transitions only; never trust client-side payment status.
- **Comms:** WhatsApp Business Cloud API, MSG91 or similar for OTP SMS fallback.
- **Certificates:** Python (reportlab/weasyprint) PDF; payload JSON signed Ed25519; public verify endpoint.
- **Hosting:** Frontend on Cloudflare; API + Postgres on a Mumbai-region VPS (data residency, latency). Nightly encrypted backups.
- **Auth:** Phone OTP for sellers; email+TOTP for admin/agents; RBAC roles: `admin`, `pricing`, `ops`, `agent`, `refurb`, `b2b`.

## 5. DATA MODEL (core tables — extend, don't rename)

```
brands(id, name, slug, category, active)
models(id, brand_id, name, slug, launch_year, image_url, active)
models(+ variant_mode[fixed|composed], series, aliases[])
variants(id, model_id, label, attrs_json, active)          -- fixed mode (phones/cameras)
variant_axes(id, model_id, axis, label, modifier_inr, is_base, sort)  -- composed mode (laptops)
base_prices(id, variant_id, price_inr, effective_from, set_by, note)
condition_questions(id, category, section, question_text_en/te/ur, type[bool|single|multi], sort)
condition_options(id, question_id, label_en/te/ur, deduction_type[flat|pct], deduction_value, kills_deal bool)
quotes(id, public_code, variant_id, answers_json, base_price, deductions_json,
       final_price, status[draft|locked|expired|converted], locked_until, seller_id, channel[web|wa|kiosk])
orders(id, quote_id, seller_id, address_id, zone, slot_start, slot_end,
       status[booked|assigned|enroute|verifying|deviation_pending|completed|cancelled|failed],
       agent_id, verified_price, deviation_reason, payout_id)
sellers(id, phone, name, kyc_status, kyc_doc_ref, created_at)
addresses(id, seller_id, line1, line2, pincode, lat, lng, zone)
zones(id, name, sla_minutes, active_pincodes[])
devices(id, order_id, imei, ceir_status[clear|flagged|unchecked], grade,
        wipe_status, cert_id, refurb_cost_ledger_json, resale_status)
certificates(id, device_id, payload_json, signature, issued_at, revoked)
payouts(id, order_id, amount, method, razorpayx_ref, status)
listings(id, device_id, price_inr, warranty_months, status, sold_order_ref)
audit_log(id, actor_id, action, entity, entity_id, before_json, after_json, ts)
```

Rules:
- Every price-affecting change writes to `audit_log`. No exceptions.
- `quotes.locked_until` = 7 days. Cron expires stale quotes.
- A quote's `deductions_json` stores the FULL itemized ledger (question, answer, rupee impact) — this feeds the UI receipt, the agent checklist, and dispute resolution.
- `kills_deal` options (e.g., IMEI tampered, fake device) hard-stop the flow with a polite decline screen.

## 6. PRICING ENGINE

- `final = base_price(variant) − Σ deductions`, floor at `max(base*0.05, ₹300)` scrap value.
- Deduction sections (smartphone v1): Power/boot, Display (spots/lines/crack tiers), Touch, Body (dents/bends tiers), Camera, Battery health tier, Face/fingerprint sensor, Speaker/mic, Network/SIM, Water damage flag (heavy pct), Accessories (charger/box = additive bonuses, model as negative deduction), Warranty/bill remaining (bonus), GST bill available (B2B bonus).
- Admin sets base prices weekly; build a "price staleness" report (variants not repriced in 14 days flagged).
- Margin guardrail: admin config `min_margin_pct` per grade; resale listing form warns if listing price violates it against the device cost ledger.
- Locked Quote Guarantee logic: agent app can only (a) confirm at locked price, or (b) open a deviation with photo evidence mapped to specific questionnaire answers the seller got wrong. Deviation re-quote is computed by the SAME engine — agents never type a price.

## 7. OPS FLOWS

**Seller happy path:** Pick device → answer questions (deduction ledger animates) → final price + lock timer → OTP login → address (pincode-gated) → slot → confirmation (web + WhatsApp) → agent arrives → IMEI scan + checklist → CEIR check → payout fired → seller sees UPI credit before agent leaves → device to hub → wipe station → certificate issued → grade → refurb/resale.

**Deviation path:** checklist mismatch → agent photographs → app shows seller the specific mismatched answer + new engine price → seller accepts (re-consent tap) or declines (order closed `failed`, no charge, no hostility — copy matters here).

**Zones (v1 draft — client to confirm):**
- Zone A (60–90 min): Hitec City, Gachibowli, Madhapur, Kondapur, Jubilee Hills, Banjara Hills.
- Zone B (same-day): Kukatpally, Miyapur, Secunderabad, Begumpet, Ameerpet, Dilsukhnagar, LB Nagar.
- Zone C (next-day): remaining GHMC pincodes.
- Outside GHMC: graceful "not yet in your area" + phone capture for expansion list.

## 8. COMPLIANCE & SECURITY (non-negotiable)

- CEIR/IMEI blacklist screening before payout. Flagged device = no purchase, log retained, do NOT tip off the seller with accusatory copy ("We're unable to complete this purchase").
- Purchase register maintained (local police second-hand dealer requirements — client to confirm Telangana specifics with counsel; build the register/export regardless).
- KYC record per transaction; retention policy documented; DPDPA-aligned: consent screens, data minimization, deletion workflow, privacy policy pages in all 3 languages.
- GST margin scheme (Rule 32(5)) on resale invoices — invoice generator must support it.
- Wipe station: NIST 800-88 Clear/Purge per device type; certificate payload includes IMEI, method, timestamp, operator ID, hash; Ed25519 signature; public verification page.
- Standard hardening: OTP rate limits, payout idempotency keys, webhook signature verification, RBAC, audit log immutability (append-only), no PII in logs.

## 9. FILE STRUCTURE

```
rokkam/
  CLAUDE.md            <- this file
  apps/
    web/               <- Next.js (seller site + resale store + verify pages)
    admin/             <- Next.js admin dashboard
    agent/             <- Flutter agent app
  services/
    api/               <- FastAPI monolith (modular routers: catalog, quotes, orders,
                          payouts, devices, certs, b2b, wa)
  packages/
    pricing/           <- pure-python pricing engine (unit-tested in isolation)
    certgen/           <- PDF + signing
  seeds/
    SEED_SCHEMA.md     <- catalog seed format (source of truth for generation sessions)
    phones/{brand}.seed.json
    laptops/{brand}.seed.json
    cameras/{brand}.seed.json
  infra/               <- docker-compose, Caddy, backup scripts, migrations
  docs/
    PRICING_RULES.md   <- human-readable deduction matrix (mirror of DB seed)
    ZONES.md
    COMPLIANCE.md
    RUNBOOK.md
```

## 10. SESSION PROTOCOL (Claude CLI)

- Sonnet for CRUD/UI scaffolding; Opus for pricing engine, payout state machine, cert signing, and anything touching money.
- Every session: read this file → state which phase/section you're executing → list files you'll touch → build → update `docs/` if behavior changed.
- Pricing engine and payout flows require unit tests BEFORE integration. Target: pricing package 100% branch coverage on deduction math.
- Never hardcode prices, zones, or deduction values — everything from DB/seed files.
- All seller-facing copy written in EN first, marked with i18n keys; TE/UR translation pass is a dedicated task, not inline guesswork.
- PROPOSAL blocks: any feature idea outside this spec goes in `docs/PROPOSALS.md`, never into code.

## 11. MILESTONE CHECKLIST

- [x] M1: Catalog + questionnaire + quote engine + deduction ledger UI (demo-able) — live at https://rokkamhq.github.io
- [x] M2: Booking + OTP + admin price matrix + order queue — local stack (API/admin); goes public with the Mumbai VPS
- [ ] M3: Agent app verification + deviation flow + RazorpayX payout (sandbox)
- [ ] M4: Wipe certificate pipeline + verify page + CEIR workflow
- [ ] M5: Resale storefront + GST invoicing
- [ ] M6: B2B portal + WhatsApp bot
- [ ] Launch gate: security review, DPDPA pages live, payout idempotency tested, Zone SLAs rehearsed with real pickups
