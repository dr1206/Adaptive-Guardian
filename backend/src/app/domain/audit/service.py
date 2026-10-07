"""Audit trail service — MongoDB-backed cross-domain audit logging and querying."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.domain.audit import mock_data
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
    total_db = await AuditRecord.find_all().count()
    if total_db == 0:
        entries_raw, total = mock_data.generate_audit_entries(
            limit=limit,
            offset=offset,
            actor=actor,
            action=action,
            resource=resource,
            outcome=outcome,
        )
        return AuditQueryResponse(
            entries=[AuditEntryItem(**e) for e in entries_raw],
            total=total,
        )

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
    total_entries = await cursor.count()

    if total_entries == 0:
        # Mock summary data when DB has no records for the period
        mock_entries, _ = mock_data.generate_audit_entries(limit=100)
        action_counts: dict[str, int] = {}
        action_last: dict[str, str] = {}
        for me in mock_entries:
            act = me["action"]
            action_counts[act] = action_counts.get(act, 0) + 1
            if act not in action_last or me["time"] > action_last[act]:
                action_last[act] = me["time"]
        summary = [
            AuditSummaryItem(action=act, count=cnt, last_seen=action_last[act])
            for act, cnt in sorted(action_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        return AuditSummaryResponse(
            summary=summary,
            total_entries=len(mock_entries),
            period_hours=period_hours,
        )

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

    return AuditSummaryResponse(
        summary=summary if summary else [
            AuditSummaryItem(action="user.login", count=0, last_seen=_fmt_dt(datetime.now(UTC))),
        ],
        total_entries=total_entries,
        period_hours=period_hours,
    )
