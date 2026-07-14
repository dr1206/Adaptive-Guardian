"""Notification models — persistent storage for user notifications and preferences."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class Notification(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    type: str  # security, banking, insight, system
    severity: str  # info, warn, critical
    title: str
    body: str
    action_label: str | None = None
    action_path: str | None = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "notifications"
        indexes = [
            "user_id",
            IndexModel([("user_id", 1), ("read", 1)]),
            "created_at",
        ]


class NotificationPreference(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    channels: list[str] = ["push", "email"]  # email, sms, push, slack
    categories: dict[str, bool] = Field(default_factory=lambda: {
        "security": True,
        "banking": True,
        "insight": True,
        "system": True,
    })
    quiet_hours_enabled: bool = False
    quiet_start: str = "22:00"
    quiet_end: str = "07:00"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "notification_preferences"
        indexes = [
            IndexModel([("user_id", 1)], unique=True),
        ]
