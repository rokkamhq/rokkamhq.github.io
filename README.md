# Rokkam · రొక్కం

Sell your phone in Hyderabad. 60-minute pickup. Certified data wipe. Cash before the agent leaves.

Hyperlocal re-commerce platform for Hyderabad + Secunderabad (GHMC): device buyback → refurbish → resale, plus B2B fleet buyback. Full product spec and build order live in [CLAUDE.md](CLAUDE.md).

## Repo layout

```
apps/web          Next.js seller site — static export (rokkamhq.github.io)
apps/admin        Next.js admin dashboard (prices, rules, orders, audit)
services/api      FastAPI monolith: quotes, OTP auth, booking, admin
packages/pricing  Pure-Python pricing engine (TS mirror in apps/web)
seeds/            Canonical catalog, pricing and zone data (source of truth)
docs/             Pricing rules, runbook, compliance
infra/            docker-compose (Postgres 16 + API)
```

Local dev for the full stack (API + admin + booking): see
[docs/RUNBOOK.md](docs/RUNBOOK.md).

## Web app (apps/web)

```bash
cd apps/web
npm install
npm run dev     # syncs seeds from ../../seeds, then next dev
npm run build   # static export to apps/web/out
```

Seed data is copied from `seeds/` at build time (`npm run sync-seeds`) — never edit
`apps/web/src/data/seeds` directly. Base prices in
`seeds/pricing/demo_base_prices.phone.json` are **demo values** pending the admin
pricing pass.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml`: every push to `main` runs the
quote-engine tests, builds the static export, and publishes it. The workflow
detects the repo owner/name, so transferring the repo to an org (or renaming it
to `<owner>.github.io`) redeploys to the new URL with the right base path —
no config changes needed. Custom domain rokkam.in later.

## Status

- [x] M1: Catalog + questionnaire + quote engine + deduction ledger UI
- [x] M2: Booking + OTP + admin price matrix + order queue (local stack; goes
      public with the Mumbai VPS deployment)
- [ ] M3: Agent app verification + payouts
- [ ] M4: Wipe certificates + CEIR workflow
- [ ] M5: Resale storefront
- [ ] M6: B2B portal + WhatsApp bot
