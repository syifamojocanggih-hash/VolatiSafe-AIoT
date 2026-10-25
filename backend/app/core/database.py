import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger("volatisafe.database")

# PostgreSQL connection string
PG_URL = f"postgresql+psycopg://volatisafe:volatisafe_secret@{settings.POSTGRES_SERVER if hasattr(settings, 'POSTGRES_SERVER') else 'localhost'}:5432/volatisafe_db"

def get_engine():
    # Coba koneksi ke PostgreSQL TimescaleDB
    try:
        engine = create_engine(
            PG_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to TimescaleDB PostgreSQL.")
        return engine, True
    except Exception as e:
        logger.warning(f"Could not connect to TimescaleDB ({e}). Using SQLite fallback.")
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
        )
        return engine, False

engine, is_timescaledb_active = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
