"""Unit tests for the Audit domain."""

from __future__ import annotations

import pytest

from app.domain.audit.schemas import (
    AuditEntryItem,
    AuditQueryResponse,
    AuditSummaryItem,
    AuditSummaryResponse,
)
from app.domain.audit.service import get_audit_summary, query_audit

# ── Service layer ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_query_audit_returns_entries() -> None:
    result = await query_audit(limit=10, offset=0)
    assert isinstance(result, AuditQueryResponse)
    assert len(result.entries) > 0
    assert isinstance(result.entries[0], AuditEntryItem)


@pytest.mark.asyncio
async def test_query_audit_filters_by_actor() -> None:
    result = await query_audit(actor="system", limit=50, offset=0)
    for e in result.entries:
        assert e.actor == "system"


@pytest.mark.asyncio
async def test_query_audit_filters_by_action() -> None:
    result = await query_audit(action="user.suspend", limit=50, offset=0)
    for e in result.entries:
        assert e.action == "user.suspend"


@pytest.mark.asyncio
async def test_query_audit_filters_by_resource() -> None:
    result = await query_audit(resource="sessions", limit=50, offset=0)
    for e in result.entries:
        assert e.resource == "sessions"


@pytest.mark.asyncio
async def test_query_audit_required_fields() -> None:
    result = await query_audit(limit=50, offset=0)
    for e in result.entries:
        assert e.id
        assert e.actor
        assert e.action
        assert e.resource
        assert e.details is not None
        assert e.outcome in ("success", "failure", "blocked")
        assert e.time


@pytest.mark.asyncio
async def test_get_audit_summary_returns_data() -> None:
    result = await get_audit_summary(period_hours=24)
    assert isinstance(result, AuditSummaryResponse)
    assert result.period_hours == 24
    assert result.total_entries > 0
    assert len(result.summary) >= 5
    assert isinstance(result.summary[0], AuditSummaryItem)


@pytest.mark.asyncio
async def test_get_audit_summary_period() -> None:
    result = await get_audit_summary(period_hours=168)
    assert result.period_hours == 168


# ── Schema serialization ───────────────────────────────────────


def test_audit_entry_camel_case() -> None:
    entry = AuditEntryItem(
        id="audit_0001", actor="admin@bankdemo.com", actor_id="uid-1",
        action="user.suspend", resource="users", resource_id="uid-2",
        details={"summary": "Suspended user"}, ip_address="10.0.0.1",
        outcome="success", time="2026-06-29T12:00:00Z",
    )
    data = entry.model_dump(by_alias=True)
    assert data["actorId"] == "uid-1"
    assert data["resourceId"] == "uid-2"
    assert data["ipAddress"] == "10.0.0.1"
    assert data["time"] == "2026-06-29T12:00:00Z"


def test_audit_summary_camel_case() -> None:
    summary = AuditSummaryResponse(
        summary=[AuditSummaryItem(action="user.login", count=100, last_seen="2026-06-29T12:00:00Z")],
        total_entries=7371, period_hours=24,
    )
    data = summary.model_dump(by_alias=True)
    assert data["totalEntries"] == 7371
    assert data["periodHours"] == 24
    assert data["items"][0]["lastSeen"] == "2026-06-29T12:00:00Z"
