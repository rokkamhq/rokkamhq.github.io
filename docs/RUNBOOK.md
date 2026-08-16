# Runbook — local development & operations

## Local dev (no Docker — SQLite)

One-time setup, from the repo root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e packages/pricing -r services/api/requirements.txt
cd services/api
..\..\.venv\Scripts\python.exe scripts\load_seeds.py        # seed catalog/prices/rules/zones
..\..\.venv\Scripts\python.exe scripts\create_admin.py admin@rokkam.in "Your Name"
# ^ prints the password + TOTP secret ONCE — store them in a password manager
```

Run the three processes:

| What | Where | Command | URL |
|---|---|---|---|
| API | `services/api` | `..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload` | http://localhost:8000 (docs at /docs) |
| Seller site | `apps/web` | `npm run dev` (set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local` for real quotes/booking) | http://localhost:3000 |
| Admin | `apps/admin` | `npm run dev` | http://localhost:3001 |

`DEV_MODE=1` (default) returns OTP codes in the API response instead of sending
SMS — the booking widget shows the code inline. Set `DEV_MODE=0` once MSG91 is
wired up.

## Docker (Postgres 16, VPS-shaped)

```bash
cd infra
cp .env.example .env   # set POSTGRES_PASSWORD + JWT_SECRET
docker compose up --build
docker compose exec api python scripts/load_seeds.py
docker compose exec api python scripts/create_admin.py admin@rokkam.in "Your Name"
```

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest packages/pricing/tests services/api/tests   # engine + API
cd apps\web; npm test                                                            # TS engine mirror
```

CI runs all three on every push (`.github/workflows/`).

## Operational notes

- **Reseeding is safe**: `load_seeds.py` upserts on slug/key, never deletes, and
  never overwrites a price the admin has set. `--dry-run` previews.
- **Prices**: set weekly in the admin (Prices tab). Rows untouched for 14 days
  show a `stale` badge (spec §6 staleness report).
- **Audit**: every price change, rule change, order transition and quote
  override writes `audit_log` (append-only). Admin → Audit shows the trail.
- **Quote lock**: 7 days server-side. Booking converts the quote; expired or
  converted quotes refuse re-booking. (Cron to expire stale quotes: TODO with
  the VPS deployment, alongside Alembic migrations and Redis slot locks.)
- **The static site** (rokkamhq.github.io) runs in fallback mode (demo quotes +
  WhatsApp) until `NEXT_PUBLIC_API_URL` is set in the deploy workflow, pointing
  at the public API on the Mumbai VPS.
