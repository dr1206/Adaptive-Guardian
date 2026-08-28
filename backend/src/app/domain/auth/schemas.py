from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

# ── Registration ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    model_config = {"populate_by_name": True}
    email: EmailStr
    password: str = Field(min_length=12)
    full_name: str = Field(min_length=2, max_length=120, validation_alias="fullName")


class RegistrationPending(BaseModel):
    challenge_id: UUID = Field(serialization_alias="challengeId")
    expires_at: datetime = Field(serialization_alias="expiresAt")


class VerifyOtpRequest(BaseModel):
    model_config = {"populate_by_name": True}
    challenge_id: UUID = Field(validation_alias="challengeId")
    code: str = Field(pattern=r"^[0-9]{6}$")


# ── Login / Tokens ────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Me(BaseModel):
    id: UUID
    email: str
    full_name: str = Field(serialization_alias="fullName")
    roles: list[str]
    enrollment_status: str = Field(serialization_alias="enrollmentStatus")


class AuthSession(BaseModel):
    access_token: str = Field(serialization_alias="accessToken")
    expires_in: int = Field(serialization_alias="expiresIn")  # seconds
    session_id: UUID = Field(serialization_alias="sessionId")
    user: Me


# ── Password Reset ────────────────────────────────────────────

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetPending(BaseModel):
    challenge_id: UUID = Field(serialization_alias="challengeId")
    expires_at: datetime = Field(serialization_alias="expiresAt")


class PasswordResetVerify(BaseModel):
    model_config = {"populate_by_name": True}
    challenge_id: UUID = Field(validation_alias="challengeId")
    code: str = Field(pattern=r"^[0-9]{6}$")


class PasswordResetConfirm(BaseModel):
    model_config = {"populate_by_name": True}
    challenge_id: UUID = Field(validation_alias="challengeId")
    new_password: str = Field(min_length=12, validation_alias="newPassword")


# ── Sessions ──────────────────────────────────────────────────

class SessionInfo(BaseModel):
    session_id: UUID = Field(serialization_alias="sessionId")
    device_id: str | None = Field(None, serialization_alias="deviceId")
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    user_agent: str | None = Field(None, serialization_alias="userAgent")
    is_current: bool = Field(serialization_alias="isCurrent")
    last_active_at: datetime = Field(serialization_alias="lastActiveAt")
    created_at: datetime = Field(serialization_alias="createdAt")


class SessionListResponse(BaseModel):
    sessions: list[SessionInfo]
    total: int


# ── Devices ───────────────────────────────────────────────────

class DeviceInfo(BaseModel):
    device_id: str = Field(serialization_alias="deviceId")
    label: str
    user_agent: str | None = Field(None, serialization_alias="userAgent")
    is_trusted: bool = Field(serialization_alias="isTrusted")
    first_seen_at: datetime = Field(serialization_alias="firstSeenAt")
    last_seen_at: datetime = Field(serialization_alias="lastSeenAt")


class DeviceListResponse(BaseModel):
    devices: list[DeviceInfo]


class DeviceUpdateRequest(BaseModel):
    model_config = {"populate_by_name": True}
    label: str | None = None
    is_trusted: bool | None = Field(None, validation_alias="isTrusted")


# ── Profile ───────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    model_config = {"populate_by_name": True}
    full_name: str | None = Field(None, min_length=2, max_length=120, validation_alias="fullName")


# ── Enrollment ────────────────────────────────────────────────

class KeyboardSample(BaseModel):
    model_config = {"populate_by_name": True}
    hold_times_ms: list[float] = Field(validation_alias="holdTimesMs")
    flight_times_ms: list[float] = Field(validation_alias="flightTimesMs")
    rhythm_hash: str = Field(validation_alias="rhythmHash")


class MouseSample(BaseModel):
    model_config = {"populate_by_name": True}
    velocity_profile: list[float] = Field(validation_alias="velocityProfile")
    curvature_profile: list[float] = Field(validation_alias="curvatureProfile")
    jerk_profile: list[float] = Field(validation_alias="jerkProfile")


class SessionMeta(BaseModel):
    model_config = {"populate_by_name": True}
    user_agent: str = Field(validation_alias="userAgent")
    viewport: str
    timezone: str


class EnrollmentRequest(BaseModel):
    model_config = {"populate_by_name": True}
    keyboard: KeyboardSample
    mouse: MouseSample
    session_meta: SessionMeta = Field(validation_alias="sessionMeta")


class EnrollmentReceipt(BaseModel):
    baseline_id: UUID = Field(serialization_alias="baselineId")
    created_at: datetime = Field(serialization_alias="createdAt")
    confidence: float


# ── Login History ─────────────────────────────────────────────

class LoginHistoryEvent(BaseModel):
    event: str
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    user_agent: str | None = Field(None, serialization_alias="userAgent")
    device_id: str | None = Field(None, serialization_alias="deviceId")
    created_at: datetime = Field(serialization_alias="createdAt")


class LoginHistoryResponse(BaseModel):
    events: list[LoginHistoryEvent]
    total: int


# ── Error ─────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: dict = Field(default_factory=dict)
