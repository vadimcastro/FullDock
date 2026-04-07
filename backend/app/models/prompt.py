from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.sql import func
from app.db.base_class import Base


class Prompt(Base):
    __tablename__ = "prompts"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'on-deck', 'needs-edit', 'forked', 'complete')",
            name="ck_prompts_status_valid",
        ),
        Index("ix_prompts_user_id", "user_id"),
        Index("ix_prompts_user_model_order", "user_id", "model_id", "order"),
        Index("ix_prompts_user_model_status", "user_id", "model_id", "status"),
    )

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_id = Column(String, nullable=False, index=True)
    title = Column(String, default="", nullable=False)
    content = Column(Text, nullable=False)
    notes = Column(Text, default="", nullable=False)
    status = Column(String, nullable=False, index=True)  # queued, on-deck, needs-edit, forked, complete
    order = Column(Integer, nullable=False)
    linked_prompt_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
