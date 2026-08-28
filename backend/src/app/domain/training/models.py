from __future__ import annotations

import uuid
from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel


class TrainingSession(Document):
    """A single training session — one user completing one or more tasks."""
    user_id: uuid.UUID
    session_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    device_id: str | None = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    task_type: str  # controlled_typing, repeated_typing, paragraph_typing, mouse_tracking, normal_navigation
    sample_count: int = 0
    status: str = "in_progress"  # in_progress, completed, abandoned
    metadata: dict = Field(default_factory=dict)

    class Settings:
        name = "training_sessions"
        indexes = [
            "user_id",
            "session_id",
            "task_type",
            IndexModel([("user_id", 1), ("session_id", 1)]),
        ]


class TrainingEvent(Document):
    """Raw behavioral event captured during a training task."""
    user_id: uuid.UUID
    session_id: uuid.UUID
    task_type: str  # controlled_typing, repeated_typing, paragraph_typing, mouse_tracking
    event_type: str  # keydown, keyup, mouse_move, mouse_click, mouse_scroll, task_start, task_end
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    device_id: str | None = None
    page: str | None = None
    # Keystroke fields
    key_code: int | None = None
    key_char: str | None = None  # only for non-sensitive keys (letters/digits/space)
    dwell_time_ms: float | None = None
    flight_time_ms: float | None = None
    # Mouse fields
    x: float | None = None
    y: float | None = None
    target_id: str | None = None
    target_size: str | None = None  # small, medium, large
    click_duration_ms: float | None = None
    # Scroll fields
    delta_y: float | None = None
    # Task metadata
    task_index: int | None = None
    trial_index: int | None = None
    text_length: int | None = None
    backspace_count: int | None = None
    correction_count: int | None = None
    total_duration_ms: float | None = None
    pause_duration_ms: float | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "training_events"
        indexes = [
            "user_id",
            "session_id",
            "task_type",
            "event_type",
            IndexModel([("user_id", 1), ("session_id", 1)]),
            IndexModel([("created_at", 1)], expireAfterSeconds=86400 * 90),  # 90-day TTL
        ]


class TrainingFeature(Document):
    """Derived behavioral features from a completed training task."""
    user_id: uuid.UUID
    session_id: uuid.UUID
    task_type: str
    task_index: int | None = None
    trial_index: int | None = None
    device_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Typing features
    typing_speed: float | None = None  # chars per second
    mean_key_hold: float | None = None
    std_key_hold: float | None = None
    mean_flight_time: float | None = None
    std_flight_time: float | None = None
    backspace_rate: float | None = None
    correction_rate: float | None = None
    pause_mean: float | None = None
    pause_std: float | None = None
    total_duration_ms: float | None = None
    # Mouse features
    mouse_speed_mean: float | None = None
    mouse_speed_std: float | None = None
    mouse_acceleration: float | None = None
    click_interval_mean: float | None = None
    scroll_speed: float | None = None
    trajectory_length: float | None = None
    direction_changes: int | None = None
    target_acquisition_mean: float | None = None
    # Full feature vector for ML
    feature_vector: dict[str, float] = Field(default_factory=dict)

    class Settings:
        name = "training_features"
        indexes = [
            "user_id",
            "session_id",
            "task_type",
            IndexModel([("user_id", 1), ("session_id", 1)]),
        ]