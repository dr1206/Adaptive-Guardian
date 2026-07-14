"""Notification service — MongoDB-backed inbox + preferences."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.domain.notifications.mock_data import generate_notifications, generate_preferences
from app.domain.notifications.models import Notification, NotificationPreference
from app.domain.notifications.schemas import (
    NotificationInbox,
    NotificationItem,
    NotificationPreferences,
    PreferenceUpdateRequest,
)


def _fmt_dt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


async def get_inbox(
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
) -> NotificationInbox:
    existing = await Notification.find(Notification.user_id == user_id).count()
    if existing == 0:
        items, _, _ = generate_notifications(user_id)
        docs = [
            Notification(
                user_id=user_id,
                type=n["type"],
                severity=n["severity"],
                title=n["title"],
                body=n["body"],
                action_label=n.get("action_label"),
                action_path=n.get("action_path"),
                read=n["read"],
                created_at=datetime.fromisoformat(n["created_at"].replace("Z", "+00:00")),
            )
            for n in items
        ]
        if docs:
            await Notification.insert_many(docs)

    q = Notification.find(Notification.user_id == user_id)
    if unread_only:
        q = q.find(Notification.read == False)
    total = await q.count()
    notifications = await q.sort(-Notification.created_at).skip(offset).limit(limit).to_list()

    unread_total = await Notification.find(Notification.user_id == user_id, Notification.read == False).count()

    return NotificationInbox(
        notifications=[
            NotificationItem(
                id=str(n.id),
                type=n.type,
                severity=n.severity,
                title=n.title,
                body=n.body,
                action_label=n.action_label,
                action_path=n.action_path,
                read=n.read,
                created_at=_fmt_dt(n.created_at),
            )
            for n in notifications
        ],
        total=total,
        unread=unread_total,
    )


async def mark_read(user_id: uuid.UUID, notification_id: str) -> None:
    await Notification.find_one(
        Notification.id == uuid.UUID(notification_id),
        Notification.user_id == user_id,
    ).set({"read": True})


async def mark_all_read(user_id: uuid.UUID) -> None:
    await Notification.find(
        Notification.user_id == user_id,
        Notification.read == False,
    ).set({"read": True})


async def get_preferences(user_id: uuid.UUID) -> NotificationPreferences:
    prefs = await NotificationPreference.find_one(NotificationPreference.user_id == user_id)
    if not prefs:
        defaults = generate_preferences()
        prefs = NotificationPreference(user_id=user_id, **defaults)
        await prefs.insert()
    return NotificationPreferences(
        channels=prefs.channels,
        categories=prefs.categories,
        quiet_hours_enabled=prefs.quiet_hours_enabled,
        quiet_start=prefs.quiet_start,
        quiet_end=prefs.quiet_end,
    )


async def update_preferences(user_id: uuid.UUID, data: PreferenceUpdateRequest) -> NotificationPreferences:
    prefs = await NotificationPreference.find_one(NotificationPreference.user_id == user_id)
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        await prefs.insert()

    updates = {}
    if data.channels is not None:
        updates["channels"] = data.channels
    if data.categories is not None:
        updates["categories"] = data.categories
    if data.quiet_hours_enabled is not None:
        updates["quiet_hours_enabled"] = data.quiet_hours_enabled
    if data.quiet_start is not None:
        updates["quiet_start"] = data.quiet_start
    if data.quiet_end is not None:
        updates["quiet_end"] = data.quiet_end

    if updates:
        updates["updated_at"] = datetime.now(UTC)
        await prefs.set(updates)
        prefs = await NotificationPreference.find_one(NotificationPreference.user_id == user_id)

    return NotificationPreferences(
        channels=prefs.channels,
        categories=prefs.categories,
        quiet_hours_enabled=prefs.quiet_hours_enabled,
        quiet_start=prefs.quiet_start,
        quiet_end=prefs.quiet_end,
    )
