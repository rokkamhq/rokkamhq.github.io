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

## Seller APK (demo build, sideload on Android)

Native Flutter app in [`apps/seller_app`](apps/seller_app) — full catalog +
questionnaire + live deduction ledger, working entirely offline from bundled
seeds. When the dev API is reachable it upgrades automatically: server-locked
quotes + OTP booking.

- **Ready-built APK:** `rokkam-seller-demo.apk` at the repo root (gitignored copy)
- **Rebuild:** `cd apps\seller_app && D:\flutter\bin\flutter.bat build apk --release`
  → `apps\seller_app\build\app\outputs\flutter-apk\app-release.apk`
- **Install:** copy the APK to the phone (WhatsApp-to-self / USB / `adb install`),
  allow "install unknown apps" when prompted.
- **Phone ↔ PC connectivity (for live booking in the app):**
  1. Phone and PC on the same network (the PC is on the phone's hotspot: perfect).
  2. `start-dev.bat` now binds the API to `0.0.0.0` — reachable at
     `http://192.168.43.125:8000` (PC's hotspot IP; re-check with `ipconfig` if it changes).
  3. Windows Firewall must allow inbound port 8000. One-time (admin PowerShell):
     `New-NetFirewallRule -DisplayName "Rokkam dev API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow`
  4. In the app: gear icon (top-right of home) → API URL → **Save & test**.
- Without the API the app stays fully demo-able: quotes compute on-device,
  booking falls back to WhatsApp. Airplane-mode-proof.

## Tests (all should be green)

```powershell
.\.venv\Scripts\python.exe -m pytest packages/pricing/tests services/api/tests   # 48 tests
cd apps\web && npm test && npm run lint                                          # engine mirror + lint
cd apps\seller_app && D:\flutter\bin\flutter.bat test                            # Dart engine mirror (11 tests)
```

## More docs

- [`docs/STATUS.md`](docs/STATUS.md) — pick-up-here tracker (read at every session start)
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — full local dev + Docker/VPS instructions
- [`docs/PRICING_RULES.md`](docs/PRICING_RULES.md) — human-readable deduction matrix
- [`CLAUDE.md`](CLAUDE.md) — project spec (scope, architecture, phases)
