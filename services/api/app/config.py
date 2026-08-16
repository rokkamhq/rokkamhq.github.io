import os
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = API_DIR.parents[1]

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{API_DIR / 'data' / 'rokkam.db'}")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-secret-change-in-prod-0123456789abcdef")
JWT_TTL_HOURS = int(os.environ.get("JWT_TTL_HOURS", "72"))
# DEV_MODE returns OTP codes in API responses instead of sending SMS (no MSG91 yet).
DEV_MODE = os.environ.get("DEV_MODE", "1") == "1"
SEEDS_DIR = Path(os.environ.get("SEEDS_DIR", REPO_DIR / "seeds"))
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,https://rokkamhq.github.io",
).split(",")

QUOTE_LOCK_DAYS = 7
OTP_TTL_MINUTES = 5
OTP_MAX_PER_WINDOW = 3
OTP_WINDOW_MINUTES = 10
PRICE_STALE_DAYS = 14
