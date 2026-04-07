from __future__ import annotations

import logging
from threading import Lock
from typing import Optional

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpsMetrics:
    def __init__(self) -> None:
        self._redis: Optional[redis.Redis] = None
        self._lock = Lock()
        self._in_memory: dict[str, int] = {}

    def _client(self) -> Optional[redis.Redis]:
        if self._redis is not None:
            return self._redis
        if not settings.REDIS_URL:
            return None
        try:
            self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as exc:
            logger.warning("Unable to initialize ops metrics redis client: %s", exc)
            self._redis = None
        return self._redis

    def incr(self, key: str, amount: int = 1) -> None:
        safe_key = (key or "unknown").strip().lower()[:120]
        if not safe_key:
            return

        client = self._client()
        if client is not None:
            try:
                client.hincrby("ops:metrics:counters", safe_key, amount)
                return
            except Exception as exc:
                logger.warning("ops metrics redis increment failed: %s", exc)

        with self._lock:
            self._in_memory[safe_key] = self._in_memory.get(safe_key, 0) + amount

    def snapshot(self, *, prefix: str = "", limit: int = 100) -> dict[str, int]:
        safe_prefix = prefix.strip().lower()
        client = self._client()
        rows: dict[str, int] = {}

        if client is not None:
            try:
                raw = client.hgetall("ops:metrics:counters")
                for key, value in raw.items():
                    if safe_prefix and not key.startswith(safe_prefix):
                        continue
                    rows[key] = int(value)
            except Exception as exc:
                logger.warning("ops metrics redis snapshot failed: %s", exc)

        if not rows:
            with self._lock:
                for key, value in self._in_memory.items():
                    if safe_prefix and not key.startswith(safe_prefix):
                        continue
                    rows[key] = value

        items = sorted(rows.items(), key=lambda item: (-item[1], item[0]))
        return dict(items[: max(1, limit)])


ops_metrics = OpsMetrics()
