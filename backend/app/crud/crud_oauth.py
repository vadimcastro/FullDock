from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.oauth_account import OAuthAccount
from app.models.user import User
from app.core.hashing import get_password_hash
from app.core.config import settings
from typing import Optional
import secrets


class CRUDOAuthAccount:
    def get_by_provider(self, db: Session, *, provider: str, provider_user_id: str) -> Optional[OAuthAccount]:
        return (
            db.query(OAuthAccount)
            .filter(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_user_id == provider_user_id,
            )
            .first()
        )

    def create_or_update(
        self,
        db: Session,
        *,
        user: User,
        provider: str,
        provider_user_id: str,
        provider_email: str | None,
        access_token: str,
        refresh_token: str | None,
        expires_in: int | None,
    ) -> OAuthAccount:
        account = self.get_by_provider(db, provider=provider, provider_user_id=provider_user_id)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in else None
        if not account:
            account = OAuthAccount(
                user_id=user.id,
                provider=provider,
                provider_user_id=provider_user_id,
                provider_email=provider_email,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at,
            )
            db.add(account)
        else:
            account.provider_email = provider_email
            account.access_token = access_token
            account.refresh_token = refresh_token
            account.expires_at = expires_at
        db.commit()
        db.refresh(account)
        return account

    def get_or_create_user(
        self, db: Session, *, email: str, name: str | None, provider: str
    ) -> User:
        user = db.query(User).filter(User.email == email).first()
        is_admin = (email.lower() == settings.ADMIN_EMAIL.lower())
        if user:
            if is_admin and not user.is_superuser:
                user.is_superuser = True
                user.role = "admin"
                db.add(user)
                db.commit()
                db.refresh(user)
            return user

        username_base = email.split("@")[0]
        username = f"{username_base}-{provider}"
        count = 1
        while db.query(User).filter(User.username == username).first():
            count += 1
            username = f"{username_base}-{provider}-{count}"

        hashed_password = get_password_hash(secrets.token_urlsafe(32))
        user = User(
            email=email,
            username=username,
            name=name,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=is_admin,
            role="admin" if is_admin else None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


crud_oauth_account = CRUDOAuthAccount()
