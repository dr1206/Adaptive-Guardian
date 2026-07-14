"""Deterministic mock data for the Aegis security domain.  Each user sees a
consistent, realistic 'everything normal' security posture until the real
LightGBM + One-Class SVM engine is plugged in."""

from __future__ import annotations

import hashlib
import random
import uuid
from datetime import UTC, datetime, timedelta


def _seed(user_id: uuid.UUID) -> None:
    digest = hashlib.md5(str(user_id).encode()).hexdigest()
    random.seed(int(digest[:8], 16))


def _uid(prefix: str, idx: int) -> str:
    return f"{prefix}_{idx:04x}"


# ── Snapshot ──────────────────────────────────────────────────


def generate_snapshot(user_id: uuid.UUID) -> dict:
    _seed(user_id)
    confidence = 0.992 + random.uniform(-0.005, 0.005)
    trend = [round(confidence + random.uniform(-0.01, 0.01), 4) for _ in range(60)]
    return {
        "confidence": round(confidence, 4),
        "risk": round(1.0 - confidence, 4),
        "whisper": "Behavior stable. Session A+.",
        "observed_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "trend": trend,
    }


# ── Decisions ─────────────────────────────────────────────────

_DECISIONS = [
    {"action": "allow", "reason": "Confidence 0.99 — all channels nominal", "features": [{"name": "keystroke_rhythm", "contribution": 0.35}, {"name": "mouse_trajectory", "contribution": 0.28}, {"name": "typing_cadence", "contribution": 0.22}]},
    {"action": "allow", "reason": "Confidence 0.97 — device fingerprint matched", "features": [{"name": "device_fingerprint", "contribution": 0.41}, {"name": "login_hour", "contribution": 0.18}, {"name": "geo_consistency", "contribution": 0.15}]},
    {"action": "challenge", "reason": "Confidence 0.64 — mouse velocity anomaly", "features": [{"name": "mouse_velocity", "contribution": -0.22}, {"name": "keystroke_rhythm", "contribution": 0.30}, {"name": "flight_time_std", "contribution": -0.12}]},
    {"action": "allow", "reason": "Confidence 0.94 — post-challenge normal", "features": [{"name": "keystroke_rhythm", "contribution": 0.33}, {"name": "mouse_trajectory", "contribution": 0.26}, {"name": "typing_cadence", "contribution": 0.20}]},
    {"action": "allow", "reason": "Confidence 0.98 — consistent with baseline", "features": [{"name": "keystroke_rhythm", "contribution": 0.36}, {"name": "device_fingerprint", "contribution": 0.25}, {"name": "session_age", "contribution": 0.14}]},
]


def generate_decisions(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    base_date = datetime.now(UTC)
    results = []
    for i, tmpl in enumerate(_DECISIONS):
        occurred = base_date - timedelta(hours=i * 5 + random.randint(0, 3))
        results.append({
            "id": _uid("dec", i),
            "occurred_at": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "action": tmpl["action"],
            "reason": tmpl["reason"],
            "top_features": tmpl["features"],
        })
    return results


# ── Devices ───────────────────────────────────────────────────


def generate_aegis_devices(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    base = datetime.now(UTC)
    return [
        {
            "id": _uid("adev", 0),
            "label": "Chrome on Windows",
            "os": "Windows 11",
            "trust": "trusted",
            "last_seen_at": base.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "city": "New York, US",
        },
        {
            "id": _uid("adev", 1),
            "label": "Safari on iPhone",
            "os": "iOS 18",
            "trust": "recognized",
            "last_seen_at": (base - timedelta(hours=12)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "city": "Boston, US",
        },
        {
            "id": _uid("adev", 2),
            "label": "Firefox on Ubuntu",
            "os": "Ubuntu 24.04",
            "trust": "new",
            "last_seen_at": (base - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "city": "San Francisco, US",
        },
    ]


# ── Risk Events ───────────────────────────────────────────────

_RISK_EVENTS = [
    ("info", "New device detected: Safari on iPhone"),
    ("warn", "Login from unusual location: San Francisco"),
    ("info", "Fingerprint calibration completed"),
    ("critical", "Session from unrecognized device blocked"),
    ("warn", "Mouse velocity anomaly: 2.4σ from baseline"),
]


def generate_risk_events(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    base = datetime.now(UTC)
    events = []
    for i, (severity, summary) in enumerate(_RISK_EVENTS):
        occurred = base - timedelta(hours=i * 8 + random.randint(1, 4))
        events.append({
            "id": _uid("risk", i),
            "occurred_at": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "severity": severity,
            "summary": summary,
        })
    return sorted(events, key=lambda e: e["occurred_at"], reverse=True)


# ── Device Profiles ───────────────────────────────────────────

_DEVICE_PROFILES = [
    {"name": "Work Laptop", "kind": "laptop", "os": "Windows 11", "browser": "Chrome 128", "location": "New York, US", "confidence": 99.2, "trust": 9.8, "primary": True},
    {"name": "Personal iPhone", "kind": "phone", "os": "iOS 18", "browser": "Safari 18", "location": "New York, US", "confidence": 95.4, "trust": 8.5, "primary": False},
    {"name": "Dev Desktop", "kind": "desktop", "os": "Ubuntu 24.04", "browser": "Firefox 132", "location": "San Francisco, US", "confidence": 72.1, "trust": 4.2, "primary": False},
]


def generate_device_profiles(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    base = datetime.now(UTC)
    profiles = []
    for i, tmpl in enumerate(_DEVICE_PROFILES):
        profiles.append({
            "id": _uid("dprof", i),
            "name": tmpl["name"],
            "kind": tmpl["kind"],
            "os": tmpl["os"],
            "browser": tmpl["browser"],
            "location": tmpl["location"],
            "last_active": (base - timedelta(hours=random.randint(0, 48))).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "confidence": round(tmpl["confidence"] + random.uniform(-1, 1), 1),
            "trust": round(tmpl["trust"] + random.uniform(-0.3, 0.3), 1),
            "primary": tmpl["primary"],
        })
    return profiles


# ── Decision Replays ──────────────────────────────────────────

_DECISION_REPLAYS = [
    {"title": "Login from Chrome on Windows", "outcome": "Allowed silently", "confidence": 0.99, "petals": [{"label": "Keystroke rhythm", "weight": 0.35, "sentence": "97% match to enrolled baseline"}, {"label": "Mouse trajectory", "weight": 0.28, "sentence": "Within 0.3σ of mean path"}, {"label": "IP / Geo", "weight": 0.18, "sentence": "Known location (New York)"}]},
    {"title": "MFA login on Safari / iPhone", "outcome": "Step-up OTP", "confidence": 0.68, "petals": [{"label": "Keystroke rhythm", "weight": -0.15, "sentence": "Touch-typing cadence differs"}, {"label": "Device fingerprint", "weight": 0.30, "sentence": "Recognized device #ios-18"}, {"label": "Login hour", "weight": -0.10, "sentence": "Unusual time (3:14 AM)"}]},
    {"title": "Transfer attempt from Firefox", "outcome": "Trusted", "confidence": 0.88, "petals": [{"label": "Keystroke rhythm", "weight": 0.20, "sentence": "Above threshold for transfer"}, {"label": "Session age", "weight": 0.12, "sentence": "Session established 14 min ago"}, {"label": "Transfer amount", "weight": 0.08, "sentence": "$500 within normal range"}]},
]


def generate_decision_replays(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    base = datetime.now(UTC)
    replays = []
    for i, tmpl in enumerate(_DECISION_REPLAYS):
        occurred = base - timedelta(hours=i * 2 + random.randint(0, 1))
        replays.append({
            "id": _uid("replay", i),
            "time": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "title": tmpl["title"],
            "outcome": tmpl["outcome"],
            "confidence": round(tmpl["confidence"] + random.uniform(-0.02, 0.02), 2),
            "petals": tmpl["petals"],
        })
    return replays
