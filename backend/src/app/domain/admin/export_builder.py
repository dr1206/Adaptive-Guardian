"""Per-user behavioral dataset export builder.

Produces a ZIP containing ONLY behavioral biometric data CSVs:

    training_data.csv   All training events and features
    behavioral_data.csv All behavioral windows (aggregated features)

Authentication/session metadata is excluded unless directly relevant for
identifying the behavioral sample (user_id, session_id, timestamps).

Empty records (all features zero/null) are filtered out from the export.
"""

from __future__ import annotations

import csv
import io
import zipfile
from datetime import datetime, timezone
from typing import Dict, List
import uuid

from app.domain.auth.models import Session, User
from app.domain.aegis.models import BehavioralEvent, BehaviorWindow
from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession


def _fmt_dt(value: datetime | None) -> str:
    if value is None:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _safe_email(email: str | None) -> str:
    safe = (email or "unknown").replace("@", "_").replace(".", "_")
    return safe or "unknown"


def _is_behavior_window_empty(features: dict) -> bool:
    """Check if a behavior window contains any meaningful behavioral data."""
    if not features:
        return True
    behavioral_features = [
        "dwellMeanMs", "dwellStdMs", "flightMeanMs", "flightStdMs",
        "keysPerSec", "velocityMean", "velocityStd",
        "accelerationMean", "accelerationStd",
        "curvatureMean", "curvatureStd", "clickCount",
        "scrollAmount", "mouseTravelPx"
    ]
    for key in behavioral_features:
        value = features.get(key)
        if value is not None and value != 0 and value != "":
            return False
    return True


def _is_training_event_empty(event) -> bool:
    """Check if a training event has any meaningful data.
    Works for both TrainingEvent (has key_char) and BehavioralEvent (no key_char)."""
    # Check for keystroke data
    key_code = getattr(event, 'key_code', None)
    key_char = getattr(event, 'key_char', None)
    if key_code is not None or key_char is not None:
        return False
    # Check for mouse data
    if getattr(event, 'x', None) is not None or getattr(event, 'y', None) is not None:
        return False
    # Check for timing data
    if getattr(event, 'dwell_time_ms', None) is not None or getattr(event, 'flight_time_ms', None) is not None:
        return False
    if getattr(event, 'delta_y', None) is not None:
        return False
    return True


def _write_csv(zf: zipfile.ZipFile, name: str, header: list, rows: list) -> None:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    for row in rows:
        writer.writerow(row)
    zf.writestr(name, buffer.getvalue())


def _write_behavioral_events(zf: zipfile.ZipFile, folder_path: str, events: list[BehavioralEvent]) -> None:
    """Write behavioral events to CSV in the ZIP file."""
    if not events:
        return

    # Filter out empty events and window_aggregate duplicates
    filtered_events = [
        event for event in events
        if not _is_training_event_empty(event) and getattr(event, "event_type", "") != "window_aggregate"
    ]
    if not filtered_events:
        return

    header = [
        "event_id",
        "user_id",
        "session_id",
        "timestamp",
        "event_type",
        "key_code",
        "key_char",
        "dwell_time_ms",
        "flight_time_ms",
        "x",
        "y",
        "delta_x",
        "delta_y",
        "velocity",
        "window_start",
        "window_end",
    ]

    # Collect all possible feature keys from all events
    feature_keys = set()
    for event in filtered_events:
        if event.feature_vector:
            feature_keys.update(event.feature_vector.keys())

    # Add feature columns to header
    for key in sorted(feature_keys):
        header.append(f"feature_{key}")

    rows = []
    for event in filtered_events:
        row = [
            str(event.id),
            str(event.user_id),
            str(event.session_id),
            _fmt_dt(event.timestamp),
            event.event_type,
            event.key_code if event.key_code is not None else "",
            event.key_char if event.key_char is not None else "",
            event.dwell_time_ms if event.dwell_time_ms is not None else "",
            event.flight_time_ms if event.flight_time_ms is not None else "",
            event.x if event.x is not None else "",
            event.y if event.y is not None else "",
            event.delta_x if event.delta_x is not None else "",
            event.delta_y if event.delta_y is not None else "",
            event.velocity if event.velocity is not None else "",
            _fmt_dt(event.window_start) if event.window_start else "",
            _fmt_dt(event.window_end) if event.window_end else "",
        ]

        # Add feature values
        for key in sorted(feature_keys):
            value = event.feature_vector.get(key) if event.feature_vector else None
            row.append(value if value is not None else "")

        rows.append(row)

    filename = f"{folder_path}behavioral_events.csv" if folder_path else "behavioral_events.csv"
    _write_csv(zf, filename, header, rows)


def _write_behavior_windows(zf: zipfile.ZipFile, folder_path: str, windows: list[BehaviorWindow]) -> None:
    """Write behavior windows to CSV in the ZIP file."""
    if not windows:
        return

    # Filter out empty windows
    filtered_windows = [window for window in windows if not _is_behavior_window_empty(window.features)]
    if not filtered_windows:
        return

    # Collect all possible feature keys from all windows
    feature_keys = set()
    for window in filtered_windows:
        if window.features:
            feature_keys.update(window.features.keys())

    header = [
        "window_id",
        "user_id",
        "session_id",
        "window_start",
        "window_end",
        "created_at",
    ]

    # Add feature columns to header
    for key in sorted(feature_keys):
        header.append(f"feature_{key}")

    rows = []
    for window in filtered_windows:
        row = [
            str(window.id),
            str(window.user_id),
            str(window.session_id),
            _fmt_dt(window.window_start),
            _fmt_dt(window.window_end),
            _fmt_dt(window.created_at),
        ]

        # Add feature values
        for key in sorted(feature_keys):
            value = window.features.get(key)
            row.append(value if value is not None else "")

        rows.append(row)

    filename = f"{folder_path}behavior_windows.csv" if folder_path else "behavior_windows.csv"
    _write_csv(zf, filename, header, rows)


def _write_combined_biometrics_csv(
    zf: zipfile.ZipFile,
    folder_path: str,
    training_sessions: list[TrainingSession],
    training_events: list[TrainingEvent],
    training_features: list[TrainingFeature],
    behavioral_events: list[BehavioralEvent],
    behavior_windows: list[BehaviorWindow],
    user_id: uuid.UUID | None
) -> None:
    """
    Write a SINGLE combined CSV containing ALL keyboard and mouse behavioral biometrics.
    This merges training data (controlled collection) + continuous behavioral data (auth sessions).
    """
    # Determine if we have any data to export
    has_training_events = any(not _is_training_event_empty(e) for e in training_events)
    has_behavioral_events = any(not _is_training_event_empty(e) for e in behavioral_events)
    has_behavior_windows = any(not _is_behavior_window_empty(w.features) for w in behavior_windows)
    has_training_features = len(training_features) > 0

    
    # Collect all possible feature keys from all sources
    training_fv_keys = set()
    for f in training_features:
        if f.feature_vector:
            training_fv_keys.update(f.feature_vector.keys())

    behavioral_fv_keys = set()
    for e in behavioral_events:
        if e.feature_vector:
            behavioral_fv_keys.update(e.feature_vector.keys())

    window_feature_keys = set()
    for w in behavior_windows:
        if w.features:
            window_feature_keys.update(w.features.keys())

    # Explicit canonical base columns for combined biometrics
    base_columns = [
        "record_type",      # "training_event", "training_feature", "behavioral_event", "behavior_window"
        "source",           # "training" (controlled) or "continuous" (auth session)
        "user_id",
        "session_id",
        "timestamp",
        "event_type",       # keystroke, keyup, mouse_move, mouse_click, mouse_scroll, window_aggregate
        # Keystroke fields
        "key_code",
        "key_char",
        "dwell_time_ms",
        "flight_time_ms",
        # Mouse fields
        "x",
        "y",
        "delta_x",
        "delta_y",
        "velocity",
        # Window aggregate timing fields
        "window_id",
        "window_start",
        "window_end",
        # Training-specific fields
        "task_type",
        "task_index",
        "trial_index",
        "text_length",
        "backspace_count",
        "correction_count",
        "total_duration_ms",
        "pause_duration_ms",
        "target_id",
        "target_size",
        "click_duration_ms",
        "page",
        "device_id",
        # Training feature fields (derived metrics)
        "typing_speed",
        "mean_key_hold",
        "std_key_hold",
        "mean_flight_time",
        "std_flight_time",
        "backspace_rate",
        "correction_rate",
        "pause_mean",
        "pause_std",
        "mouse_speed_mean",
        "mouse_speed_std",
        "mouse_acceleration",
        "click_interval_mean",
        "scroll_speed",
        "trajectory_length",
        "direction_changes",
        "target_acquisition_mean",
        "feature_created_at",
        # Canonical behavioral biometric features
        "dwellMeanMs",
        "dwellStdMs",
        "flightMeanMs",
        "flightStdMs",
        "keysPerSec",
        "velocityMean",
        "velocityStd",
        "accelerationMean",
        "accelerationStd",
        "curvatureMean",
        "curvatureStd",
        "clickCount",
        "scrollAmount",
        "mouseTravelPx",
    ]

    sorted_training_fv = sorted(training_fv_keys)
    sorted_behavioral_fv = sorted(behavioral_fv_keys)
    sorted_window_features = sorted(window_feature_keys)

    header = (
        list(base_columns)
        + [f"training_fv_{key}" for key in sorted_training_fv]
        + [f"behavioral_fv_{key}" for key in sorted_behavioral_fv]
        + [f"window_f_{key}" for key in sorted_window_features]
    )

    def _build_row(data: dict) -> list[str]:
        row = [str(data[col]) if data.get(col) is not None else "" for col in header]
        assert len(row) == len(header), f"Row length {len(row)} != header length {len(header)}"
        return row

    rows = []

    # 1. Training Events (controlled collection)
    filtered_training_events = [e for e in training_events if not _is_training_event_empty(e)]
    for event in filtered_training_events:
        export_uid = getattr(event, "_export_user_id", user_id) or ""
        row_dict = {
            "record_type": "training_event",
            "source": "training",
            "user_id": str(export_uid),
            "session_id": str(getattr(event, "session_id", "") or ""),
            "timestamp": _fmt_dt(getattr(event, "timestamp", None)),
            "event_type": getattr(event, "event_type", ""),
            "key_code": getattr(event, "key_code", "") if getattr(event, "key_code", None) is not None else "",
            "key_char": getattr(event, "key_char", "") if getattr(event, "key_char", None) is not None else "",
            "dwell_time_ms": getattr(event, "dwell_time_ms", "") if getattr(event, "dwell_time_ms", None) is not None else "",
            "flight_time_ms": getattr(event, "flight_time_ms", "") if getattr(event, "flight_time_ms", None) is not None else "",
            "x": getattr(event, "x", "") if getattr(event, "x", None) is not None else "",
            "y": getattr(event, "y", "") if getattr(event, "y", None) is not None else "",
            "delta_x": getattr(event, "delta_x", "") if getattr(event, "delta_x", None) is not None else "",
            "delta_y": getattr(event, "delta_y", "") if getattr(event, "delta_y", None) is not None else "",
            "velocity": getattr(event, "velocity", "") if getattr(event, "velocity", None) is not None else "",
            "window_start": _fmt_dt(getattr(event, "window_start", None)),
            "window_end": _fmt_dt(getattr(event, "window_end", None)),
            "task_type": getattr(event, "task_type", ""),
            "task_index": getattr(event, "task_index", "") if getattr(event, "task_index", None) is not None else "",
            "trial_index": getattr(event, "trial_index", "") if getattr(event, "trial_index", None) is not None else "",
            "text_length": getattr(event, "text_length", "") if getattr(event, "text_length", None) is not None else "",
            "backspace_count": getattr(event, "backspace_count", "") if getattr(event, "backspace_count", None) is not None else "",
            "correction_count": getattr(event, "correction_count", "") if getattr(event, "correction_count", None) is not None else "",
            "total_duration_ms": getattr(event, "total_duration_ms", "") if getattr(event, "total_duration_ms", None) is not None else "",
            "pause_duration_ms": getattr(event, "pause_duration_ms", "") if getattr(event, "pause_duration_ms", None) is not None else "",
            "target_id": getattr(event, "target_id", "") if getattr(event, "target_id", None) is not None else "",
            "target_size": getattr(event, "target_size", "") if getattr(event, "target_size", None) is not None else "",
            "click_duration_ms": getattr(event, "click_duration_ms", "") if getattr(event, "click_duration_ms", None) is not None else "",
            "page": getattr(event, "page", "") if getattr(event, "page", None) is not None else "",
            "device_id": getattr(event, "device_id", "") if getattr(event, "device_id", None) is not None else "",
        }
        rows.append(_build_row(row_dict))

    # 2. Training Features (derived metrics from training sessions)
    for feature in training_features:
        export_uid = getattr(feature, "_export_user_id", user_id) or ""
        row_dict = {
            "record_type": "training_feature",
            "source": "training",
            "user_id": str(export_uid),
            "session_id": str(getattr(feature, "session_id", "") or ""),
            "timestamp": _fmt_dt(getattr(feature, "created_at", None)),
            "event_type": "derived",
            "task_type": getattr(feature, "task_type", ""),
            "task_index": getattr(feature, "task_index", "") if getattr(feature, "task_index", None) is not None else "",
            "trial_index": getattr(feature, "trial_index", "") if getattr(feature, "trial_index", None) is not None else "",
            "typing_speed": getattr(feature, "typing_speed", "") if getattr(feature, "typing_speed", None) is not None else "",
            "mean_key_hold": getattr(feature, "mean_key_hold", "") if getattr(feature, "mean_key_hold", None) is not None else "",
            "std_key_hold": getattr(feature, "std_key_hold", "") if getattr(feature, "std_key_hold", None) is not None else "",
            "mean_flight_time": getattr(feature, "mean_flight_time", "") if getattr(feature, "mean_flight_time", None) is not None else "",
            "std_flight_time": getattr(feature, "std_flight_time", "") if getattr(feature, "std_flight_time", None) is not None else "",
            "backspace_rate": getattr(feature, "backspace_rate", "") if getattr(feature, "backspace_rate", None) is not None else "",
            "correction_rate": getattr(feature, "correction_rate", "") if getattr(feature, "correction_rate", None) is not None else "",
            "pause_mean": getattr(feature, "pause_mean", "") if getattr(feature, "pause_mean", None) is not None else "",
            "pause_std": getattr(feature, "pause_std", "") if getattr(feature, "pause_std", None) is not None else "",
            "mouse_speed_mean": getattr(feature, "mouse_speed_mean", "") if getattr(feature, "mouse_speed_mean", None) is not None else "",
            "mouse_speed_std": getattr(feature, "mouse_speed_std", "") if getattr(feature, "mouse_speed_std", None) is not None else "",
            "mouse_acceleration": getattr(feature, "mouse_acceleration", "") if getattr(feature, "mouse_acceleration", None) is not None else "",
            "click_interval_mean": getattr(feature, "click_interval_mean", "") if getattr(feature, "click_interval_mean", None) is not None else "",
            "scroll_speed": getattr(feature, "scroll_speed", "") if getattr(feature, "scroll_speed", None) is not None else "",
            "trajectory_length": getattr(feature, "trajectory_length", "") if getattr(feature, "trajectory_length", None) is not None else "",
            "direction_changes": getattr(feature, "direction_changes", "") if getattr(feature, "direction_changes", None) is not None else "",
            "target_acquisition_mean": getattr(feature, "target_acquisition_mean", "") if getattr(feature, "target_acquisition_mean", None) is not None else "",
            "feature_created_at": _fmt_dt(getattr(feature, "created_at", None)),
        }
        if feature.feature_vector:
            for k in sorted_training_fv:
                row_dict[f"training_fv_{k}"] = feature.feature_vector.get(k, "")
        rows.append(_build_row(row_dict))

    # 3. Behavioral Events (continuous raw events only — excluding window_aggregate to prevent duplicates)
    filtered_behavioral_events = [
        e for e in behavioral_events
        if not _is_training_event_empty(e) and getattr(e, "event_type", "") != "window_aggregate"
    ]
    for event in filtered_behavioral_events:
        export_uid = getattr(event, "_export_user_id", user_id) or ""
        row_dict = {
            "record_type": "behavioral_event",
            "source": "continuous",
            "user_id": str(export_uid),
            "session_id": str(getattr(event, "session_id", "") or ""),
            "timestamp": _fmt_dt(getattr(event, "timestamp", None)),
            "event_type": getattr(event, "event_type", ""),
            "key_code": getattr(event, "key_code", "") if getattr(event, "key_code", None) is not None else "",
            "dwell_time_ms": getattr(event, "dwell_time_ms", "") if getattr(event, "dwell_time_ms", None) is not None else "",
            "flight_time_ms": getattr(event, "flight_time_ms", "") if getattr(event, "flight_time_ms", None) is not None else "",
            "x": getattr(event, "x", "") if getattr(event, "x", None) is not None else "",
            "y": getattr(event, "y", "") if getattr(event, "y", None) is not None else "",
            "delta_x": getattr(event, "delta_x", "") if getattr(event, "delta_x", None) is not None else "",
            "delta_y": getattr(event, "delta_y", "") if getattr(event, "delta_y", None) is not None else "",
            "velocity": getattr(event, "velocity", "") if getattr(event, "velocity", None) is not None else "",
            "window_start": _fmt_dt(getattr(event, "window_start", None)),
            "window_end": _fmt_dt(getattr(event, "window_end", None)),
        }
        if event.feature_vector:
            for k in sorted_behavioral_fv:
                row_dict[f"behavioral_fv_{k}"] = event.feature_vector.get(k, "")
        rows.append(_build_row(row_dict))

    # 4. Behavior Windows (aggregated continuous biometric windows — exactly ONE row per window)
    filtered_behavior_windows = [w for w in behavior_windows if not _is_behavior_window_empty(w.features)]
    for window in filtered_behavior_windows:
        export_uid = getattr(window, "_export_user_id", user_id) or ""
        win_id = getattr(window, "window_id", "") or str(getattr(window, "id", ""))
        row_dict = {
            "record_type": "behavior_window",
            "source": "continuous",
            "user_id": str(export_uid),
            "session_id": str(getattr(window, "session_id", "") or ""),
            "timestamp": _fmt_dt(getattr(window, "created_at", None)),
            "event_type": "window_aggregate",
            "window_id": str(win_id),
            "window_start": _fmt_dt(getattr(window, "window_start", None)),
            "window_end": _fmt_dt(getattr(window, "window_end", None)),
            "feature_created_at": _fmt_dt(getattr(window, "created_at", None)),
        }
        if window.features:
            for k in sorted_window_features:
                val = window.features.get(k)
                if val is not None:
                    row_dict[f"window_f_{k}"] = val
                    # Also populate direct column name if present in base schema
                    if k in base_columns:
                        row_dict[k] = val

        # Append row EXACTLY ONCE
        rows.append(_build_row(row_dict))

    filename = f"{folder_path}behavioral_biometrics.csv" if folder_path else "behavioral_biometrics.csv"
    _write_csv(zf, filename, header, rows)


def build_user_export_zip(
    users: list[User],
    user_training_sessions: dict[uuid.UUID, list[TrainingSession]],
    user_training_events: dict[uuid.UUID, list[TrainingEvent]],
    user_training_features: dict[uuid.UUID, list[TrainingFeature]],
    user_auth_sessions: dict[uuid.UUID, list[Session]],
    user_behavioral_events: dict[uuid.UUID, list[BehavioralEvent]],
    user_behavior_windows: dict[uuid.UUID, list[BehaviorWindow]],
    user_device_profiles: dict[uuid.UUID, list[object]],  # DeviceProfile type
    single_user: bool = False,
) -> tuple[bytes, str]:
    """
    Build a ZIP export for user data with ONE combined CSV containing all
    keyboard and mouse behavioral biometrics (training + continuous behavioral).

    If single_user is True, exports data for the first user in the users list.
    If single_user is False, exports data for all users (aggregated).

    Returns:
        tuple of (zip_bytes, zip_filename)
    """
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if single_user and users:
            # Export for single user - create ONE combined behavioral_biometrics.csv
            user = users[0]
            user_id = user.id

            training_sessions = user_training_sessions.get(user_id, [])
            training_events = user_training_events.get(user_id, [])
            training_features = user_training_features.get(user_id, [])
            behavioral_events = user_behavioral_events.get(user_id, [])
            behavior_windows = user_behavior_windows.get(user_id, [])

            # Write single combined CSV with all keyboard/mouse biometrics
            _write_combined_biometrics_csv(zf, "", training_sessions, training_events, training_features,
                                           behavioral_events, behavior_windows, user_id)
        else:
            # Export for all users - create aggregated combined CSV
            all_training_sessions = []
            all_training_events = []
            all_training_features = []
            all_behavioral_events = []
            all_behavior_windows = []

            for uid, sessions in user_training_sessions.items():
                for s in sessions:
                    s._export_user_id = uid
                    all_training_sessions.append(s)
            for uid, events in user_training_events.items():
                for e in events:
                    e._export_user_id = uid
                    all_training_events.append(e)
            for uid, features in user_training_features.items():
                for f in features:
                    f._export_user_id = uid
                    all_training_features.append(f)

            for uid, events in user_behavioral_events.items():
                for e in events:
                    e._export_user_id = uid
                    all_behavioral_events.append(e)
            for uid, windows in user_behavior_windows.items():
                for w in windows:
                    w._export_user_id = uid
                    all_behavior_windows.append(w)

            # Write single combined CSV for all users
            _write_combined_biometrics_csv(zf, "", all_training_sessions, all_training_events, all_training_features,
                                           all_behavioral_events, all_behavior_windows, None)

    zip_buffer.seek(0)
    zip_data = zip_buffer.getvalue()

    if single_user and users:
        user = users[0]
        safe_email = _safe_email(user.email)
        zip_name = f"export_{safe_email}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.zip"
    else:
        zip_name = f"export_all_users_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.zip"

    return zip_data, zip_name


def _write_training_data_csv(
    zf: zipfile.ZipFile,
    folder_path: str,
    training_sessions: list[TrainingSession],
    training_events: list[TrainingEvent],
    training_features: list[TrainingFeature],
    user_id: uuid.UUID
) -> None:
    """Write training data to CSV in the ZIP file."""
    # We'll create a comprehensive training CSV that includes session, event, and feature data
    # For simplicity, let's create separate sections or combine what makes sense

    # Actually, looking at the service.py's export_training_data function,
    # it creates separate CSVs for sessions, events, and features
    # But the requirement says we need training_data.csv and behavioral_data.csv

    # Let me re-read the requirement...
    # "Required output for ONE user:
    # - training_data.csv
    # - behavioral_data.csv"

    # And from the docstring:
    # "Produces a ZIP containing ONLY behavioral biometric data CSVs:
    #     training_data.csv   All training events and features
    #     behavioral_data.csv All behavioral windows (aggregated features)"

    # So training_data.csv should contain BOTH training events AND features
    # And behavioral_data.csv should contain behavioral events AND windows

    # Let's implement training_data.csv to include both events and features

    if not training_events and not training_features:
        return

    # Collect all possible columns
    event_columns = [
        "event_id", "session_id", "timestamp", "event_type", "key_code", "key_char",
        "dwell_time_ms", "flight_time_ms", "x", "y", "target_id", "target_size",
        "click_duration_ms", "delta_y", "task_index", "trial_index", "text_length",
        "backspace_count", "correction_count", "total_duration_ms", "pause_duration_ms",
        "page", "device_id"
    ]

    feature_columns = [
        "feature_id", "session_id", "task_index", "trial_index", "typing_speed",
        "mean_key_hold", "std_key_hold", "mean_flight_time", "std_flight_time",
        "backspace_rate", "correction_rate", "pause_mean", "pause_std",
        "total_duration_ms", "mouse_speed_mean", "mouse_speed_std", "mouse_acceleration",
        "click_interval_mean", "scroll_speed", "trajectory_length", "direction_changes",
        "target_acquisition_mean"
    ]

    # Feature vector keys
    feature_vector_keys = set()
    for feature in training_features:
        if feature.feature_vector:
            feature_vector_keys.update(feature.feature_vector.keys())

    # Build header - include user_id for aggregated exports
    header = ["record_type", "user_id"]
    header.extend([f"event_{col}" for col in event_columns])
    header.extend([f"feature_{col}" for col in feature_columns])
    header.extend([f"fv_{key}" for key in sorted(feature_vector_keys)])

    rows = []

    # Add training events (filtered)
    filtered_training_events = [event for event in training_events if not _is_training_event_empty(event)]
    for event in filtered_training_events:
        row = ["event"]
        # user_id (from _export_user_id if available, or passed parameter)
        export_uid = getattr(event, '_export_user_id', user_id)
        row.append(str(export_uid) if export_uid else "")
        # Event data
        for col in event_columns:
            value = getattr(event, col, None)
            if col in ["timestamp", "created_at"]:
                row.append(_fmt_dt(value) if value is not None else "")
            elif col in ["key_char", "target_id", "target_size", "page", "device_id"]:
                row.append(value if value is not None else "")
            else:
                row.append(value if value is not None else 0 if isinstance(getattr(event, col, None), (int, float)) else "")

        # Feature data (empty for event rows)
        for col in feature_columns:
            row.append("")
        for key in sorted(feature_vector_keys):
            row.append("")

        rows.append(row)

    # Add training features (we don't have a direct empty check for features, but we'll include all for now)
    # Features are derived data, so they should be meaningful if they exist
    for feature in training_features:
        row = ["feature"]
        # user_id
        export_uid = getattr(feature, '_export_user_id', user_id)
        row.append(str(export_uid) if export_uid else "")
        # Event data (empty for feature rows)
        for col in event_columns:
            row.append("")

        # Feature data
        for col in feature_columns:
            value = getattr(feature, col, None)
            if col in ["created_at"]:
                row.append(_fmt_dt(value) if value is not None else "")
            else:
                row.append(value if value is not None else "")

        # Feature vector data
        for key in sorted(feature_vector_keys):
            value = feature.feature_vector.get(key) if feature.feature_vector else None
            row.append(value if value is not None else "")

        rows.append(row)

    filename = f"{folder_path}training_data.csv" if folder_path else "training_data.csv"
    _write_csv(zf, filename, header, rows)


def _write_behavioral_data_csv(
    zf: zipfile.ZipFile,
    folder_path: str,
    behavioral_events: list[BehavioralEvent],
    behavior_windows: list[BehaviorWindow],
    user_id: uuid.UUID
) -> None:
    """Write behavioral data to CSV in the ZIP file."""
    # Similar approach to training_data.csv - combine events and windows

    if not behavioral_events and not behavior_windows:
        return

    # Collect all possible columns
    event_columns = [
        "event_id", "session_id", "timestamp", "event_type", "key_code", "dwell_time_ms",
        "flight_time_ms", "x", "y", "delta_x", "delta_y", "velocity", "window_start", "window_end"
    ]

    window_columns = [
        "window_id", "session_id", "window_start", "window_end", "created_at"
    ]

    # Feature vector keys for events
    event_feature_keys = set()
    for event in behavioral_events:
        if event.feature_vector:
            event_feature_keys.update(event.feature_vector.keys())

    # Feature keys for windows
    window_feature_keys = set()
    for window in behavior_windows:
        if window.features:
            window_feature_keys.update(window.features.keys())

    # Build header - include user_id for aggregated exports
    header = ["record_type", "user_id"]
    header.extend([f"event_{col}" for col in event_columns])
    header.extend([f"window_{col}" for col in window_columns])
    header.extend([f"event_fv_{key}" for key in sorted(event_feature_keys)])
    header.extend([f"window_f_{key}" for key in sorted(window_feature_keys)])

    rows = []

    # Add behavioral events (filtered)
    filtered_behavioral_events = [event for event in behavioral_events if not _is_training_event_empty(event)]
    for event in filtered_behavioral_events:
        row = ["event"]
        # user_id
        export_uid = getattr(event, '_export_user_id', user_id)
        row.append(str(export_uid) if export_uid else "")
        # Event data
        for col in event_columns:
            value = getattr(event, col, None)
            if col in ["timestamp", "window_start", "window_end"]:
                row.append(_fmt_dt(value) if value is not None else "")
            elif col in ["key_code"]:
                row.append(value if value is not None else "")
            else:
                row.append(value if value is not None else "")

        # Window data (empty for event rows)
        for col in window_columns:
            row.append("")

        # Event feature vector data
        for key in sorted(event_feature_keys):
            value = event.feature_vector.get(key) if event.feature_vector else None
            row.append(value if value is not None else "")

        # Window feature data (empty for event rows)
        for key in sorted(window_feature_keys):
            row.append("")

        rows.append(row)

    # Add behavior windows (filtered)
    filtered_behavior_windows = [window for window in behavior_windows if not _is_behavior_window_empty(window.features)]
    for window in filtered_behavior_windows:
        row = ["window"]
        # user_id
        export_uid = getattr(window, '_export_user_id', user_id)
        row.append(str(export_uid) if export_uid else "")
        # Event data (empty for window rows)
        for col in event_columns:
            row.append("")

        # Window data
        for col in window_columns:
            value = getattr(window, col, None)
            if col in ["window_start", "window_end", "created_at"]:
                row.append(_fmt_dt(value) if value is not None else "")
            else:
                row.append(value if value is not None else "")

        # Event feature vector data (empty for window rows)
        for key in sorted(event_feature_keys):
            row.append("")

        # Window feature data
        for key in sorted(window_feature_keys):
            value = window.features.get(key)
            row.append(value if value is not None else "")

        rows.append(row)

    filename = f"{folder_path}behavioral_data.csv" if folder_path else "behavioral_data.csv"
    _write_csv(zf, filename, header, rows)