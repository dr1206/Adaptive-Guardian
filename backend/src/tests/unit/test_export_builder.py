"""Unit tests for behavioral data export and CSV schema validation.

Verifies:
- number_of_headers == number_of_columns_in_every_row
- All expected canonical column names are present
- Exactly ONE row is produced per behavioral window
- Window aggregates in BehavioralEvent are not duplicated
- Deterministic window identification and idempotency
"""

from __future__ import annotations

import csv
import io
import uuid
import zipfile
from datetime import datetime, timezone

import pytest

from app.domain.admin.export_builder import (
    _write_combined_biometrics_csv,
    build_user_export_zip,
)
from app.domain.aegis.models import BehavioralEvent, BehaviorWindow
from app.domain.aegis.service import compute_window_id
from app.domain.auth.models import User
from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession


def test_export_builder_header_and_row_column_count_match():
    """Verify number_of_headers == number_of_columns_in_every_row for all record types."""
    user_id = uuid.uuid4()
    session_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    # 1. Training event
    tr_event = TrainingEvent(
        session_id=session_id,
        user_id=user_id,
        task_type="controlled_typing",
        event_type="keydown",
        timestamp=now,
        key_code=65,
        dwell_time_ms=120.0,
        flight_time_ms=85.0,
    )

    # 2. Training feature
    tr_feature = TrainingFeature(
        user_id=user_id,
        session_id=session_id,
        task_type="controlled_typing",
        typing_speed=45.2,
        mean_key_hold=110.0,
        feature_vector={"custom_feat": 1.23},
        created_at=now,
    )

    # 3. Behavioral event (raw mouse movement)
    bh_event = BehavioralEvent(
        user_id=user_id,
        session_id=session_id,
        event_type="mouse_move",
        timestamp=now,
        x=250.0,
        y=350.0,
        velocity=0.45,
    )

    # 4. Behavioral event with window_aggregate (should be excluded to prevent duplication)
    bh_event_aggregate = BehavioralEvent(
        user_id=user_id,
        session_id=session_id,
        event_type="window_aggregate",
        timestamp=now,
        feature_vector={"velocityMean": 0.45},
    )

    # 5. Behavior window
    win_start = now
    win_end = datetime.fromtimestamp(now.timestamp() + 30, tz=timezone.utc)
    bh_window = BehaviorWindow(
        window_id=compute_window_id(user_id, session_id, win_start, win_end),
        user_id=user_id,
        session_id=session_id,
        window_start=win_start,
        window_end=win_end,
        features={
            "dwellMeanMs": 105.0,
            "dwellStdMs": 15.0,
            "flightMeanMs": 90.0,
            "flightStdMs": 20.0,
            "keysPerSec": 3.5,
            "velocityMean": 0.45,
            "velocityStd": 0.12,
            "accelerationMean": 0.001,
            "accelerationStd": 0.0005,
            "curvatureMean": 0.25,
            "curvatureStd": 0.05,
            "clickCount": 4,
            "scrollAmount": 120.0,
            "mouseTravelPx": 1500.0,
        },
        created_at=now,
    )

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        _write_combined_biometrics_csv(
            zf=zf,
            folder_path="",
            training_sessions=[],
            training_events=[tr_event],
            training_features=[tr_feature],
            behavioral_events=[bh_event, bh_event_aggregate],
            behavior_windows=[bh_window],
            user_id=user_id,
        )

    zip_buf.seek(0)
    with zipfile.ZipFile(zip_buf, "r") as zf:
        csv_content = zf.read("behavioral_biometrics.csv").decode("utf-8")

    reader = list(csv.reader(io.StringIO(csv_content)))
    assert len(reader) >= 2, "CSV should contain header and rows"

    header = reader[0]
    num_headers = len(header)
    rows = reader[1:]

    # Critical requirement: number_of_headers == number_of_columns_in_every_row
    for row_idx, row in enumerate(rows):
        assert len(row) == num_headers, (
            f"Row {row_idx} ({row[0]}) column count {len(row)} does not match header count {num_headers}"
        )

    # Critical requirement: All expected columns are present
    expected_columns = [
        "record_type",
        "source",
        "user_id",
        "session_id",
        "timestamp",
        "event_type",
        "window_id",
        "window_start",
        "window_end",
        "dwell_time_ms",
        "flight_time_ms",
        "velocity",
        "clickCount",
        "velocityMean",
        "dwellMeanMs",
        "keysPerSec",
    ]
    for col in expected_columns:
        assert col in header, f"Expected column '{col}' missing from CSV header"

    # Critical requirement: Exactly ONE row for the behavior window
    window_rows = [r for r in rows if r[0] == "behavior_window"]
    assert len(window_rows) == 1, (
        f"Expected exactly 1 behavior_window row, but found {len(window_rows)}"
    )

    # Critical requirement: Excluded window_aggregate duplicate from behavioral_events
    aggregate_event_rows = [
        r for r in rows if r[0] == "behavioral_event" and r[5] == "window_aggregate"
    ]
    assert len(aggregate_event_rows) == 0, (
        f"Found duplicate window_aggregate rows in behavioral_events: {len(aggregate_event_rows)}"
    )


def test_deterministic_window_id():
    """Verify that same window bounds generate identical window_id."""
    uid = uuid.uuid4()
    sid = uuid.uuid4()
    t1 = datetime(2026, 10, 6, 12, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 10, 6, 12, 0, 30, tzinfo=timezone.utc)

    id1 = compute_window_id(uid, sid, t1, t2)
    id2 = compute_window_id(uid, sid, t1, t2)
    assert id1 == id2
    assert len(id1) == 64  # SHA-256 hex
