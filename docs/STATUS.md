# Project status — pick-up-here tracker

_Last session: 2026-08-18. Update this file at the end of every working session._

## Where things stand

**Live site:** https://rokkamhq.github.io (repo `rokkamhq/rokkamhq.github.io`,
public, org owned by the `rudraveeramsxk` account). Every push to `main`
auto-tests and auto-deploys via GitHub Actions. WhatsApp CTA wired to
+91 84483 48653.

**Milestones:** M1 ✅ (catalog + wizard + ledger, 8 phone brands / 5 laptop
brands, 73 priced models) · M2 ✅ (server quotes, OTP auth, booking, admin
dashboard — runs locally only; see below) · M3+ not started.

**Test suites (all green in CI):**
- `packages/pricing/tests` — 32 Python engine tests
- `services/api/tests` — 16 API tests (quotes, OTP, booking, admin, audit, loader idempotency)
- `apps/web` `npm test` — 12 TS engine-mirror tests

## How to resume local dev

See [RUNBOOK.md](RUNBOOK.md). Short version: repo venv at `.venv/` is ready;
`services/api` runs uvicorn on :8000 (SQLite dev DB, already seeded); admin UI
on :3001; web on :3000 with `NEXT_PUBLIC_API_URL=http://localhost:8000` in
`apps/web/.env.local` (file not committed — recreate it). Dev admin login:
admin@rokkam.in (password was printed once at creation; if lost, rerun
`scripts/create_admin.py` — it resets safely).

## Deliberate dev-mode shortcuts (to revisit at VPS deployment)

- SQLite instead of Postgres 16 (`DATABASE_URL` env switches; compose file ready in `infra/`)
- `create_all` instead of Alembic migrations
- No Redis yet: OTP rate-limit via DB, slot windows without capacity locks
- OTP codes returned in API response (`DEV_MODE=1`) — MSG91 not wired
- No cron to expire stale quotes (API refuses expired locks anyway)

## Demo data pending real values

- `seeds/pricing/demo_base_prices.*.json` — placeholder buyback prices (admin repricing pass needed)
- `seeds/zones.json` — draft pincode lists (client to confirm)
- All catalog seeds are `"verified": false` (GSMArena/spec-archive verification pass pending)
- Copy is EN-only with i18n keys; TE/UR translation is a dedicated task

## Next up

**Demo prep (2026-08-18):** local stack verified end-to-end (quote → OTP →
booking → admin queue). Web polish shipped: /sell model search, post-booking
"what happens next" timeline, quote-code copy + server-lock badge. User is
recording a demo video against the local stack; **after that: full APK that
runs on the user's phone with dev settings** (decision: full app, not a quick
TWA wrapper — phone must reach the dev API over LAN, so NEXT_PUBLIC_API_URL
and ALLOWED_ORIGINS need the machine's LAN IP).

Then pick one:

1. **VPS deployment** (fastest path to real bookings): Mumbai VPS + `infra/docker-compose.yml`
   + Caddy + set `NEXT_PUBLIC_API_URL` in `.github/workflows/deploy.yml` → live site books real pickups
2. **M3**: Flutter agent app, deviation flow (photo evidence + re-consent), RazorpayX sandbox payouts
3. **Domain**: buy rokkam.in → custom domain on GitHub Pages (CNAME + one Pages setting)

## Machine/context notes

- Windows 11 dev box; git needs PATH refresh in fresh shells (see Claude memory)
- Commits authored as `rudraveeramsxk` (repo-local git config — never the global identity)
- GitHub API automation works with the stored git credential (`git credential fill`)
