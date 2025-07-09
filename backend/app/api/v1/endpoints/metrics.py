# app/api/v1/endpoints/metrics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
from app.db.session import SessionLocal
from app.core.security import get_user_from_token
from fastapi.security import OAuth2PasswordBearer
from app.crud import crud_metrics
from fastapi_cache.decorator import cache

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/visitors")
@cache(expire=300)  # Cache for 5 minutes
async def get_visitor_metrics(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_visitor_metrics(db)

@router.get("/sessions")
@cache(expire=60)  # Cache for 1 minute
async def get_session_metrics(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_session_metrics(db)

@router.get("/users")
@cache(expire=300)
async def get_user_metrics(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_user_metrics(db)

@router.get("/recent-activity")
@cache(expire=60)
async def get_recent_activity(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    limit: int = 5
) -> List:
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_recent_activity(db, limit)


@router.get("/system")
@cache(expire=60)  # Cache for 1 minute
async def get_system_metrics(
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, get_db().__next__())
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_system_metrics()

@router.get("/network")
@cache(expire=60)  # Cache for 1 minute
async def get_network_metrics(
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, get_db().__next__())
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_network_metrics()

@router.get("/health")
@cache(expire=30)  # Cache for 30 seconds
async def get_application_health(
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, get_db().__next__())
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_application_health()

@router.get("/deployment")
@cache(expire=300)  # Cache for 5 minutes
async def get_deployment_info(
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, get_db().__next__())
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_deployment_info()

@router.get("/disk")
@cache(expire=300)  # Cache for 5 minutes
async def get_disk_metrics(
    token: str = Depends(oauth2_scheme)
) -> Dict:
    user = get_user_from_token(token, get_db().__next__())
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return crud_metrics.get_disk_metrics()