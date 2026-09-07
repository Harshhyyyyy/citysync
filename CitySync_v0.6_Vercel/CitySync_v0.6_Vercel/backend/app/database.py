import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


def normalize_database_url(value: str) -> str:
    """Accept common Postgres URLs and force SQLAlchemy to use psycopg v3."""
    url = value.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    # Managed Postgres providers normally require TLS. Local Docker does not.
    if "sslmode=" not in url and "localhost" not in url and "127.0.0.1" not in url:
        url += "&sslmode=require" if "?" in url else "?sslmode=require"
    return url


DATABASE_URL = normalize_database_url(
    os.getenv("DATABASE_URL", "postgresql+psycopg://citysync:citysync@localhost:5432/citysync")
)

_is_local = "localhost" in DATABASE_URL or "127.0.0.1" in DATABASE_URL
_connect_args = {} if _is_local else {"options": "-c search_path=public,extensions"}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=_connect_args,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
