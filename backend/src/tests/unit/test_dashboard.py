"""Unit tests for the Dashboard aggregation domain."""

from __future__ import annotations

import uuid

import pytest

from app.domain.dashboard.schemas import (
    AnalyticsResponse,
    DashboardSummary,
    NotificationFeed,
    TrendResponse,
)
from app.domain.dashboard.service import get_analytics, get_notifications, get_summary, get_trends


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.mark.asyncio
async def test_summary_returns_all_cards(user_id: uuid.UUID) -> None:
    result = await get_summary(user_id)
    assert isinstance(result, DashboardSummary)
    assert result.total_balance.label == "Total Balance"
    assert result.accounts_count > 0
    assert result.security_score.value is not None


@pytest.mark.asyncio
async def test_summary_deterministic(user_id: uuid.UUID) -> None:
    a = await get_summary(user_id)
    b = await get_summary(user_id)
    assert a.total_balance.value == b.total_balance.value


@pytest.mark.asyncio
async def test_summary_different_users() -> None:
    a = await get_summary(uuid.uuid4())
    b = await get_summary(uuid.uuid4())
    assert a.total_balance.value != b.total_balance.value


@pytest.mark.asyncio
async def test_trends_7d(user_id: uuid.UUID) -> None:
    result = await get_trends(user_id, period="7d")
    assert isinstance(result, TrendResponse)
    assert result.period == "7d"
    assert len(result.series) == 3
    assert result.series[0].key == "income"
    assert len(result.series[0].points) == 7


@pytest.mark.asyncio
async def test_trends_30d(user_id: uuid.UUID) -> None:
    result = await get_trends(user_id, period="30d")
    assert result.period == "30d"
    assert len(result.series[0].points) == 30


@pytest.mark.asyncio
async def test_trends_90d(user_id: uuid.UUID) -> None:
    result = await get_trends(user_id, period="90d")
    assert result.period == "90d"
    assert len(result.series[0].points) == 90


@pytest.mark.asyncio
async def test_trends_defaults_to_7d(user_id: uuid.UUID) -> None:
    result = await get_trends(user_id)
    assert result.period == "7d"


@pytest.mark.asyncio
async def test_analytics_structure(user_id: uuid.UUID) -> None:
    result = await get_analytics(user_id)
    assert isinstance(result, AnalyticsResponse)
    assert result.total_income > 0
    assert result.total_expenses > 0
    assert result.currency == "USD"
    assert len(result.categories) > 0


@pytest.mark.asyncio
async def test_analytics_categories_add_up(user_id: uuid.UUID) -> None:
    result = await get_analytics(user_id)
    total_pct = sum(c.percentage for c in result.categories)
    assert 95 <= total_pct <= 105  # near 100, rounding tolerance


@pytest.mark.asyncio
async def test_notifications_returns_feed(user_id: uuid.UUID) -> None:
    result = await get_notifications(user_id)
    assert isinstance(result, NotificationFeed)
    assert len(result.notifications) > 0
    assert result.unread > 0


@pytest.mark.asyncio
async def test_notifications_sorted(user_id: uuid.UUID) -> None:
    result = await get_notifications(user_id)
    dates = [n.created_at for n in result.notifications]
    assert dates == sorted(dates, reverse=True)


@pytest.mark.asyncio
async def test_notifications_have_required_fields(user_id: uuid.UUID) -> None:
    result = await get_notifications(user_id)
    for n in result.notifications:
        assert n.id
        assert n.type in ("security", "banking", "insight", "system")
        assert n.severity in ("info", "warn", "critical")
        assert n.title
        assert n.body


@pytest.mark.asyncio
async def test_trends_series_have_colors(user_id: uuid.UUID) -> None:
    result = await get_trends(user_id)
    for s in result.series:
        assert s.color
        assert s.label


@pytest.mark.asyncio
async def test_summary_card_tones(user_id: uuid.UUID) -> None:
    result = await get_summary(user_id)
    assert result.total_balance.tone in ("up", "down", "neutral", "warn")
    assert result.savings_balance.tone in ("up", "down", "neutral", "warn")
