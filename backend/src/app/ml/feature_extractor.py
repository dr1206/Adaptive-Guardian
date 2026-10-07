"""
Canonical feature extraction for keystroke dynamics and mouse dynamics.

Implements exact mathematical equivalence with frontend collector:
- Keystroke: dwellMeanMs, dwellStdMs, flightMeanMs, flightStdMs, keysPerSec
- Mouse: velocityMean, velocityStd, accelerationMean, accelerationStd,
         curvatureMean, curvatureStd, clickCount, scrollAmount, mouseTravelPx
"""

from __future__ import annotations

import math
from typing import Any


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return float(sum(values) / len(values))


def _std(values: list[float], mean_val: float) -> float:
    if len(values) < 2:
        return 0.0
    variance = sum((v - mean_val) ** 2 for v in values) / len(values)
    return float(math.sqrt(variance))


def extract_keystroke_features(
    events: list[dict[str, Any]], window_duration_sec: float = 30.0
) -> dict[str, float]:
    """Extract keystroke timing dynamics from key events."""
    dwells: list[float] = []
    flights: list[float] = []

    last_down: float | None = None
    key_downs: dict[int | str, float] = {}

    for ev in events:
        etype = ev.get("event_type") or ev.get("type", "")
        ts = float(ev.get("timestamp", 0))
        code = ev.get("key_code") or ev.get("code", 0)

        if etype in ("keydown", "key_down"):
            if last_down is not None and ts >= last_down:
                flights.append(min(2000.0, ts - last_down))
            last_down = ts
            key_downs[code] = ts
        elif etype in ("keyup", "key_up"):
            down_at = key_downs.pop(code, None)
            if down_at is not None and ts >= down_at:
                dwells.append(min(2000.0, ts - down_at))

    dwell_mean = _mean(dwells)
    dwell_std = _std(dwells, dwell_mean)
    flight_mean = _mean(flights)
    flight_std = _std(flights, flight_mean)
    dur = max(1.0, window_duration_sec)
    keys_per_sec = len(dwells) / dur

    return {
        "dwellMeanMs": round(dwell_mean, 2),
        "dwellStdMs": round(dwell_std, 2),
        "flightMeanMs": round(flight_mean, 2),
        "flightStdMs": round(flight_std, 2),
        "keysPerSec": round(keys_per_sec, 2),
    }


def extract_mouse_features(events: list[dict[str, Any]]) -> dict[str, float]:
    """Extract mouse kinematics and trajectory dynamics."""
    move_samples: list[dict[str, float]] = []
    click_count = 0
    scroll_amount = 0.0

    for ev in events:
        etype = ev.get("event_type") or ev.get("type", "")
        if etype in ("mousemove", "mouse_move"):
            move_samples.append({
                "x": float(ev.get("x", 0)),
                "y": float(ev.get("y", 0)),
                "t": float(ev.get("timestamp", 0)),
            })
        elif etype in ("click", "mouse_click", "mousedown", "mouse_down"):
            click_count += 1
        elif etype in ("wheel", "scroll"):
            scroll_amount += abs(float(ev.get("delta_y", 0) or ev.get("deltaY", 0)))

    # Compute travel distance
    mouse_travel_px = 0.0
    for i in range(1, len(move_samples)):
        dx = move_samples[i]["x"] - move_samples[i - 1]["x"]
        dy = move_samples[i]["y"] - move_samples[i - 1]["y"]
        mouse_travel_px += math.sqrt(dx * dx + dy * dy)

    # Compute velocities, accelerations, curvatures
    velocities: list[float] = []
    accelerations: list[float] = []
    curvatures: list[float] = []

    max_vel_px_s = 8000.0

    for i in range(1, len(move_samples)):
        dt = move_samples[i]["t"] - move_samples[i - 1]["t"]
        if dt <= 0:
            continue

        dx = move_samples[i]["x"] - move_samples[i - 1]["x"]
        dy = move_samples[i]["y"] - move_samples[i - 1]["y"]
        dist = math.sqrt(dx * dx + dy * dy)
        vel = min((dist / dt) * 1000.0, max_vel_px_s)
        velocities.append(vel)

        if i >= 2 and len(velocities) >= 2:
            prev_vel = velocities[-2]
            acc_dt = move_samples[i]["t"] - move_samples[i - 2]["t"]
            if acc_dt > 0:
                accelerations.append((vel - prev_vel) / acc_dt)

        if i >= 2:
            prev_dx = move_samples[i - 1]["x"] - move_samples[i - 2]["x"]
            prev_dy = move_samples[i - 1]["y"] - move_samples[i - 2]["y"]
            prev_dist = math.sqrt(prev_dx * prev_dx + prev_dy * prev_dy)
            if dist > 0 and prev_dist > 0:
                dot = (dx * prev_dx + dy * prev_dy) / (dist * prev_dist)
                clamped_dot = max(-1.0, min(1.0, dot))
                curvatures.append(math.acos(clamped_dot))

    vel_mean = _mean(velocities)
    vel_std = _std(velocities, vel_mean)
    acc_mean = _mean(accelerations)
    acc_std = _std(accelerations, acc_mean)
    curv_mean = _mean(curvatures)
    curv_std = _std(curvatures, curv_mean)

    return {
        "velocityMean": round(vel_mean, 4),
        "velocityStd": round(vel_std, 4),
        "accelerationMean": round(acc_mean, 6),
        "accelerationStd": round(acc_std, 6),
        "curvatureMean": round(curv_mean, 6),
        "curvatureStd": round(curv_std, 6),
        "clickCount": float(click_count),
        "scrollAmount": round(scroll_amount, 2),
        "mouseTravelPx": round(mouse_travel_px, 2),
    }


def extract_window_features(
    keystroke_events: list[dict[str, Any]],
    mouse_events: list[dict[str, Any]],
    window_duration_sec: float = 30.0,
) -> dict[str, float]:
    """Extract complete 14-dimensional canonical feature vector."""
    features = {}
    features.update(extract_keystroke_features(keystroke_events, window_duration_sec))
    features.update(extract_mouse_features(mouse_events))
    return features
