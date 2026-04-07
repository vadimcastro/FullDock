from typing import Optional
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.user_setting import UserSetting
from app.schemas.user_setting import UserSettingCreate, UserSettingUpdate

class CRUDUserSetting(CRUDBase[UserSetting, UserSettingCreate, UserSettingUpdate]):
    @staticmethod
    def _is_missing_column_error(exc: ProgrammingError) -> bool:
        msg = str(getattr(exc, "orig", exc)).lower()
        return "undefinedcolumn" in msg or "column" in msg

    @staticmethod
    def _ensure_settings_columns(db: Session) -> None:
        # Self-heal legacy/stamped DBs that missed additive settings migrations.
        statements = [
            """
            ALTER TABLE user_settings
            ADD COLUMN IF NOT EXISTS model_tab_order TEXT NOT NULL
            DEFAULT '["claude","gemini","gpt","grok"]'
            """,
            """
            ALTER TABLE user_settings
            ADD COLUMN IF NOT EXISTS enabled_model_tabs TEXT NOT NULL
            DEFAULT '["claude","gemini","gpt","grok"]'
            """,
            """
            ALTER TABLE user_settings
            ADD COLUMN IF NOT EXISTS model_tab_titles TEXT NOT NULL
            DEFAULT '{"claude":"Claude","gemini":"Gemini","gpt":"GPT","grok":"Grok"}'
            """,
            """
            ALTER TABLE user_settings
            ADD COLUMN IF NOT EXISTS custom_model_tab_title VARCHAR NOT NULL
            DEFAULT 'Custom'
            """,
            """
            ALTER TABLE user_settings
            ADD COLUMN IF NOT EXISTS prompt_category_order TEXT NOT NULL
            DEFAULT '["on-deck","needs-edit","queued","forked","complete"]'
            """,
            """
            ALTER TABLE user_settings
            ADD COLUMN IF NOT EXISTS enabled_prompt_categories TEXT NOT NULL
            DEFAULT '["on-deck","needs-edit","queued","forked","complete"]'
            """,
        ]
        for stmt in statements:
            db.execute(text(stmt))
        db.commit()

    def get_by_user(self, db: Session, *, user_id: int) -> Optional[UserSetting]:
        try:
            return db.query(self.model).filter(self.model.user_id == user_id).first()
        except ProgrammingError as exc:
            db.rollback()
            if not self._is_missing_column_error(exc):
                raise
            self._ensure_settings_columns(db)
            return db.query(self.model).filter(self.model.user_id == user_id).first()

    def create_with_user(
        self, db: Session, *, obj_in: UserSettingCreate, user_id: int
    ) -> UserSetting:
        # Check if settings already exist for this user (Upsert)
        existing_setting = self.get_by_user(db, user_id=user_id)
        
        if existing_setting:
            # Update existing
            for field, value in obj_in.model_dump().items():
                setattr(existing_setting, field, value)
            db.add(existing_setting)
            db.commit()
            db.refresh(existing_setting)
            return existing_setting
            
        # Create new
        db_obj = self.model(
            **obj_in.model_dump(),
            user_id=user_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

crud_user_setting = CRUDUserSetting(UserSetting)
