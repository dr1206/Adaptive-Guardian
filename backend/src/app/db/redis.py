from __future__ import annotations

import redis.asyncio as aioredis

from app.config import settings

_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(settings.redis_uri, decode_responses=True, protocol=2)
    return _pool


async def close_redis() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def set_otp(challenge_id: str, code: str, ttl: int | None = None) -> None:
    redis = await get_redis()
    await redis.setex(f"otp:{challenge_id}", ttl or settings.otp_ttl_seconds, code)


async def get_otp(challenge_id: str) -> str | None:
    redis = await get_redis()
    return await redis.get(f"otp:{challenge_id}")


async def delete_otp(challenge_id: str) -> None:
    redis = await get_redis()
    await redis.delete(f"otp:{challenge_id}")


async def increment_otp_attempts(challenge_id: str) -> int:
    redis = await get_redis()
    key = f"otp_attempts:{challenge_id}"
    count = await redis.incr(key)
    await redis.expire(key, settings.otp_ttl_seconds)
    return count


async def blacklist_token(jti: str, ttl: int) -> None:
    redis = await get_redis()
    await redis.setex(f"bl:{jti}", ttl, "1")


async def is_token_blacklisted(jti: str) -> bool:
    redis = await get_redis()
    return await redis.exists(f"bl:{jti}") > 0


async def cache_risk_score(session_id: str, score: dict, ttl: int = 120) -> None:
    import json
    redis = await get_redis()
    await redis.setex(f"risk:{session_id}", ttl, json.dumps(score))


async def get_cached_risk_score(session_id: str) -> dict | None:
    import json
    redis = await get_redis()
    data = await redis.get(f"risk:{session_id}")
    return json.loads(data) if data else None
