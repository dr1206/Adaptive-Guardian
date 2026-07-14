"""Audit trail service — MongoDB-backed cross-domain audit logging and querying."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.domain.audit.models import AuditRecord
from app.domain.audit.schemas import (
    AuditEntryItem,
    AuditQueryResponse,
    AuditSummaryItem,
    AuditSummaryResponse,
)


def _fmt_dt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


async def query_audit(
    actor: str | None = None,
    action: str | None = None,
    resource: str | None = None,
    outcome: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AuditQueryResponse:
    q = AuditRecord.find_all()
    if actor:
        q = q.find(AuditRecord.actor == actor)
    if action:
        q = q.find(AuditRecord.action == action)
    if resource:
        q = q.find(AuditRecord.resource == resource)
    if outcome:
        q = q.find(AuditRecord.outcome == outcome)

    total = await q.count()
    entries = await q.sort(-AuditRecord.created_at).skip(offset).limit(limit).to_list()

    return AuditQueryResponse(
        entries=[
            AuditEntryItem(
                id=str(e.id),
                actor=e.actor,
                action=e.action,
                resource=e.resource,
                detail=e.detail,
                outcome=e.outcome,
                created_at=_fmt_dt(e.created_at),
            )
            for e in entries
        ],
        total=total,
    )


async def get_audit_summary(period_hours: int = 24) -> AuditSummaryResponse:
    since = datetime.now(UTC) - timedelta(hours=period_hours)
    cursor = AuditRecord.find(AuditRecord.created_at >= since)

    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}, "last_seen": {"$max": "$created_at"}}},
        {"$sort": {"count": -1}},
    ]

    raw = await AuditRecord.get_motor_collection().aggregate(pipeline).to_list(length=20)

    summary = [
        AuditSummaryItem(
            action=r["_id"],
            count=r["count"],
            last_seen=_fmt_dt(r["last_seen"]),
        )
        for r in raw
    ]

    total_entries = await cursor.count()

    return AuditSummaryResponse(
        summary=summary if summary else [
            AuditSummaryItem(action="user.login", count=0, last_seen=_fmt_dt(datetime.now(UTC))),
        ],
        total_entries=total_entries,
        period_hours=period_hours,
    )
