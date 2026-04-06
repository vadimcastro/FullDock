# app/api/v1/endpoints/settings.py
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.utils import get_db
from app.core.security import get_user_from_token
from fastapi.security import OAuth2PasswordBearer
from app.crud.crud_user_setting import crud_user_setting
from app.schemas.user_setting import UserSetting, UserSettingUpdate, UserSettingCreate

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

@router.get("/", response_model=UserSetting)
def read_settings(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> Any:
    """Get user settings."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    settings = crud_user_setting.get_by_user(db, user_id=user.id)
    if not settings:
        # Create default settings if not exists
        settings = crud_user_setting.create_with_user(
            db, obj_in=UserSettingCreate(), user_id=user.id
        )
    return settings

@router.post("/", response_model=UserSetting)
def update_settings(
    *,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    settings_in: UserSettingUpdate,
) -> Any:
    """Update user settings."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    settings = crud_user_setting.get_by_user(db, user_id=user.id)
    if not settings:
        settings = crud_user_setting.create_with_user(
            db, obj_in=UserSettingCreate(**settings_in.model_dump()), user_id=user.id
        )
    else:
        settings = crud_user_setting.update(db, db_obj=settings, obj_in=settings_in)
    return settings
