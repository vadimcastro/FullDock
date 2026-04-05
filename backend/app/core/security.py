# app/core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.auth_protection import auth_protection
from app.crud.crud_user import crud_user
import logging

logger = logging.getLogger(__name__)

def _utcnow() -> datetime:
    return datetime.utcnow()


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    try:
        logger.debug(f"Creating access token for user data: {data}")
        to_encode = data.copy()
        now = _utcnow()
        expire_minutes = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
        expire = now + timedelta(minutes=expire_minutes)
        to_encode.update(
            {
                "exp": expire,
                "iat": int(now.timestamp()),
                "type": "access",
            }
        )
        
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        
        logger.debug("Token created successfully")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise

def create_refresh_token(data: dict, session_id: str, expires_days: int | None = None) -> str:
    to_encode = data.copy()
    now = _utcnow()
    expire = now + timedelta(days=expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update(
        {
            "exp": expire,
            "iat": int(now.timestamp()),
            "type": "refresh",
            "sid": session_id,
        }
    )
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        logger.debug(f"Decoding token: {token[:10]}...")
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        logger.debug(f"Token decoded successfully")
        return payload
    except JWTError as e:
        logger.error(f"Token decode error: {str(e)}")
        return None

def get_user_from_token(token: str, db: Session):
    try:
        payload = decode_token(token)
        if not payload:
            logger.warning("Invalid token payload")
            return None

        email: str = payload.get("sub")
        if not email:
            logger.warning("No email in token payload")
            return None
        if payload.get("type") != "access":
            logger.warning("Token type is not access")
            return None
        issued_at = int(payload.get("iat") or 0)
        if auth_protection.is_token_revoked(email, issued_at):
            logger.warning("Token rejected due to revoke-all checkpoint")
            return None

        user = crud_user.get_by_email(db, email=email)
        if not user:
            logger.warning(f"No user found for email: {email}")
            return None
            
        logger.debug(f"Successfully retrieved user from token: {email}")
        return user
            
    except Exception as e:
        logger.error(f"Error in get_user_from_token: {str(e)}")
        return None
