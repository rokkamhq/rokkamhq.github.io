"""Create or update an admin user. Prints a generated password and TOTP
provisioning URI once — store them in a password manager, they are not saved
in plain text anywhere.

Usage (from services/api):
  python scripts/create_admin.py admin@rokkam.in "Full Name" [role] [--no-totp]
"""

import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pyotp  # noqa: E402

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.models import AdminUser  # noqa: E402
from app.security import hash_password  # noqa: E402


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    email = sys.argv[1].strip().lower()
    name = sys.argv[2]
    role = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else "admin"
    use_totp = "--no-totp" not in sys.argv

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        password = secrets.token_urlsafe(12)
        totp_secret = pyotp.random_base32() if use_totp else ""
        user = db.query(AdminUser).filter(AdminUser.email == email).first()
        if user:
            user.password_hash = hash_password(password)
            user.totp_secret = totp_secret
            user.role = role
            user.name = name
            action = "updated"
        else:
            user = AdminUser(email=email, name=name, role=role, password_hash=hash_password(password), totp_secret=totp_secret)
            db.add(user)
            action = "created"
        db.commit()
        print(f"{action}: {email} (role={role})")
        print(f"password: {password}")
        if totp_secret:
            uri = pyotp.TOTP(totp_secret).provisioning_uri(name=email, issuer_name="Rokkam Admin")
            print(f"TOTP secret: {totp_secret}")
            print(f"TOTP URI (scan in authenticator app): {uri}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
