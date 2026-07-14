"""Audit record model — cross-domain audit trail."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class AuditRecord(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    actor: str  # user email or "system"
    actor_id: uuid.UUID | None = None
    action: str  # e.g. "user.login", "transfer.create", "session.revoke"
    resource: str  # e.g. "users", "sessions", "transfers"
    resource_id: str | None = None
    detail: str
    ip_address: str | None = None
    user_agent: str | None = None
    outcome: str = "success"  # success, failure, blocked
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "audit_records"
        indexes = [
            "actor",
            "actor_id",
            "action",
            "resource",
            "outcome",
            "created_at",
            IndexModel([("actor_id", 1), ("created_at", 1)]),
            IndexModel([("resource", 1), ("created_at", 1)]),
        ]
