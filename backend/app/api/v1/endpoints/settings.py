# app/api/v1/endpoints/settings.py
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.utils import get_db
from app.core.security import get_user_from_token
from app.core.config import settings as app_settings
from app.core.api_errors import bad_request, too_many_requests
from app.core.write_protection import write_protection
from fastapi.security import OAuth2PasswordBearer
from app.crud.crud_user_setting import crud_user_setting
from app.schemas.user_setting import (
    ModelTabTitleUpdate,
    ModelTabsLayoutUpdate,
    PromptCategoriesLayoutUpdate,
    UserSetting,
    UserSettingUpdate,
    UserSettingCreate,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _request_id(request: Request) -> str | None:
    rid = getattr(request.state, "request_id", None)
    return str(rid) if rid else None


def _enforce_settings_write_limit(request: Request, identity: str, *, layout: bool = False) -> None:
    allowed, retry_after = write_protection.hit(
        identity=identity,
        bucket="settings-layout" if layout else "settings-write",
        per_minute_limit=(
            app_settings.WRITE_LAYOUT_RATE_LIMIT_PER_MINUTE
            if layout
            else app_settings.WRITE_RATE_LIMIT_PER_MINUTE
        ),
    )
    if not allowed:
        raise too_many_requests(
            code="WRITE_RATE_LIMITED",
            message=f"Too many write requests. Retry in {retry_after}s.",
            request_id=_request_id(request),
        )

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
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    settings_in: UserSettingUpdate,
) -> Any:
    """Update user settings."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    _enforce_settings_write_limit(request, user.email)
    settings = crud_user_setting.get_by_user(db, user_id=user.id)
    if not settings:
        settings = crud_user_setting.create_with_user(
            db, obj_in=UserSettingCreate(**settings_in.model_dump()), user_id=user.id
        )
    else:
        settings = crud_user_setting.update(db, db_obj=settings, obj_in=settings_in)
    return settings


@router.post("/layout/model-tabs", response_model=UserSetting)
def reorder_model_tabs(
    *,
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    payload: ModelTabsLayoutUpdate,
) -> Any:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    _enforce_settings_write_limit(request, user.email, layout=True)

    settings = crud_user_setting.get_by_user_for_update(db, user_id=user.id)
    if not settings:
        settings = crud_user_setting.create_with_user(
            db, obj_in=UserSettingCreate(), user_id=user.id
        )
    try:
        return crud_user_setting.reorder_model_tabs(db, db_obj=settings, payload=payload)
    except ValueError as exc:
        raise bad_request(
            code="SETTINGS_LAYOUT_INVALID",
            message=str(exc),
            request_id=_request_id(request),
        ) from exc


@router.post("/layout/prompt-categories", response_model=UserSetting)
def reorder_prompt_categories(
    *,
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    payload: PromptCategoriesLayoutUpdate,
) -> Any:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    _enforce_settings_write_limit(request, user.email, layout=True)

    settings = crud_user_setting.get_by_user_for_update(db, user_id=user.id)
    if not settings:
        settings = crud_user_setting.create_with_user(
            db, obj_in=UserSettingCreate(), user_id=user.id
        )
    try:
        return crud_user_setting.reorder_prompt_categories(db, db_obj=settings, payload=payload)
    except ValueError as exc:
        raise bad_request(
            code="SETTINGS_LAYOUT_INVALID",
            message=str(exc),
            request_id=_request_id(request),
        ) from exc


@router.post("/layout/model-tab-title", response_model=UserSetting)
def update_model_tab_title(
    *,
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    payload: ModelTabTitleUpdate,
) -> Any:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    _enforce_settings_write_limit(request, user.email, layout=True)

    settings = crud_user_setting.get_by_user_for_update(db, user_id=user.id)
    if not settings:
        settings = crud_user_setting.create_with_user(
            db, obj_in=UserSettingCreate(), user_id=user.id
        )
    try:
        return crud_user_setting.upsert_model_tab_title(db, db_obj=settings, payload=payload)
    except ValueError as exc:
        raise bad_request(
            code="SETTINGS_LAYOUT_INVALID",
            message=str(exc),
            request_id=_request_id(request),
        ) from exc
