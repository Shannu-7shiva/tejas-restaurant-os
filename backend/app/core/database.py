import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

raw_db_url = os.getenv("DATABASE_URL", "").strip()

if not raw_db_url:
    # Use config default or local sqlite
    raw_db_url = settings.DATABASE_URL

# Fix Render / Supabase / Heroku postgres:// -> postgresql+psycopg2://
if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    db_url = raw_db_url

connect_args = {}
if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    with engine.connect() as conn:
        pass
    print(f"Database connection initialized successfully.")
except Exception as e:
    print(f"Warning: Primary database connection failed: {e}. Falling back to local SQLite.")
    engine = create_engine(
        "sqlite:///./tejas.db",
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
