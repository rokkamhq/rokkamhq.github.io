from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .db import Base, engine
from .routers import admin, auth, orders, quotes

app = FastAPI(title="Rokkam API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in config.ALLOWED_ORIGINS if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Alembic migrations arrive with the Postgres/VPS deployment; create_all covers dev.
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(quotes.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"ok": True, "dev_mode": config.DEV_MODE}
