"""
database.py  —  SQLAlchemy engine & session factory.

MySQL is used via pymysql driver.
pool_pre_ping=True silently verifies connections before use,
preventing the classic "MySQL server has gone away" crash after idle periods.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DB_USER     = os.getenv("DB_USER",     "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = os.getenv("DB_PORT",     "3306")
DB_NAME     = os.getenv("DB_NAME",     "securepass_db")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping  = True,   # Verify connection before use
    pool_recycle   = 1800,   # Recycle connections every 30 min
    pool_size      = 5,
    max_overflow   = 10,
    echo           = False,  # Set True for SQL debug logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


def get_db():
    """FastAPI dependency — yields a scoped DB session, closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
