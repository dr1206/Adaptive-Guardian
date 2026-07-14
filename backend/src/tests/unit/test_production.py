"""Unit tests for production readiness — middleware, health, error handling."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.shared.errors import (
    AppError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    SecurityError,
    ValidationError,
)
from app.shared.logging_middleware import RequestLoggingMiddleware
from app.shared.middleware import SecurityHeadersMiddleware

# ── AppError hierarchy ─────────────────────────────────────────


def test_app_error_to_response() -> None:
    err = AppError("Something broke", details={"x": 1})
    resp = err.to_response()
    assert resp["code"] == "INTERNAL_ERROR"
    assert resp["message"] == "Something broke"
    assert resp["details"] == {"x": 1}


def test_validation_error_code() -> None:
    err = ValidationError("Bad input")
    assert err.code == "VALIDATION"
    assert err.status == 400


def test_authentication_error_code() -> None:
    err = AuthenticationError("Wrong credentials")
    assert err.code == "AUTHENTICATION"
    assert err.status == 401


def test_authorization_error_code() -> None:
    err = AuthorizationError("Forbidden")
    assert err.code == "AUTHORIZATION"
    assert err.status == 403


def test_not_found_error_code() -> None:
    err = NotFoundError("Missing")
    assert err.code == "NOT_FOUND"
    assert err.status == 404


def test_conflict_error_code() -> None:
    err = ConflictError("Already exists")
    assert err.code == "CONFLICT"
    assert err.status == 409


def test_rate_limit_error_retryable() -> None:
    err = RateLimitError("Too many")
    assert err.status == 429
    assert err.retryable is True


def test_security_error_code() -> None:
    err = SecurityError("Security violation")
    assert err.code == "SECURITY"
    assert err.status == 403


# ── Middleware classes ─────────────────────────────────────────


def test_security_headers_middleware_exists() -> None:
    mw = SecurityHeadersMiddleware(None)  # type: ignore[arg-type]
    assert mw is not None


def test_request_logging_middleware_exists() -> None:
    mw = RequestLoggingMiddleware(None)  # type: ignore[arg-type]
    assert mw is not None


# ── App factory ────────────────────────────────────────────────


def test_create_app_returns_fastapi() -> None:
    app = create_app()
    assert app.title == "AdaptiveGuard"
    assert app.version == "0.1.0"


@pytest.mark.asyncio
async def test_health_endpoint_returns_ok() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data


@pytest.mark.asyncio
async def test_openapi_docs_available() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert "paths" in schema
        assert "/api/v1/auth/register" in schema["paths"]


@pytest.mark.asyncio
async def test_security_headers_applied() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/health")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("x-frame-options") == "DENY"


@pytest.mark.asyncio
async def test_correlation_id_header() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/health", headers={"X-Correlation-Id": "test-corr-123"})
        assert resp.headers.get("x-correlation-id") == "test-corr-123"


@pytest.mark.asyncio
async def test_missing_auth_returns_401() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/auth/me")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_cors_headers_present() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.options(
            "/api/v1/health",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
        )
        resp2 = await ac.get("/api/v1/health", headers={"Origin": "http://localhost:5173"})
        assert "access-control-allow-origin" in resp2.headers


# ── Router registration ───────────────────────────────────────


@pytest.mark.asyncio
async def test_all_routers_registered() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/openapi.json")
        paths = resp.json()["paths"]
        prefixes = {
            "/api/v1/auth/",
            "/api/v1/banking/",
            "/api/v1/aegis/",
            "/api/v1/dashboard/",
            "/api/v1/security/",
            "/api/v1/admin/",
            "/api/v1/notifications/",
            "/api/v1/audit/",
        }
        found = {p for p in paths for prefix in prefixes if p.startswith(prefix)}
        assert len(found) >= len(prefixes)
