import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


def _safe_identity(identity: str) -> str:
    return (identity or "").strip().lower()


def _ua_hash(user_agent: str) -> str:
    if not user_agent:
        return "none"
    return hashlib.sha256(user_agent.encode("utf-8")).hexdigest()[:12]


class AuthProtection:
    def __init__(self) -> None:
        self._redis: Optional[redis.Redis] = None

    def _client(self) -> Optional[redis.Redis]:
        if self._redis is not None:
            return self._redis
        if not settings.REDIS_URL:
            return None
        try:
            self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as exc:
            logger.warning("Unable to initialize Redis auth protection: %s", exc)
            self._redis = None
        return self._redis

    def _fail_key(self, key_type: str, key_value: str) -> str:
        return f"auth:fail:{key_type}:{key_value}"

    def _lock_key(self, key_type: str, key_value: str) -> str:
        return f"auth:lock:{key_type}:{key_value}"

    def _refresh_key(self, session_id: str) -> str:
        return f"auth:refresh:{session_id}"

    def _revoke_after_key(self, identity: str) -> str:
        return f"auth:revoke-after:{_safe_identity(identity)}"

    def login_blocked(self, ip_address: str, identity: str) -> bool:
        client = self._client()
        if client is None:
            return False
        identity_key = _safe_identity(identity)
        try:
            return bool(
                client.exists(self._lock_key("ip", ip_address))
                or client.exists(self._lock_key("id", identity_key))
            )
        except Exception as exc:
            logger.warning("Rate-limit lock check failed: %s", exc)
            return False

    def register_login_failure(self, ip_address: str, identity: str) -> None:
        client = self._client()
        if client is None:
            return
        identity_key = _safe_identity(identity)
        try:
            ip_fail_key = self._fail_key("ip", ip_address)
            id_fail_key = self._fail_key("id", identity_key)

            ip_count = client.incr(ip_fail_key)
            id_count = client.incr(id_fail_key)
            client.expire(ip_fail_key, settings.AUTH_FAILED_WINDOW_SECONDS)
            client.expire(id_fail_key, settings.AUTH_FAILED_WINDOW_SECONDS)

            if ip_count >= settings.AUTH_MAX_FAILED_ATTEMPTS:
                client.setex(
                    self._lock_key("ip", ip_address),
                    settings.AUTH_LOCKOUT_SECONDS,
                    "1",
                )
            if id_count >= settings.AUTH_MAX_FAILED_ATTEMPTS:
                client.setex(
                    self._lock_key("id", identity_key),
                    settings.AUTH_LOCKOUT_SECONDS,
                    "1",
                )
        except Exception as exc:
            logger.warning("Failed to register login failure: %s", exc)

    def register_login_success(self, ip_address: str, identity: str) -> None:
        client = self._client()
        if client is None:
            return
        identity_key = _safe_identity(identity)
        try:
            client.delete(
                self._fail_key("ip", ip_address),
                self._fail_key("id", identity_key),
                self._lock_key("ip", ip_address),
                self._lock_key("id", identity_key),
            )
        except Exception as exc:
            logger.warning("Failed to clear login failure counters: %s", exc)

    def store_refresh_session(self, session_id: str, identity: str, ttl_seconds: int) -> None:
        client = self._client()
        if client is None:
            return
        try:
            client.setex(self._refresh_key(session_id), ttl_seconds, _safe_identity(identity))
        except Exception as exc:
            logger.warning("Failed to store refresh session: %s", exc)

    def refresh_session_valid(self, session_id: str, identity: str) -> bool:
        client = self._client()
        if client is None:
            return False
        try:
            stored_identity = client.get(self._refresh_key(session_id))
            return stored_identity == _safe_identity(identity)
        except Exception as exc:
            logger.warning("Failed to validate refresh session: %s", exc)
            return False

    def revoke_refresh_session(self, session_id: str) -> None:
        client = self._client()
        if client is None:
            return
        try:
            client.delete(self._refresh_key(session_id))
        except Exception as exc:
            logger.warning("Failed to revoke refresh session: %s", exc)

    def revoke_all_for_identity(self, identity: str) -> int:
        client = self._client()
        if client is None:
            return 0
        timestamp = int(datetime.now(timezone.utc).timestamp())
        try:
            client.set(self._revoke_after_key(identity), str(timestamp))
        except Exception as exc:
            logger.warning("Failed to set revoke-all checkpoint: %s", exc)
        return timestamp

    def is_token_revoked(self, identity: str, issued_at: int) -> bool:
        client = self._client()
        if client is None:
            return False
        try:
            revoke_after = client.get(self._revoke_after_key(identity))
            if not revoke_after:
                return False
            return issued_at <= int(revoke_after)
        except Exception as exc:
            logger.warning("Failed revoke check: %s", exc)
            return False


def auth_event(
    event: str,
    success: bool,
    ip_address: str,
    identity: str,
    user_agent: str,
    reason: str = "",
) -> None:
    logger.info(
        "auth_event event=%s success=%s ip=%s identity=%s ua_hash=%s reason=%s",
        event,
        success,
        ip_address,
        _safe_identity(identity),
        _ua_hash(user_agent),
        reason or "none",
    )


auth_protection = AuthProtection()
