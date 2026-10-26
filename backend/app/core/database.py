import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger("volatisafe.database")

def get_db_url():
    if settings.DATABASE_URL and "sqlite" not in settings.DATABASE_URL:
        return settings.DATABASE_URL
    return f"postgresql+psycopg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

def get_engine():
    db_url = get_db_url()
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Successfully connected to PostgreSQL/TimescaleDB at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}.")
        return engine, True
    except Exception as e:
        logger.warning(f"Could not connect to TimescaleDB ({e}). Falling back to SQLite.")
        sqlite_engine = create_engine(
            "sqlite:///./volatisafe.db",
            connect_args={"check_same_thread": False}
        )
        return sqlite_engine, False

engine, is_timescaledb_active = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
