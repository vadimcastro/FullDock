from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.base_class import Base

class UserSetting(Base):
    __tablename__ = "user_settings"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    theme = Column(String, default="dark", nullable=False)
    accent_color = Column(String, default="teal", nullable=False)
    notifications = Column(Boolean, default=False, nullable=False)
    sound_enabled = Column(Boolean, default=False, nullable=False)
    auto_save = Column(Boolean, default=True, nullable=False)
    font_scale = Column(Integer, default=100, nullable=False)
    show_prompt_titles = Column(Boolean, default=True, nullable=False)
