# app/db/base.py
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings
from app.db.base_class import Base

# Import all models to ensure they are registered with Base
from app.models.user import User  
from app.models.user_session import UserSession

# Create SQLAlchemy engine
engine = create_engine(settings.DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()