from __future__ import annotations

import uuid
from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel


class BehaviorWindow(Document):
    window_id: str
    user_id: uuid.UUID
    session_id: uuid.UUID | str
    device_id: uuid.UUID | str | None = None
    window_start: datetime
    window_end: datetime
    features: dict[str, float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "behavior_windows"
        indexes = [
            "window_id",
            "user_id",
            "session_id",
            "device_id",
            IndexModel([("window_id", 1)], unique=True),
            IndexModel([("user_id", 1), ("session_id", 1), ("device_id", 1)]),
            IndexModel([("user_id", 1), ("created_at", -1)]),
        ]


class BehavioralEvent(Document):
    """Raw behavioral data event — keystroke, mouse, or aggregate window."""
    user_id: uuid.UUID
    session_id: uuid.UUID
    device_id: uuid.UUID | None = None
    event_type: str  # keystroke, mouse_move, mouse_click, mouse_scroll, window_aggregate
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Keystroke fields
    key_code: int | None = None
    dwell_time_ms: float | None = None
    flight_time_ms: float | None = None
    # Mouse fields
    x: float | None = None
    y: float | None = None
    delta_x: float | None = None
    delta_y: float | None = None
    velocity: float | None = None
    # Window aggregate fields
    window_start: datetime | None = None
    window_end: datetime | None = None
    feature_vector: dict[str, float] | None = None
    device_info: dict | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "behavioral_events"
        indexes = [
            "user_id",
            "session_id",
            "device_id",
            "event_type",
            IndexModel([("user_id", 1), ("session_id", 1)]),
            IndexModel([("user_id", 1), ("device_id", 1), ("session_id", 1)]),
            IndexModel([("created_at", 1)], expireAfterSeconds=86400 * 90),  # 90-day TTL
        ]


class Decision(Document):
    model_config = {"protected_namespaces": ()}
    decision_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID | None = None
    session_id: uuid.UUID | str
    window_id: str | None = None
    lightgbm_score: float | None = None
    ocsvm_score: float | None = None
    fused_score: float | None = None
    outcome: str  # allow, warn, challenge, step_up, block
    risk_level: str = "low"  # low, medium, high, critical
    score: float  # confidence (0..1) or fused score
    model_version: str = "lgbm_ocsvm_v1"
    feature_schema_version: str = "v1"
    top_contributors: list[dict] = []
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "decisions"
        indexes = [
            "user_id",
            "session_id",
            "decision_id",
            IndexModel([("user_id", 1), ("evaluated_at", -1)]),
            IndexModel([("session_id", 1), ("evaluated_at", -1)]),
        ]


class DeviceProfile(Document):
    user_id: uuid.UUID
    fingerprint: str
    label: str | None = None
    kind: str | None = None  # laptop, phone, tablet, desktop
    os: str | None = None
    browser: str | None = None
    trust: str = "new"  # trusted, recognized, new
    last_active: datetime | None = None

    class Settings:
        name = "device_profiles"
