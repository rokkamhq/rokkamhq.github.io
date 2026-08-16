# Rokkam · రొక్కం

Sell your phone in Hyderabad. 60-minute pickup. Certified data wipe. Cash before the agent leaves.

Hyperlocal re-commerce platform for Hyderabad + Secunderabad (GHMC): device buyback → refurbish → resale, plus B2B fleet buyback. Full product spec and build order live in [CLAUDE.md](CLAUDE.md).

## Repo layout

```
apps/web        Next.js seller site (Phase 1 sell-flow MVP) — static export
seeds/          Canonical catalog, pricing and zone data (source of truth)
services/       FastAPI backend (Phase 1+)
packages/       pricing engine, certificate generator (Phase 2+)
docs/           Pricing rules, zones, compliance, runbook
infra/          docker-compose, Caddy, backups
```

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

Cloudflare Pages, connected to this repo:

- Build command: `cd apps/web && npm install && npm run build`
- Output directory: `apps/web/out`
- Project name `rokkam` → https://rokkam.pages.dev, later the custom domain rokkam.in

## Status

- [x] M1: Catalog + questionnaire + quote engine + deduction ledger UI
- [ ] M2: Booking + OTP + admin price matrix + order queue
- [ ] M3: Agent app verification + payouts
- [ ] M4: Wipe certificates + CEIR workflow
- [ ] M5: Resale storefront
- [ ] M6: B2B portal + WhatsApp bot
