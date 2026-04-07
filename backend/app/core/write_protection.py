from __future__ import annotations

import time
import logging
from typing import Optional

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class WriteProtection:
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
            logger.warning("Unable to initialize write protection redis client: %s", exc)
            self._redis = None
        return self._redis

    @staticmethod
    def _key(identity: str, bucket: str, window_epoch: int) -> str:
        return f"write:rate:{identity}:{bucket}:{window_epoch}"

    def hit(self, *, identity: str, bucket: str, per_minute_limit: int) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds)."""
        client = self._client()
        if client is None:
            return True, 0

        safe_identity = (identity or "anonymous").strip().lower()[:128]
        safe_bucket = (bucket or "default").strip().lower().replace(" ", "-")[:64]
        now = int(time.time())
        minute_epoch = now // 60
        key = self._key(safe_identity, safe_bucket, minute_epoch)
        retry_after = max(1, 60 - (now % 60))

        try:
            count = int(client.incr(key))
            if count == 1:
                client.expire(key, retry_after + 1)
            if count > per_minute_limit:
                return False, retry_after
            return True, 0
        except Exception as exc:
            logger.warning("Write rate-limit fallback allow due to redis error: %s", exc)
            return True, 0


write_protection = WriteProtection()
