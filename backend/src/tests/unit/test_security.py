"""Unit tests for the Security Platform domain."""

from __future__ import annotations

import uuid
from unittest import mock

import pytest

from app.domain.security.mock_data import (
    generate_daily_report,
    generate_device_health,
    generate_login_analytics,
    generate_risk_event_feed,
    generate_security_overview,
    generate_session_timeline,
)
from app.domain.security.schemas import (
    DailySecurityReport,
    DeviceHealthResponse,
    LoginAnalytics,
    RiskEventFeed,
    SecurityOverview,
    SessionTimelineResponse,
)
from app.domain.security.service import (
    get_daily_report,
    get_device_health,
    get_login_analytics,
    get_overview,
    get_risk_events,
    get_session_timeline,
)


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


# ── Mock data generators ───────────────────────────────────────


def test_overview_mock_generates_valid_data(user_id: uuid.UUID) -> None:
    data = generate_security_overview(user_id)
    assert data["active_sessions"] >= 1
    assert data["trusted_devices"] >= 1
    assert data["risk_trend"] in ("improving", "stable", "degrading")
    assert "T" in data["last_assessment_at"]


def test_risk_event_feed_pagination(user_id: uuid.UUID) -> None:
    page, total, critical = generate_risk_event_feed(user_id, limit=5, offset=0)
    assert len(page) == 5
    assert total <= 12  # template count
    assert critical >= 0


def test_risk_event_feed_severity_filter(user_id: uuid.UUID) -> None:
    page, total, _ = generate_risk_event_feed(user_id, severity="critical", limit=20, offset=0)
    for e in page:
        assert e["severity"] == "critical"


def test_session_timeline_pagination(user_id: uuid.UUID) -> None:
    page, total = generate_session_timeline(user_id, limit=10, offset=0)
    assert len(page) == 10
    assert total == 50
    for event in page:
        assert event["event"] in ("login", "logout", "refresh", "risk_snapshot")


def test_daily_report_structure(user_id: uuid.UUID) -> None:
    report = generate_daily_report(user_id, date="2026-06-29")
    assert report["date"] == "2026-06-29"
    assert report["summary"]["total_logins"] > 0
    assert len(report["active_devices"]) >= 1


def test_login_analytics_hourly_distribution(user_id: uuid.UUID) -> None:
    data = generate_login_analytics(user_id, period_days=30)
    assert len(data["hourly_distribution"]) == 24
    assert data["period_days"] == 30
    assert data["total_logins"] > 0


def test_device_health_returns_flagged_count(user_id: uuid.UUID) -> None:
    devices, flagged = generate_device_health(user_id)
    assert len(devices) >= 1
    actual_flagged = sum(1 for d in devices if d["recommendation"] != "keep")
    assert flagged == actual_flagged
    # Sorted by trust_score desc
    scores = [d["trust_score"] for d in devices]
    assert scores == sorted(scores, reverse=True)


# ── Service layer with mocked auth repo ────────────────────────


@pytest.mark.asyncio
async def test_get_overview_combines_auth_and_mock(user_id: uuid.UUID) -> None:
    with (
        mock.patch("app.domain.security.service.auth_repo.get_sessions_for_user", return_value=[]),
        mock.patch("app.domain.security.service.auth_repo.get_devices_for_user", return_value=[]),
    ):
        result = await get_overview(user_id)
        assert isinstance(result, SecurityOverview)
        assert result.active_sessions == 0
        assert result.last_assessment_at is not None


@pytest.mark.asyncio
async def test_get_risk_events_returns_feed(user_id: uuid.UUID) -> None:
    result = await get_risk_events(user_id, limit=5, offset=0)
    assert isinstance(result, RiskEventFeed)
    assert len(result.events) == 5
    assert result.total > 0
    for e in result.events:
        assert e.severity in ("info", "warn", "critical")
        assert e.category in ("device", "location", "behavior", "session")


@pytest.mark.asyncio
async def test_get_risk_events_severity_filter(user_id: uuid.UUID) -> None:
    result = await get_risk_events(user_id, severity="critical")
    for e in result.events:
        assert e.severity == "critical"


@pytest.mark.asyncio
async def test_get_daily_report(user_id: uuid.UUID) -> None:
    result = await get_daily_report(user_id, date="2026-06-29")
    assert isinstance(result, DailySecurityReport)
    assert result.date == "2026-06-29"
    assert result.summary.total_logins > 0


@pytest.mark.asyncio
async def test_get_login_analytics(user_id: uuid.UUID) -> None:
    result = await get_login_analytics(user_id, period_days=7)
    assert isinstance(result, LoginAnalytics)
    assert result.period_days == 7
    assert len(result.hourly_distribution) == 24


@pytest.mark.asyncio
async def test_get_device_health(user_id: uuid.UUID) -> None:
    result = await get_device_health(user_id)
    assert isinstance(result, DeviceHealthResponse)
    assert result.flagged >= 1
    for d in result.devices:
        assert d.recommendation in ("keep", "review", "revoke")
        assert 0 <= d.trust_score <= 10


@pytest.mark.asyncio
async def test_get_session_timeline_with_mock_auth(user_id: uuid.UUID) -> None:
    with mock.patch("app.domain.security.service.auth_repo.get_login_history", return_value=([], 0)):
        result = await get_session_timeline(user_id, limit=10, offset=0)
        assert isinstance(result, SessionTimelineResponse)
        assert result.total == 0


# ── Schema validation ──────────────────────────────────────────


def test_security_overview_serialization() -> None:
    obj = SecurityOverview(
        active_sessions=3,
        trusted_devices=2,
        flagged_events_24h=1,
        risk_trend="stable",
        last_assessment_at="2026-06-29T12:00:00Z",
    )
    data = obj.model_dump(by_alias=True)
    assert data["activeSessions"] == 3
    assert data["riskTrend"] == "stable"


def test_risk_event_feed_serialization() -> None:
    from app.domain.security.schemas import RiskEventItem

    item = RiskEventItem(
        id="risk_0001",
        severity="warn",
        category="device",
        title="New device",
        detail="Details here",
        occurred_at="2026-06-29T12:00:00Z",
    )
    data = item.model_dump(by_alias=True)
    assert data["severity"] == "warn"
    assert data["occurredAt"] == "2026-06-29T12:00:00Z"
