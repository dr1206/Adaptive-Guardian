"""Security platform service — aggregates auth data with real repos."""

from __future__ import annotations

import uuid

from app.domain.auth import repository as auth_repo
from app.domain.auth.mock_scoring import get_risk_scoring_service
from app.domain.security import mock_data
from app.domain.security.schemas import (
    DailySecurityReport,
    DeviceHealthItem,
    DeviceHealthResponse,
    HourlyBucket,
    LocationBucket,
    LoginAnalytics,
    ReportDevice,
    ReportSummary,
    RiskEventFeed,
    RiskEventItem,
    SecurityOverview,
    SessionTimelineEvent,
    SessionTimelineResponse,
)


# ── Security Overview ──────────────────────────────────────────


async def get_overview(user_id: uuid.UUID) -> SecurityOverview:
    sessions = await auth_repo.get_sessions_for_user(user_id)
    devices = await auth_repo.get_devices_for_user(user_id)
    trusted = sum(1 for d in devices if d.is_trusted)

    overlay = mock_data.generate_security_overview(user_id)

    return SecurityOverview(
        active_sessions=len(sessions),
        trusted_devices=trusted,
        flagged_events_24h=overlay["flagged_events_24h"],
        risk_trend=overlay["risk_trend"],
        last_assessment_at=overlay["last_assessment_at"],
    )


# ── Session Timeline ───────────────────────────────────────────


async def get_session_timeline(
    user_id: uuid.UUID, limit: int = 30, offset: int = 0
) -> SessionTimelineResponse:
    history_events, _ = await auth_repo.get_login_history(user_id, limit=limit, offset=offset)
    scorer = get_risk_scoring_service()

    events: list[SessionTimelineEvent] = []
    for h in history_events:
        risk_score = None
        risk_verdict = None
        if h.session_id and h.event in ("login", "refresh"):
            try:
                score = await scorer.calculate_risk(h.session_id)
                risk_score = round(score.risk, 2)
                risk_verdict = score.verdict
            except Exception:
                pass

        events.append(
            SessionTimelineEvent(
                session_id=str(h.session_id) if h.session_id else "unknown",
                event=h.event,
                ip_address=h.ip_address,
                device_label=None,
                location=None,
                risk_score=risk_score,
                risk_verdict=risk_verdict,
                occurred_at=h.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            )
        )

    events.sort(key=lambda e: e.occurred_at, reverse=True)
    return SessionTimelineResponse(events=events, total=len(events))


# ── Daily Security Report ──────────────────────────────────────


async def get_daily_report(user_id: uuid.UUID, date: str | None = None) -> DailySecurityReport:
    report = mock_data.generate_daily_report(user_id, date)
    return DailySecurityReport(
        date=report["date"],
        summary=ReportSummary(**report["summary"]),
        active_devices=[ReportDevice(**d) for d in report["active_devices"]],
        risk_verdict=report["risk_verdict"],
        generated_at=report["generated_at"],
    )


# ── Risk Events ────────────────────────────────────────────────


async def get_risk_events(
    user_id: uuid.UUID,
    severity: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> RiskEventFeed:
    page, total, critical_count = mock_data.generate_risk_event_feed(
        user_id, severity=severity, limit=limit, offset=offset
    )
    return RiskEventFeed(
        events=[RiskEventItem(**e) for e in page],
        total=total,
        critical_count=critical_count,
    )


# ── Login Analytics ────────────────────────────────────────────


async def get_login_analytics(user_id: uuid.UUID, period_days: int = 30) -> LoginAnalytics:
    data = mock_data.generate_login_analytics(user_id, period_days)
    return LoginAnalytics(
        total_logins=data["total_logins"],
        unique_devices=data["unique_devices"],
        unique_locations=data["unique_locations"],
        hourly_distribution=[HourlyBucket(**h) for h in data["hourly_distribution"]],
        by_location=[LocationBucket(**loc) for loc in data["by_location"]],
        period_days=data["period_days"],
    )


# ── Device Health ──────────────────────────────────────────────


async def get_device_health(user_id: uuid.UUID) -> DeviceHealthResponse:
    devices = await auth_repo.get_devices_for_user(user_id)
    items: list[DeviceHealthItem] = []
    for d in devices:
        items.append(
            DeviceHealthItem(
                device_id=str(d.id),
                label=d.label,
                fingerprint=d.fingerprint[:12],
                is_trusted=d.is_trusted,
                first_seen=d.first_seen_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                last_seen=d.last_seen_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                os=d.user_agent or "Unknown",
                risk_level="low" if d.is_trusted else "medium",
            )
        )
    flagged = sum(1 for d in devices if not d.is_trusted)
    return DeviceHealthResponse(devices=items, flagged=flagged)
