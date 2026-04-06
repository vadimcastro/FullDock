from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_id = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    notes = Column(Text, default="", nullable=False)
    status = Column(String, nullable=False, index=True) # queued, on-deck, needs-edit, complete
    order = Column(Integer, nullable=False)
    linked_prompt_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
