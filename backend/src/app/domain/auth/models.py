from __future__ import annotations

import uuid
from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel


class User(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    email: Indexed(str, unique=True)  # type: ignore[valid-type]
    password_hash: str
    full_name: str
    is_active: bool = True
    is_verified: bool = False
    roles: list[str] = ["user"]
    enrollment_status: str = "pending"
    last_login_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "users"
        indexes = ["roles"]


class Session(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    refresh_token_hash: str
    device_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    expires_at: datetime
    revoked: bool = False
    logged_out_at: datetime | None = None
    last_active_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "sessions"
        indexes = [
            "refresh_token_hash",
            "user_id",
            "device_id",
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]


class OTPChallenge(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    challenge_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID | None = None
    purpose: str = "register"  # register, login, password_reset
    expires_at: datetime
    attempts: int = 0
    verified: bool = False
    consumed_at: datetime | None = None

    class Settings:
        name = "otp_challenges"
        indexes = [
            "challenge_id",
            "user_id",
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]


class Device(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    fingerprint: str
    label: str  # e.g. "Chrome on Windows"
    user_agent: str | None = None
    ip_address: str | None = None
    is_trusted: bool = False
    first_seen_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_seen_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "devices"
        indexes = [
            "user_id",
            "fingerprint",
            IndexModel([("user_id", 1), ("fingerprint", 1)], unique=True),
        ]


class PasswordResetChallenge(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    challenge_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    expires_at: datetime
    attempts: int = 0
    verified: bool = False
    consumed_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "password_reset_challenges"
        indexes = [
            "challenge_id",
            "user_id",
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]


class LoginHistory(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    session_id: uuid.UUID | None = None
    event: str  # login, logout, refresh, failed_login, otp_sent
    ip_address: str | None = None
    user_agent: str | None = None
    device_id: str | None = None
    details: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "login_history"
        indexes = ["user_id", "event", "created_at"]
