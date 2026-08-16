from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from . import config


class Base(DeclarativeBase):
    pass


def _make_engine():
    if config.DATABASE_URL.startswith("sqlite"):
        Path(config.DATABASE_URL.split("///", 1)[1]).parent.mkdir(parents=True, exist_ok=True)
        return create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})
    return create_engine(config.DATABASE_URL, pool_pre_ping=True)


engine = _make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
