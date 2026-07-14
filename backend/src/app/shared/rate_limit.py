from __future__ import annotations

import time

import redis.asyncio as aioredis

from app.config import settings
from app.shared.errors import RateLimitError


class RateLimiter:
    def __init__(self) -> None:
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(settings.redis_uri, decode_responses=True)
        return self._redis

    async def is_allowed(
        self,
        key: str,
        max_requests: int = settings.rate_limit_requests,
        window_seconds: int = settings.rate_limit_window_seconds,
    ) -> bool:
        redis = await self._get_redis()
        now = time.monotonic()
        window_start = now - window_seconds
        pipe = redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zcard(key)
        pipe.zadd(key, {str(now): now})
        pipe.expire(key, window_seconds)
        _, count, _, _ = await pipe.execute()
        return count < max_requests

    async def require(self, key: str) -> None:
        if not await self.is_allowed(key):
            raise RateLimitError("Too many requests")


rate_limiter = RateLimiter()
