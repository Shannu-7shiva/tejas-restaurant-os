import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

raw_db_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Fix Render / Supabase / Heroku postgres:// -> postgresql:// dialect
if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = raw_db_url

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as e:
    print(f"Warning: Primary database connection failed: {e}. Falling back to SQLite.")
    engine = create_engine(
        f"sqlite:///{settings.DATABASE_URL.replace('sqlite:///', '')}",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
