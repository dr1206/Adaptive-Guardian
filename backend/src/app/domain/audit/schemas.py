"""Audit trail schemas — camelCase via serialization_alias."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AuditEntryItem(BaseModel):
    id: str
    actor: str
    actor_id: str | None = Field(None, serialization_alias="actorId")
    action: str
    resource: str
    resource_id: str | None = Field(None, serialization_alias="resourceId")
    details: dict | None = Field(None)
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    user_agent: str | None = Field(None, serialization_alias="userAgent")
    outcome: str = "success"  # success, failure, blocked
    time: str


class AuditQueryResponse(BaseModel):
    entries: list[AuditEntryItem]
    total: int


class AuditSummaryItem(BaseModel):
    action: str
    count: int
    last_seen: str = Field(serialization_alias="lastSeen")


class AuditSummaryResponse(BaseModel):
    summary: list[AuditSummaryItem] = Field(serialization_alias="items")
    total_entries: int = Field(serialization_alias="totalEntries")
    period_hours: int = Field(serialization_alias="periodHours")
