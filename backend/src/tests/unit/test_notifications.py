"""Unit tests for the Notifications domain."""

from __future__ import annotations

import uuid

import pytest

from app.domain.notifications.mock_data import (
    generate_notifications,
    generate_preferences,
)
from app.domain.notifications.schemas import (
    NotificationInbox,
    NotificationItem,
    NotificationPreferences,
    PreferenceUpdateRequest,
)
from app.domain.notifications.service import (
    get_inbox,
    get_preferences,
    mark_all_read,
    mark_read,
    update_preferences,
)


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


# ── Mock data generators ───────────────────────────────────────


def test_generate_notifications_returns_page(user_id: uuid.UUID) -> None:
    page, total, unread = generate_notifications(user_id, limit=5, offset=0)
    assert len(page) == 5
    assert total > 5
    assert unread > 0


def test_generate_notifications_unread_only(user_id: uuid.UUID) -> None:
    page, _, _ = generate_notifications(user_id, limit=20, offset=0, unread_only=True)
    for n in page:
        assert n["read"] is False


def test_generate_notifications_sorted_desc(user_id: uuid.UUID) -> None:
    page, _, _ = generate_notifications(user_id, limit=20, offset=0)
    dates = [n["created_at"] for n in page]
    assert dates == sorted(dates, reverse=True)


def test_generate_notifications_required_fields(user_id: uuid.UUID) -> None:
    page, _, _ = generate_notifications(user_id, limit=20, offset=0)
    for n in page:
        assert n["type"] in ("security", "banking", "insight", "system")
        assert n["severity"] in ("info", "warn", "critical")
        assert n["title"]
        assert n["body"]
        assert "created_at" in n


def test_generate_preferences_defaults() -> None:
    prefs = generate_preferences()
    assert "push" in prefs["channels"]
    assert prefs["categories"]["security"] is True
    assert prefs["quiet_hours_enabled"] is False


# ── Service layer ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_inbox_returns_proper_response(user_id: uuid.UUID) -> None:
    result = await get_inbox(user_id, limit=5, offset=0)
    assert isinstance(result, NotificationInbox)
    assert len(result.notifications) == 5
    assert result.total > 0
    assert result.unread > 0
    assert isinstance(result.notifications[0], NotificationItem)


@pytest.mark.asyncio
async def test_get_inbox_unread_only(user_id: uuid.UUID) -> None:
    result = await get_inbox(user_id, limit=20, offset=0, unread_only=True)
    for n in result.notifications:
        assert n.read is False


@pytest.mark.asyncio
async def test_get_inbox_deterministic(user_id: uuid.UUID) -> None:
    a = await get_inbox(user_id, limit=5, offset=0)
    b = await get_inbox(user_id, limit=5, offset=0)
    assert a.notifications[0].id == b.notifications[0].id


@pytest.mark.asyncio
async def test_mark_read_noop(user_id: uuid.UUID) -> None:
    await mark_read(user_id, "notif_0001")


@pytest.mark.asyncio
async def test_mark_all_read_noop(user_id: uuid.UUID) -> None:
    await mark_all_read(user_id)


@pytest.mark.asyncio
async def test_get_preferences(user_id: uuid.UUID) -> None:
    result = await get_preferences(user_id)
    assert isinstance(result, NotificationPreferences)
    assert "push" in result.channels
    assert result.categories["security"] is True


@pytest.mark.asyncio
async def test_update_preferences_modifies_channels(user_id: uuid.UUID) -> None:
    update = PreferenceUpdateRequest(channels=["email"])
    result = await update_preferences(user_id, update)
    assert result.channels == ["email"]


@pytest.mark.asyncio
async def test_update_preferences_modifies_categories(user_id: uuid.UUID) -> None:
    update = PreferenceUpdateRequest(categories={"security": False, "banking": True, "insight": True, "system": False})
    result = await update_preferences(user_id, update)
    assert result.categories["security"] is False
    assert result.categories["system"] is False


@pytest.mark.asyncio
async def test_update_preferences_quiet_hours(user_id: uuid.UUID) -> None:
    update = PreferenceUpdateRequest(quiet_hours_enabled=True, quiet_start="21:00", quiet_end="08:00")
    result = await update_preferences(user_id, update)
    assert result.quiet_hours_enabled is True
    assert result.quiet_start == "21:00"


# ── Schema serialization ───────────────────────────────────────


def test_notification_item_camel_case() -> None:
    item = NotificationItem(
        id="notif_001", type="security", severity="warn",
        title="Test", body="Body text",
        action_label="View", action_path="/app/guard",
        created_at="2026-06-29T12:00:00Z",
    )
    data = item.model_dump(by_alias=True)
    assert data["actionLabel"] == "View"
    assert data["createdAt"] == "2026-06-29T12:00:00Z"


def test_notification_preferences_camel_case() -> None:
    prefs = NotificationPreferences(
        channels=["push", "email"],
        categories={"security": True, "banking": False, "insight": True, "system": True},
        quiet_hours_enabled=True, quiet_start="22:00", quiet_end="07:00",
    )
    data = prefs.model_dump(by_alias=True)
    assert data["quietHoursEnabled"] is True
    assert data["quietStart"] == "22:00"


def test_preference_update_request_partial() -> None:
    update = PreferenceUpdateRequest(channels=["sms"])
    data = update.model_dump(by_alias=True, exclude_none=True)
    assert data == {"channels": ["sms"]}
