# Rokkam seller app (demo build)

Native Flutter Android app for the seller flow. **This is not the spec's M3
agent app** (that will live in `apps/agent`) — it's a self-sustained demo of
the sell experience for phones + laptops.

## What it does

- Full sell flow: category → brand/model browse (with search) → variant or
  CPU/RAM/storage config picker → condition questionnaire → animated live
  deduction ledger → locked-price result with quote code.
- **Offline-first:** catalog, deduction rules and zone maps are bundled from
  `/seeds` (copied into `assets/seeds/`); quotes compute on-device via a Dart
  port of the pricing engine. Booking falls back to WhatsApp when offline.
- **API upgrade:** when the dev API (services/api) is reachable, quotes lock
  server-side and the OTP → address → slot booking flow goes live. The gear
  icon on the home screen opens dev settings (API URL + connection test);
  default is `http://192.168.43.125:8000` (see `lib/data/api.dart`).

## Engine parity

`lib/data/engine.dart` is a port of `packages/pricing` (mirrored in
`apps/web/src/lib/quote.ts`). `test/engine_test.dart` mirrors
`apps/web/scripts/quote.test.mjs` — same pinned rupee values across all three
implementations. Any engine change must land in all three plus their tests.

## Build & test

```powershell
D:\flutter\bin\flutter.bat test                 # 11 engine tests
D:\flutter\bin\flutter.bat build apk --release  # APK -> build\app\outputs\flutter-apk\app-release.apk
```

Notes:

- `android/gradle.properties` sets `kotlin.incremental=false` — the pub cache
  (C:) and repo (D:) sit on different drives, which breaks Kotlin's
  incremental cache on Windows.
- Release builds sign with the **debug keystore** (fine for sideloading,
  not for Play Store).
- Seeds in `assets/seeds/` are copies of `/seeds` — re-copy after editing the
  canonical files.
- `AndroidManifest.xml` allows cleartext HTTP for the LAN dev API — remove
  when the API gets a public HTTPS endpoint.
