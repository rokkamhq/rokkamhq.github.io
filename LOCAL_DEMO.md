# Rokkam — local demo cheat sheet

Everything you need to run and record the demo on this machine.

## Start / stop (double-click)

| Script | What it does |
|---|---|
| [`start-dev.bat`](start-dev.bat) | Starts API (:8000), seller site (:3000), admin (:3001) — each in its own window — then opens the browser tabs. Creates `apps/web/.env.local` if missing. |
| [`stop-dev.bat`](stop-dev.bat) | Kills everything listening on ports 8000/3000/3001 and closes the server windows. |

## Links

| What | URL |
|---|---|
| Seller site (local) | http://localhost:3000 |
| Admin dashboard (local) | http://localhost:3001 |
| API docs (local) | http://localhost:8000/docs |
| Live site (static fallback mode) | https://rokkamhq.github.io |
| GitHub repo | https://github.com/rokkamhq/rokkamhq.github.io |

## Admin login

Credentials live in [`ADMIN_CREDENTIALS.txt`](ADMIN_CREDENTIALS.txt) (local-only,
gitignored — never committed). It has the email, password, TOTP secret, a
one-liner to generate a login code without an authenticator app, and the reset
command.

## Demo recording arc

1. Landing page (hero ledger animates) → **Get my price**
2. On /sell, type "iPhone 13" in the search box → jump straight into the wizard
3. Pick 128GB → answer the condition questions — watch the deduction ledger build
4. Final price: server-lock badge + quote code (copy button)
5. Book pickup: phone number → OTP (dev code shows on screen) → address with
   Zone A pincode (e.g. 500081) → pick a slot
6. Confirmation with the "what happens next" timeline
7. Switch to http://localhost:3001 → log in → show the order in the queue
   (Prices and Audit tabs are also demo-worthy)

Dev-mode notes: OTP codes are shown inline on the page (no SMS is sent), and
the dev DB is SQLite — reseeding is safe (`services/api/scripts/load_seeds.py`).

## Tests (all should be green)

```powershell
.\.venv\Scripts\python.exe -m pytest packages/pricing/tests services/api/tests   # 48 tests
cd apps\web && npm test && npm run lint                                          # engine mirror + lint
```

## More docs

- [`docs/STATUS.md`](docs/STATUS.md) — pick-up-here tracker (read at every session start)
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — full local dev + Docker/VPS instructions
- [`docs/PRICING_RULES.md`](docs/PRICING_RULES.md) — human-readable deduction matrix
- [`CLAUDE.md`](CLAUDE.md) — project spec (scope, architecture, phases)
