from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import suppress
from unittest import mock

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.db.mongodb import close_db, init_db
from app.main import create_app


class FakeRedis:
    """In-memory Redis for testing."""

    def __init__(self):
        self._store: dict[str, str] = {}
        self._ttl: dict[str, float] = {}

    async def setex(self, key: str, ttl: int, value: str) -> None:
        self._store[key] = value
        import time
        self._ttl[key] = time.time() + ttl

    async def get(self, key: str) -> str | None:
        import time
        if key in self._ttl and self._ttl[key] < time.time():
            self._store.pop(key, None)
            self._ttl.pop(key, None)
            return None
        return self._store.get(key)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)
        self._ttl.pop(key, None)

    async def incr(self, key: str) -> int:
        val = int(self._store.get(key, "0")) + 1
        self._store[key] = str(val)
        return val

    async def expire(self, key: str, ttl: int) -> None:
        import time
        self._ttl[key] = time.time() + ttl

    async def exists(self, key: str) -> int:
        return 1 if key in self._store else 0

    def pipeline(self):
        return FakePipeline(self)


class FakePipeline:
    def __init__(self, redis: FakeRedis):
        self._redis = redis

    def zremrangebyscore(self, key, min_val, max_val):
        return self

    def zcard(self, key):
        return self

    def zadd(self, key, mapping):
        return self

    async def execute(self):
        import time
        return [0, 0, 1, time.time()]


@pytest.fixture(autouse=True)
def _mock_redis():
    fake = FakeRedis()
    with mock.patch("app.db.redis.get_redis", return_value=fake):
        yield


@pytest.fixture(autouse=True)
async def _init_db():
    original_uri = settings.mongodb_uri
    original_db = settings.mongodb_db_name
    settings.mongodb_uri = "mongodb://localhost:27017"
    settings.mongodb_db_name = "adaptive_guardian_test"
    with suppress(Exception):
        await init_db(clean=True)
    yield
    with suppress(Exception):
        await close_db()
    settings.mongodb_uri = original_uri
    settings.mongodb_db_name = original_db


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
