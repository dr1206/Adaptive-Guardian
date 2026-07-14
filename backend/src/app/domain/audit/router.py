from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_admin
from app.domain.audit import service
from app.domain.audit.schemas import AuditQueryResponse, AuditSummaryResponse

router = APIRouter(prefix="/audit", tags=["audit"], dependencies=[Depends(require_admin)])


@router.get("/entries", response_model=AuditQueryResponse)
async def query_audit(
    actor: str | None = Query(None),
    action: str | None = Query(None),
    resource: str | None = Query(None),
    outcome: str | None = Query(None, pattern=r"^(success|failure|blocked)$"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await service.query_audit(
        actor=actor, action=action, resource=resource, outcome=outcome,
        limit=limit, offset=offset,
    )


@router.get("/summary", response_model=AuditSummaryResponse)
async def get_audit_summary(
    period_hours: int = Query(24, ge=1, le=720, alias="periodHours"),
):
    return await service.get_audit_summary(period_hours=period_hours)
