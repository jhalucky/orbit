from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def ensure_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    user_statements = {
        "lat": "ALTER TABLE users ADD COLUMN lat FLOAT",
        "lng": "ALTER TABLE users ADD COLUMN lng FLOAT",
        "using_device_location": (
            "ALTER TABLE users ADD COLUMN using_device_location BOOLEAN DEFAULT 0"
        ),
        "location_source": "ALTER TABLE users ADD COLUMN location_source VARCHAR",
        "location_accuracy_m": "ALTER TABLE users ADD COLUMN location_accuracy_m FLOAT",
    }
    business_statements = {
        "city": "ALTER TABLE businesses ADD COLUMN city VARCHAR DEFAULT 'Bengaluru'",
    }
    with engine.begin() as conn:
        user_columns = {
            row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()
        }
        for name, sql in user_statements.items():
            if name not in user_columns:
                conn.execute(text(sql))
        business_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(businesses)")).fetchall()
        }
        for name, sql in business_statements.items():
            if name not in business_columns:
                conn.execute(text(sql))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
