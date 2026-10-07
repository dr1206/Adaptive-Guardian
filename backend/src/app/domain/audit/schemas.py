"""Audit trail schemas — camelCase via serialization_alias."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AuditEntryItem(BaseModel):
    model_config = {"populate_by_name": True}

    id: str
    actor: str
    actor_id: str | None = Field(None, serialization_alias="actorId")
    action: str
    resource: str
    resource_id: str | None = Field(None, serialization_alias="resourceId")
    details: dict | None = Field(default_factory=dict)
    detail: str | None = None
    ip_address: str | None = Field(None, serialization_alias="ipAddress")
    user_agent: str | None = Field(None, serialization_alias="userAgent")
    outcome: str = "success"  # success, failure, blocked
    time: str = ""
    created_at: str | None = Field(None, serialization_alias="createdAt")

    def model_post_init(self, __context: object) -> None:
        if not self.time and self.created_at:
            self.time = self.created_at
        elif not self.created_at and self.time:
            self.created_at = self.time
        if not self.details and self.detail:
            self.details = {"summary": self.detail}
        elif self.details and not self.detail:
            self.detail = self.details.get("summary", "")


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
