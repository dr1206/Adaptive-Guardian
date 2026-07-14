"""Sprint 1 — Authentication & Identity tests."""

from __future__ import annotations

import json

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ── Helpers ───────────────────────────────────────────────────

REGISTER_PAYLOAD = {
    "email": "alice@example.com",
    "password": "securePassword123",
    "fullName": "Alice Tester",
}


def _api_json(response) -> dict:
    return response.json()


async def _register(client: AsyncClient, payload: dict | None = None) -> dict:
    r = await client.post("/api/v1/auth/register", json=payload or REGISTER_PAYLOAD)
    return _api_json(r)


async def _verify_otp(client: AsyncClient, challenge_id: str, code: str = "123456") -> dict:
    r = await client.post("/api/v1/auth/verify-otp", json={"challengeId": challenge_id, "code": code})
    return _api_json(r)


async def _login(client: AsyncClient, email: str = "alice@example.com", password: str = "securePassword123") -> dict:
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return _api_json(r)


async def _get_otp_code(client: AsyncClient, challenge_id: str) -> str:
    """Extract the OTP that was stored in Redis during registration."""
    from app.db.redis import get_otp
    stored = await get_otp(str(challenge_id))
    if stored:
        return json.loads(stored)["code"]
    return "000000"


# ── Registration ──────────────────────────────────────────────


async def test_register_returns_202_with_challenge(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    assert r.status_code == 202
    body = _api_json(r)
    assert "challengeId" in body
    assert "expiresAt" in body


async def test_register_requires_password_min_12_chars(client: AsyncClient):
    payload = {**REGISTER_PAYLOAD, "password": "short"}
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 422


async def test_register_duplicate_returns_409(client: AsyncClient):
    # First user registers and verifies = full account created
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    await _verify_otp(client, reg["challengeId"], code)
    # Second registration with same email should be rejected
    r = await client.post("/api/v1/auth/register", json=REGISTER_PAYLOAD)
    assert r.status_code == 409


# ── OTP Verification ──────────────────────────────────────────


async def test_verify_otp_completes_registration(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    r = await client.post(
        "/api/v1/auth/verify-otp",
        json={"challengeId": reg["challengeId"], "code": code},
    )
    assert r.status_code == 200
    body = _api_json(r)
    assert "accessToken" in body
    assert "user" in body
    assert body["user"]["email"] == "alice@example.com"


async def test_verify_otp_wrong_code_returns_401(client: AsyncClient):
    reg = await _register(client)
    r = await client.post(
        "/api/v1/auth/verify-otp",
        json={"challengeId": reg["challengeId"], "code": "000000"},
    )
    assert r.status_code == 401


async def test_verify_otp_expired_challenge_returns_401(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/verify-otp",
        json={"challengeId": "00000000-0000-0000-0000-000000000000", "code": "123456"},
    )
    assert r.status_code == 401


async def test_verify_otp_invalid_challenge_format_returns_422(client: AsyncClient):
    r = await client.post("/api/v1/auth/verify-otp", json={"challengeId": "not-a-uuid", "code": "123456"})
    assert r.status_code == 422


# ── Login ─────────────────────────────────────────────────────


async def test_login_after_registration(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    await _verify_otp(client, reg["challengeId"], code)

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "securePassword123"},
    )
    assert r.status_code == 200
    body = _api_json(r)
    assert "accessToken" in body
    assert body["user"]["email"] == "alice@example.com"


async def test_login_wrong_password_returns_401(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    await _verify_otp(client, reg["challengeId"], code)

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword1"},
    )
    assert r.status_code == 401


async def test_login_nonexistent_user_returns_401(client: AsyncClient):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@example.com", "password": "whatever12345"},
    )
    assert r.status_code == 401


# ── Token Refresh ─────────────────────────────────────────────


async def test_refresh_with_cookie(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    await _verify_otp(client, reg["challengeId"], code)

    # Login to get the refresh cookie
    login_r = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "securePassword123"},
    )
    refresh_cookie = login_r.cookies.get("refresh_token")
    assert refresh_cookie is not None

    # Refresh
    r = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert r.status_code == 200
    body = _api_json(r)
    assert "accessToken" in body


async def test_refresh_without_cookie_returns_401(client: AsyncClient):
    r = await client.post("/api/v1/auth/refresh")
    assert r.status_code == 401


async def test_refresh_with_invalid_cookie_returns_401(client: AsyncClient):
    r = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": "bad-token"})
    assert r.status_code == 401


# ── Logout ────────────────────────────────────────────────────


async def test_logout_clears_cookie(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    await _verify_otp(client, reg["challengeId"], code)

    login_r = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "securePassword123"},
    )
    cookie = login_r.cookies.get("refresh_token")

    r = await client.post("/api/v1/auth/logout", cookies={"refresh_token": cookie})
    assert r.status_code == 204


async def test_logout_without_cookie_succeeds(client: AsyncClient):
    r = await client.post("/api/v1/auth/logout")
    assert r.status_code == 204


# ── Me ────────────────────────────────────────────────────────


async def test_get_me_authenticated(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    result = await _verify_otp(client, reg["challengeId"], code)
    token = result["accessToken"]

    r = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = _api_json(r)
    assert body["email"] == "alice@example.com"
    assert body["roles"] == ["user"]
    assert body["enrollmentStatus"] == "pending"


async def test_get_me_unauthenticated_returns_401(client: AsyncClient):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


# ── Update Profile ────────────────────────────────────────────


async def test_update_profile(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    result = await _verify_otp(client, reg["challengeId"], code)
    token = result["accessToken"]

    r = await client.patch(
        "/api/v1/auth/me",
        json={"fullName": "Alice Updated"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert _api_json(r)["fullName"] == "Alice Updated"


# ── Password Reset ────────────────────────────────────────────


async def test_password_reset_flow(client: AsyncClient):
    # Register and verify first
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    await _verify_otp(client, reg["challengeId"], code)

    # Request reset
    r = await client.post(
        "/api/v1/auth/password-reset",
        json={"email": "alice@example.com"},
    )
    assert r.status_code == 202
    body = _api_json(r)
    assert "challengeId" in body

    # Get OTP from Redis
    from app.db.redis import get_otp
    stored = await get_otp(str(body["challengeId"]))
    actual_code = json.loads(stored)["code"]

    # Verify
    r2 = await client.post(
        "/api/v1/auth/password-reset/verify",
        json={"challengeId": body["challengeId"], "code": actual_code},
    )
    assert r2.status_code == 202
    confirm_challenge = _api_json(r2)["challengeId"]

    # Confirm
    r3 = await client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"challengeId": confirm_challenge, "newPassword": "NewSecurePassword123"},
    )
    assert r3.status_code == 204

    # Verify old password no longer works
    r4 = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "securePassword123"},
    )
    assert r4.status_code == 401

    # New password works
    r5 = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "NewSecurePassword123"},
    )
    assert r5.status_code == 200


async def test_password_reset_nonexistent_user_returns_202(client: AsyncClient):
    """Should not reveal whether email exists."""
    r = await client.post(
        "/api/v1/auth/password-reset",
        json={"email": "ghost@example.com"},
    )
    assert r.status_code == 202


# ── Sessions ──────────────────────────────────────────────────


async def test_list_sessions(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    result = await _verify_otp(client, reg["challengeId"], code)
    token = result["accessToken"]

    r = await client.get("/api/v1/auth/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = _api_json(r)
    assert "sessions" in body
    assert "total" in body


async def test_list_sessions_unauthenticated_returns_401(client: AsyncClient):
    r = await client.get("/api/v1/auth/sessions")
    assert r.status_code == 401


# ── Devices ───────────────────────────────────────────────────


async def test_list_devices_empty(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    result = await _verify_otp(client, reg["challengeId"], code)
    token = result["accessToken"]

    r = await client.get("/api/v1/auth/devices", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = _api_json(r)
    assert body["devices"] == []


# ── Enrollment ────────────────────────────────────────────────


async def test_submit_enrollment(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    result = await _verify_otp(client, reg["challengeId"], code)
    token = result["accessToken"]

    r = await client.post(
        "/api/v1/auth/enrollment",
        json={
            "keyboard": {"holdTimesMs": [120, 150], "flightTimesMs": [80, 90], "rhythmHash": "abc123"},
            "mouse": {
                "velocityProfile": [1.0, 2.0],
                "curvatureProfile": [0.5, 0.6],
                "jerkProfile": [0.1, 0.2],
            },
            "sessionMeta": {"userAgent": "Chrome", "viewport": "1920x1080", "timezone": "UTC"},
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    body = _api_json(r)
    assert "baselineId" in body
    assert "createdAt" in body
    assert isinstance(body["confidence"], float)


# ── Login History ─────────────────────────────────────────────


async def test_login_history(client: AsyncClient):
    reg = await _register(client)
    code = await _get_otp_code(client, reg["challengeId"])
    result = await _verify_otp(client, reg["challengeId"], code)
    token = result["accessToken"]

    r = await client.get("/api/v1/auth/login-history", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = _api_json(r)
    assert "events" in body
    assert "total" in body


# ── Health (sanity check) ─────────────────────────────────────


async def test_health_endpoint(client: AsyncClient):
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
