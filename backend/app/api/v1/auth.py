# app/api/v1/auth.py
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.utils import get_db
from app.crud.crud_user import crud_user
from app.core.auth_protection import auth_event, auth_protection
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    get_user_from_token,
)
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserCreate(BaseModel):
    email: str
    password: str
    username: str | None = None
    name: str | None = None


class ResetPasswordRequest(BaseModel):
    email: str


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str

@router.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    identity = form_data.username.strip().lower()
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    logger.info(f"Login attempt for user: {identity}")
    
    try:
        if auth_protection.login_blocked(ip_address, identity):
            auth_event(
                event="login_blocked",
                success=False,
                ip_address=ip_address,
                identity=identity,
                user_agent=user_agent,
                reason="lockout",
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Incorrect email or password",
            )

        user = crud_user.authenticate(
            db, 
            email=identity, 
            password=form_data.password
        )
        
        if not user:
            auth_protection.register_login_failure(ip_address, identity)
            auth_event(
                event="login_failed",
                success=False,
                ip_address=ip_address,
                identity=identity,
                user_agent=user_agent,
                reason="invalid_credentials",
            )
            logger.warning(f"Authentication failed for user: {identity}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
           
        session_id = str(uuid4())
        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(data={"sub": user.email}, session_id=session_id)
        auth_protection.register_login_success(ip_address, identity)
        auth_protection.store_refresh_session(
            session_id=session_id,
            identity=user.email,
            ttl_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )
        auth_event(
            event="login_success",
            success=True,
            ip_address=ip_address,
            identity=user.email,
            user_agent=user_agent,
        )
        logger.info("Access token created successfully")
            
        logger.info(f"Login successful for user: {identity}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

@router.post("/register")
async def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    user = crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = crud_user.create(db, obj_in=user_in.model_dump())
    
    session_id = str(uuid4())
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email}, session_id=session_id)
    
    auth_protection.store_refresh_session(
        session_id=session_id,
        identity=user.email,
        ttl_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh")
async def refresh_token(
    request: Request,
    payload: RefreshTokenRequest,
):
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    try:
        token_payload = decode_token(payload.refresh_token)
        if not token_payload or token_payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        email = (token_payload.get("sub") or "").strip().lower()
        session_id = token_payload.get("sid")
        issued_at = int(token_payload.get("iat") or 0)
        if not email or not session_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        if auth_protection.is_token_revoked(email, issued_at):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        if not auth_protection.refresh_session_valid(session_id, email):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        auth_protection.revoke_refresh_session(session_id)
        next_session_id = str(uuid4())
        access_token = create_access_token(data={"sub": email})
        refresh_token_value = create_refresh_token(data={"sub": email}, session_id=next_session_id)
        auth_protection.store_refresh_session(
            session_id=next_session_id,
            identity=email,
            ttl_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )
        auth_event(
            event="token_refresh",
            success=True,
            ip_address=ip_address,
            identity=email,
            user_agent=user_agent,
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
        }
    except HTTPException:
        auth_event(
            event="token_refresh",
            success=False,
            ip_address=ip_address,
            identity="unknown",
            user_agent=user_agent,
            reason="invalid_refresh",
        )
        raise
    except Exception as exc:
        logger.error(f"Refresh token error: {exc}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.post("/logout")
async def logout(
    request: Request,
    payload: RefreshTokenRequest,
):
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    identity = "unknown"
    try:
        token_payload = decode_token(payload.refresh_token)
        if token_payload and token_payload.get("type") == "refresh":
            identity = (token_payload.get("sub") or "").strip().lower()
            sid = token_payload.get("sid")
            if sid:
                auth_protection.revoke_refresh_session(sid)
        auth_event(
            event="logout",
            success=True,
            ip_address=ip_address,
            identity=identity,
            user_agent=user_agent,
        )
        return {"status": "ok"}
    except Exception as exc:
        logger.error(f"Logout error: {exc}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Logout failed")

@router.post("/logout-all")
async def logout_all(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    auth_protection.revoke_all_for_identity(user.email)
    auth_event(
        event="logout_all",
        success=True,
        ip_address=ip_address,
        identity=user.email,
        user_agent=user_agent,
    )
    return {"status": "ok"}
    
@router.get("/me")
async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        user = get_user_from_token(token, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
            
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser
        }
        
    except Exception as e:
        logger.error(f"Error in /me endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.post("/reset-password-request")
async def reset_password_request(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    user = crud_user.get_by_email(db, email=email)

    # Always return a generic success shape to avoid user enumeration.
    response: dict[str, str] = {
        "status": "ok",
        "detail": "If an account exists with this email, reset instructions have been generated.",
    }
    if not user:
        return response

    token = create_password_reset_token(email)
    logger.info("Generated password reset token for user: %s", email)

    # Dev convenience: expose reset link/token only outside production.
    if not settings.is_production:
        response["reset_token"] = token
        response["reset_url"] = f"{settings.OAUTH_POST_LOGIN_URL.rstrip('/')}/reset-password?token={token}"

    return response


@router.post("/reset-password-confirm")
async def reset_password_confirm(
    payload: ResetPasswordConfirm,
    db: Session = Depends(get_db),
):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters.")

    token_payload = decode_token(payload.token)
    if not token_payload or token_payload.get("type") != "password_reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    email = (token_payload.get("sub") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token.")

    user = crud_user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token.")

    crud_user.update_password(db, user=user, new_password=payload.new_password)
    auth_protection.revoke_all_for_identity(user.email)
    return {"status": "ok", "detail": "Password has been reset successfully."}
