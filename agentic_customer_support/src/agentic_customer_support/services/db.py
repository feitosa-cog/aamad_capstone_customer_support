from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Using SQLite for local development; production uses PostgreSQL
SQLITE_URL = 'sqlite:///./agentic_support.db'

engine = create_engine(SQLITE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def init_db():
    Base.metadata.create_all(bind=engine)
