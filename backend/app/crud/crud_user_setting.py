import json
import re
from typing import Optional
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.user_setting import UserSetting
from app.schemas.user_setting import (
    ModelTabTitleUpdate,
    ModelTabsLayoutUpdate,
    PromptCategoriesLayoutUpdate,
    UserSettingCreate,
    UserSettingUpdate,
)

DEFAULT_MODEL_ORDER = ["claude", "gemini", "gpt", "grok"]
DEFAULT_CATEGORY_ORDER = ["on-deck", "needs-edit", "queued", "forked", "complete"]
MODEL_TAB_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")

class CRUDUserSetting(CRUDBase[UserSetting, UserSettingCreate, UserSettingUpdate]):
    @staticmethod
    def _parse_json_list(raw: Optional[str], fallback: list[str]) -> list[str]:
        if not raw:
            return list(fallback)
        try:
            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                return list(fallback)
            return [str(item) for item in parsed]
        except (TypeError, ValueError):
            return list(fallback)

    @staticmethod
    def _parse_json_dict(raw: Optional[str], fallback: dict[str, str]) -> dict[str, str]:
        if not raw:
            return dict(fallback)
        try:
            parsed = json.loads(raw)
            if not isinstance(parsed, dict):
                return dict(fallback)
            return {str(k): str(v) for k, v in parsed.items()}
        except (TypeError, ValueError):
            return dict(fallback)

    @staticmethod
    def _dedupe_keep_order(values: list[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for value in values:
            if value in seen:
                continue
            seen.add(value)
            result.append(value)
        return result

    @classmethod
    def _validate_model_ids(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip().lower() for value in values if str(value).strip()]
        deduped = cls._dedupe_keep_order(cleaned)
        if not deduped:
            raise ValueError("model_tab_order cannot be empty")
        invalid = [value for value in deduped if not MODEL_TAB_ID_RE.match(value)]
        if invalid:
            raise ValueError(f"invalid_model_tab_ids={','.join(invalid)}")
        return deduped

    @classmethod
    def _validate_prompt_categories(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if str(value).strip()]
        deduped = cls._dedupe_keep_order(cleaned)
        if not deduped:
            raise ValueError("prompt_category_order cannot be empty")
        invalid = [value for value in deduped if value not in DEFAULT_CATEGORY_ORDER]
        if invalid:
            raise ValueError(f"invalid_prompt_categories={','.join(invalid)}")
        return deduped

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

    def get_by_user_for_update(self, db: Session, *, user_id: int) -> Optional[UserSetting]:
        try:
            return (
                db.query(self.model)
                .filter(self.model.user_id == user_id)
                .with_for_update()
                .first()
            )
        except ProgrammingError as exc:
            db.rollback()
            if not self._is_missing_column_error(exc):
                raise
            self._ensure_settings_columns(db)
            return (
                db.query(self.model)
                .filter(self.model.user_id == user_id)
                .with_for_update()
                .first()
            )

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

    def reorder_model_tabs(
        self, db: Session, *, db_obj: UserSetting, payload: ModelTabsLayoutUpdate
    ) -> UserSetting:
        order = self._validate_model_ids(payload.order)
        enabled = self._validate_model_ids(payload.enabled)
        if not set(enabled).issubset(set(order)):
            raise ValueError("enabled_model_tabs_must_be_subset_of_model_tab_order")

        existing_titles = self._parse_json_dict(
            db_obj.model_tab_titles,
            {
                "claude": "Claude",
                "gemini": "Gemini",
                "gpt": "GPT",
                "grok": "Grok",
            },
        )
        next_titles: dict[str, str] = {}
        for model_id in order:
            default_title = existing_titles.get(model_id, model_id.replace("-", " ").title())
            next_titles[model_id] = default_title

        db_obj.model_tab_order = json.dumps(order)
        db_obj.enabled_model_tabs = json.dumps(enabled)
        db_obj.model_tab_titles = json.dumps(next_titles)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def reorder_prompt_categories(
        self, db: Session, *, db_obj: UserSetting, payload: PromptCategoriesLayoutUpdate
    ) -> UserSetting:
        order = self._validate_prompt_categories(payload.order)
        enabled = self._validate_prompt_categories(payload.enabled)
        if not set(enabled).issubset(set(order)):
            raise ValueError("enabled_prompt_categories_must_be_subset_of_prompt_category_order")

        db_obj.prompt_category_order = json.dumps(order)
        db_obj.enabled_prompt_categories = json.dumps(enabled)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def upsert_model_tab_title(
        self, db: Session, *, db_obj: UserSetting, payload: ModelTabTitleUpdate
    ) -> UserSetting:
        tab_id = payload.tab_id.strip().lower()
        if not MODEL_TAB_ID_RE.match(tab_id):
            raise ValueError("invalid_model_tab_id")

        title = payload.title.strip()
        if not title:
            raise ValueError("model_tab_title_cannot_be_empty")
        if len(title) > 64:
            raise ValueError("model_tab_title_too_long")

        order = self._parse_json_list(db_obj.model_tab_order, DEFAULT_MODEL_ORDER)
        enabled = self._parse_json_list(db_obj.enabled_model_tabs, DEFAULT_MODEL_ORDER)
        titles = self._parse_json_dict(
            db_obj.model_tab_titles,
            {"claude": "Claude", "gemini": "Gemini", "gpt": "GPT", "grok": "Grok"},
        )

        if tab_id not in order:
            order.append(tab_id)
        if tab_id not in enabled:
            enabled.append(tab_id)
        titles[tab_id] = title

        db_obj.model_tab_order = json.dumps(self._validate_model_ids(order))
        db_obj.enabled_model_tabs = json.dumps(self._validate_model_ids(enabled))
        db_obj.model_tab_titles = json.dumps(titles)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

crud_user_setting = CRUDUserSetting(UserSetting)
