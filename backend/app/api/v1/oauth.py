from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
import httpx
import secrets
from secrets import compare_digest
import logging

from app.core.config import settings
from app.core.api_errors import bad_request
from app.core.security import create_access_token, create_refresh_token
from app.core.auth_protection import auth_protection, auth_event
from app.db.utils import get_db
from app.crud.crud_oauth import crud_oauth_account
from uuid import uuid4

logger = logging.getLogger(__name__)

router = APIRouter()

PROVIDER_CONFIG = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scope": "openid email profile",
        "response_type": "code",
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "scope": "user:email",
        "response_type": "code",
    },
}

PROVIDER_CLIENTS = {
    "google": ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
    "github": ("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"),
}


def _build_redirect_uri(provider: str) -> str:
    base = settings.OAUTH_REDIRECT_BASE.rstrip("/")
    return f"{base}/{provider}/callback"


def _get_provider_credentials(provider: str) -> tuple[str, str]:
    client_env, secret_env = PROVIDER_CLIENTS[provider]
    client_id = getattr(settings, client_env)
    client_secret = getattr(settings, secret_env)
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=400,
            detail=f"OAuth credentials not configured for provider: {provider}",
        )
    return client_id, client_secret


def _oauth_state_cookie_name(provider: str) -> str:
    return f"oauth_state_{provider}"


@router.get("/{provider}")
@router.get("/oauth/{provider}", include_in_schema=False)
async def oauth_redirect(provider: str):
    if provider not in PROVIDER_CONFIG:
        raise HTTPException(status_code=404, detail="Unknown provider")

    config = PROVIDER_CONFIG[provider]
    client_id, _ = _get_provider_credentials(provider)
    state = secrets.token_urlsafe(24)
    params = {
        "response_type": config["response_type"],
        "client_id": client_id,
        "scope": config["scope"],
        "redirect_uri": _build_redirect_uri(provider),
        "state": state,
    }
    if provider == "google":
        params["access_type"] = "offline"
        params["prompt"] = "consent"

    auth_url = httpx.URL(config["auth_url"]).copy_with(params=params)
    response = RedirectResponse(url=str(auth_url))
    response.set_cookie(
        key=_oauth_state_cookie_name(provider),
        value=state,
        max_age=600,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )
    return response


@router.get("/{provider}/callback")
@router.get("/oauth/{provider}/callback", include_in_schema=False)
async def oauth_callback(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
):
    request_id = getattr(request.state, "request_id", None)
    if provider not in PROVIDER_CONFIG:
        raise HTTPException(status_code=404, detail="Unknown provider")

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    expected_state = request.cookies.get(_oauth_state_cookie_name(provider))
    if not state or not expected_state or not compare_digest(state, expected_state):
        raise bad_request(
            code="INVALID_OAUTH_STATE",
            message="Invalid OAuth state",
            request_id=request_id,
        )
    if not code:
        raise bad_request(
            code="MISSING_AUTHORIZATION_CODE",
            message="Missing authorization code",
            request_id=request_id,
        )

    config = PROVIDER_CONFIG[provider]
    client_id, client_secret = _get_provider_credentials(provider)
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": _build_redirect_uri(provider),
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            config["token_url"], data=token_data, headers=headers, timeout=30
        )
        if token_resp.status_code >= 400:
            raise HTTPException(
                status_code=token_resp.status_code,
                detail="Failed to fetch OAuth tokens",
            )
        tokens = token_resp.json()

        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in")

        if not access_token:
            raise bad_request(
                code="MISSING_PROVIDER_ACCESS_TOKEN",
                message="Missing access token",
                request_id=request_id,
            )

        user_headers = {"Authorization": f"Bearer {access_token}"}
        user_resp = await client.get(
            config["userinfo_url"], headers=user_headers, timeout=30
        )
        if user_resp.status_code >= 400:
            raise HTTPException(
                status_code=user_resp.status_code,
                detail="Failed to fetch user information",
            )
        user_info = user_resp.json()

        if provider == "github" and not user_info.get("email"):
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {access_token}", "Accept": "application/vnd.github+json"},
                timeout=30,
            )
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                if emails:
                    primary = next((item for item in emails if item.get("primary")), emails[0])
                    user_info["email"] = primary.get("email")

        provider_user_id = str(user_info.get("sub") or user_info.get("id") or "")
        if not provider_user_id:
            raise bad_request(
                code="MISSING_PROVIDER_USER_ID",
                message="Provider user id missing",
                request_id=request_id,
            )

        provider_email = user_info.get("email")
        user_name = user_info.get("name") or provider_email or provider_user_id

        user = crud_oauth_account.get_or_create_user(
            db,
            email=provider_email or f"{provider_user_id}@{provider}.local",
            name=user_name,
            provider=provider,
        )

        crud_oauth_account.create_or_update(
            db,
            user=user,
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=provider_email,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
        )

        session_id = uuid4().hex
        access_jwt = create_access_token(data={"sub": user.email})
        refresh_jwt = create_refresh_token(data={"sub": user.email}, session_id=session_id)
        ip_address = request.client.host if request.client else "unknown"
        auth_protection.register_login_success(ip_address, user.email)
        auth_protection.store_refresh_session(
            session_id=session_id,
            identity=user.email,
            ttl_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )
        auth_event(
            event="oauth_login",
            success=True,
            ip_address=request.client.host if request.client else "unknown",
            identity=user.email,
            user_agent=request.headers.get("user-agent", ""),
        )

        html = f"""
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Signing in</title>
          </head>
          <body>
            <script>
              function setCookie(name, value, maxAge) {{
                document.cookie = `${{name}}=${{encodeURIComponent(value)}}; path=/; max-age=${{maxAge}};`;
              }}
              setCookie('accessToken', '{access_jwt}', {settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60});
              setCookie('refreshToken', '{refresh_jwt}', {settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60});
              window.location.href = "{settings.OAUTH_POST_LOGIN_URL}";
            </script>
            <noscript>Your browser must support JavaScript to complete sign-in.</noscript>
          </body>
        </html>
        """
        response = HTMLResponse(content=html)
        response.delete_cookie(
            key=_oauth_state_cookie_name(provider),
            httponly=True,
            secure=settings.is_production,
            samesite="lax",
        )
        return response
