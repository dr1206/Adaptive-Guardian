"""Notification schemas — camelCase via serialization_alias."""

from __future__ import annotations

from pydantic import BaseModel, Field


class NotificationItem(BaseModel):
    id: str
    type: str  # security, banking, insight, system
    severity: str  # info, warn, critical
    title: str
    body: str
    action_label: str | None = Field(None, serialization_alias="actionLabel")
    action_path: str | None = Field(None, serialization_alias="actionPath")
    read: bool = False
    created_at: str = Field(serialization_alias="createdAt")


class NotificationInbox(BaseModel):
    notifications: list[NotificationItem] = Field(serialization_alias="items")
    total: int
    unread: int = Field(serialization_alias="unreadCount")


class NotificationPreferences(BaseModel):
    channels: list[str]  # email, sms, push, slack
    categories: dict[str, bool]  # security, banking, insight, system
    quiet_hours_enabled: bool = Field(serialization_alias="quietHoursEnabled")
    quiet_start: str = Field(serialization_alias="quietStart")
    quiet_end: str = Field(serialization_alias="quietEnd")


class PreferenceUpdateRequest(BaseModel):
    model_config = {"populate_by_name": True}
    channels: list[str] | None = None
    categories: dict[str, bool] | None = None
    quiet_hours_enabled: bool | None = Field(None, validation_alias="quietHoursEnabled")
    quiet_start: str | None = Field(None, validation_alias="quietStart")
    quiet_end: str | None = Field(None, validation_alias="quietEnd")
