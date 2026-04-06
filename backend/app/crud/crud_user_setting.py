from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.user_setting import UserSetting
from app.schemas.user_setting import UserSettingCreate, UserSettingUpdate

class CRUDUserSetting(CRUDBase[UserSetting, UserSettingCreate, UserSettingUpdate]):
    def get_by_user(self, db: Session, *, user_id: int) -> Optional[UserSetting]:
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
