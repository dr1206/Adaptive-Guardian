from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, Request, Response

from app.api.deps import get_current_user
from app.config import settings
from app.domain.auth import service
from app.domain.auth.schemas import (
    DeviceListResponse,
    DeviceUpdateRequest,
    EnrollmentReceipt,
    EnrollmentRequest,
    LoginHistoryResponse,
    LoginRequest,
    Me,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetVerify,
    ProfileUpdateRequest,
    RegisterRequest,
    RegistrationPending,
    SessionListResponse,
    VerifyOtpRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_KEY = "refresh_token"


# ── Helpers ───────────────────────────────────────────────────

def _set_refresh_cookie(response: Response, raw_refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_KEY,
        value=raw_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.refresh_token_ttl_days * 86400,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_KEY, path="/api/v1/auth")


def _get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def _get_user_agent(request: Request) -> str | None:
    return request.headers.get("User-Agent")


# ── Registration ──────────────────────────────────────────────


@router.post("/register", response_model=RegistrationPending, status_code=202)
async def register(data: RegisterRequest):
    return await service.register(data)


@router.post("/verify-otp", status_code=200)
async def verify_otp(data: VerifyOtpRequest, request: Request, response: Response):
    session, raw_refresh = await service.verify_otp(data, ip_address=_get_client_ip(request))
    _set_refresh_cookie(response, raw_refresh)
    return session


# ── Login / Logout ────────────────────────────────────────────


@router.post("/login", status_code=200)
async def login(data: LoginRequest, request: Request, response: Response):
    session, raw_refresh = await service.login(data, ip_address=_get_client_ip(request))
    _set_refresh_cookie(response, raw_refresh)
    return session


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(None, alias=REFRESH_COOKIE_KEY),
):
    await service.logout(refresh_token)
    _clear_refresh_cookie(response)


# ── Token Refresh ─────────────────────────────────────────────


@router.post("/refresh", status_code=200)
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(None, alias=REFRESH_COOKIE_KEY),
):
    session, raw_refresh = await service.refresh(refresh_token or "", ip_address=_get_client_ip(request))
    _set_refresh_cookie(response, raw_refresh)
    return session


# ── Current User ──────────────────────────────────────────────


@router.get("/me", response_model=Me)
async def me(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_me(UUID(current_user["sub"]))


@router.patch("/me", response_model=Me)
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.update_profile(UUID(current_user["sub"]), data)


# ── Password Reset ────────────────────────────────────────────


@router.post("/password-reset", status_code=202)
async def request_password_reset(data: PasswordResetRequest):
    return await service.request_password_reset(data)


@router.post("/password-reset/verify", status_code=202)
async def verify_password_reset(data: PasswordResetVerify):
    return await service.verify_password_reset(data)


@router.post("/password-reset/confirm", status_code=204)
async def confirm_password_reset(data: PasswordResetConfirm):
    await service.confirm_password_reset(data)


# ── Sessions ──────────────────────────────────────────────────


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_sessions(
        UUID(current_user["sub"]),
        current_session_id=UUID(current_user.get("sid")) if current_user.get("sid") else None,
    )


@router.delete("/sessions/{session_id}", status_code=204)
async def revoke_session(
    session_id: UUID,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    await service.revoke_session_by_id(UUID(current_user["sub"]), session_id)


# ── Devices ───────────────────────────────────────────────────


@router.get("/devices", response_model=DeviceListResponse)
async def list_devices(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_devices(UUID(current_user["sub"]))


@router.patch("/devices/{device_id}", status_code=200)
async def update_device(
    device_id: str,
    data: DeviceUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.update_device(UUID(current_user["sub"]), device_id, data)


# ── Enrollment ────────────────────────────────────────────────


@router.post("/enrollment", response_model=EnrollmentReceipt, status_code=201)
async def submit_enrollment(
    data: EnrollmentRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.submit_enrollment(UUID(current_user["sub"]), data)


# ── Login History ─────────────────────────────────────────────


@router.get("/login-history", response_model=LoginHistoryResponse)
async def login_history(
    limit: int = 50,
    offset: int = 0,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_login_history(UUID(current_user["sub"]), limit=limit, offset=offset)


# ── Risk Score (AI integration point) ─────────────────────────


@router.get("/sessions/{session_id}/risk", status_code=200)
async def get_session_risk(
    session_id: UUID,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_session_risk(session_id)
