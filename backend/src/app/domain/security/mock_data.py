"""Deterministic mock data for the security domain. Supplements real auth data
(sessions, devices, login history) with mock risk overlays and analytics."""

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


# ── Risk Events (paginated mock) ────────────────────────────────

_RISK_EVENT_TEMPLATES: list[dict] = [
    {
        "severity": "critical",
        "category": "location",
        "title": "Login from unrecognized country",
        "detail": "Account accessed from IP geolocated in Lagos, NG — no prior activity from this region.",
    },
    {
        "severity": "warn",
        "category": "behavior",
        "title": "Mouse velocity anomaly",
        "detail": "Cursor speed 3.2σ above enrolled baseline. Possible remote-access tool.",
    },
    {
        "severity": "warn",
        "category": "device",
        "title": "New device fingerprint detected",
        "detail": "Firefox on Ubuntu — fingerprint not in trusted set. MFA step-up triggered.",
    },
    {
        "severity": "info",
        "category": "session",
        "title": "Session refreshed from new IP",
        "detail": "Refresh token used from 203.0.113.42. Session continues uninterrupted.",
    },
    {
        "severity": "critical",
        "category": "behavior",
        "title": "Keystroke rhythm baseline breach",
        "detail": "Typing cadence 4.1σ below enrolled profile. Confidence dropped to 0.34.",
    },
    {
        "severity": "warn",
        "category": "location",
        "title": "Rapid geo-hop detected",
        "detail": "Two logins 11 minutes apart: New York → London. Physically impossible travel.",
    },
    {
        "severity": "info",
        "category": "device",
        "title": "Trusted device seen from new browser",
        "detail": "Known laptop accessed via Edge instead of enrolled Chrome. Confidence adjusted.",
    },
    {
        "severity": "info",
        "category": "session",
        "title": "Passive re-auth succeeded",
        "detail": "Background behavioral check passed. Session extended silently.",
    },
    {
        "severity": "warn",
        "category": "behavior",
        "title": "Copy-paste burst during transfer",
        "detail": "12 paste events in 3 seconds during transfer form. Potential scripted input.",
    },
    {
        "severity": "critical",
        "category": "session",
        "title": "Concurrent sessions from 3 countries",
        "detail": "Active sessions from US, DE, and BR simultaneously. Account potentially compromised.",
    },
    {
        "severity": "info",
        "category": "device",
        "title": "Device fingerprint re-calibrated",
        "detail": "Chrome auto-updated from v127 to v128. Fingerprint adjusted.",
    },
    {
        "severity": "warn",
        "category": "location",
        "title": "Login from airport public Wi-Fi",
        "detail": "IP block owned by airport network. Higher-risk environment.",
    },
]


def generate_risk_event_feed(
    user_id: uuid.UUID, severity: str | None = None, limit: int = 20, offset: int = 0
) -> tuple[list[dict], int, int]:
    _seed(user_id)
    base = datetime.now(UTC)
    events: list[dict] = []

    for i, tmpl in enumerate(_RISK_EVENT_TEMPLATES):
        if severity and tmpl["severity"] != severity:
            continue
        occurred = base - timedelta(hours=i * 3 + random.randint(0, 2))
        events.append(
            {
                "id": _uid("risk", i),
                "severity": tmpl["severity"],
                "category": tmpl["category"],
                "title": tmpl["title"],
                "detail": tmpl["detail"],
                "session_id": _uid("ses", random.randint(0, 5)),
                "device_id": _uid("dev", random.randint(1, 3)),
                "occurred_at": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "dismissed": random.random() < 0.15,
            }
        )

    events.sort(key=lambda e: e["occurred_at"], reverse=True)
    total = len(events)
    critical_count = sum(1 for e in events if e["severity"] == "critical")
    page = events[offset : offset + limit]
    return page, total, critical_count


# ── Session Timeline ────────────────────────────────────────────


def generate_session_timeline(
    user_id: uuid.UUID, limit: int = 30, offset: int = 0
) -> tuple[list[dict], int]:
    _seed(user_id)
    base = datetime.now(UTC)
    locations = ["New York, US", "Boston, US", "San Francisco, US", "London, UK", "Berlin, DE"]
    devices = ["Chrome on Windows", "Safari on iPhone", "Firefox on Ubuntu"]
    events: list[dict] = []

    for i in range(50):
        occurred = base - timedelta(hours=i * 2 + random.randint(0, 1))
        session_id = _uid("ses", i % 8)
        event_type = random.choice(["login", "logout", "refresh", "risk_snapshot"])
        risk = round(random.uniform(0.70, 0.99), 2) if event_type == "risk_snapshot" else None
        verdict = "allow" if risk and risk > 0.85 else ("challenge" if risk and risk > 0.70 else "block") if risk else None

        events.append(
            {
                "session_id": session_id,
                "event": event_type,
                "ip_address": f"203.0.113.{random.randint(1, 254)}",
                "device_label": random.choice(devices),
                "location": random.choice(locations),
                "risk_score": risk,
                "risk_verdict": verdict,
                "occurred_at": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
        )

    events.sort(key=lambda e: e["occurred_at"], reverse=True)
    total = len(events)
    page = events[offset : offset + limit]
    return page, total


# ── Daily Security Report ───────────────────────────────────────


def generate_daily_report(user_id: uuid.UUID, date: str | None = None) -> dict:
    _seed(user_id)
    report_date = date or datetime.now(UTC).strftime("%Y-%m-%d")
    base = datetime.now(UTC)

    return {
        "date": report_date,
        "summary": {
            "total_logins": random.randint(3, 12),
            "failed_logins": random.randint(0, 2),
            "new_devices": random.randint(0, 1),
            "challenges_issued": random.randint(0, 3),
            "blocked_attempts": random.randint(0, 1),
        },
        "active_devices": [
            {
                "device_id": _uid("dev", 0),
                "label": "Chrome on Windows",
                "trust": "trusted",
                "last_active": base.strftime("%Y-%m-%dT%H:%M:%SZ"),
            },
            {
                "device_id": _uid("dev", 1),
                "label": "Safari on iPhone",
                "trust": "recognized",
                "last_active": (base - timedelta(hours=random.randint(1, 12))).strftime("%Y-%m-%dT%H:%M:%SZ"),
            },
        ],
        "risk_verdict": random.choice(["low", "low", "medium"]),
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ── Security Overview ───────────────────────────────────────────


def generate_security_overview(user_id: uuid.UUID) -> dict:
    _seed(user_id)
    return {
        "active_sessions": random.randint(1, 4),
        "trusted_devices": random.randint(1, 3),
        "flagged_events_24h": random.randint(0, 3),
        "risk_trend": random.choice(["improving", "stable", "stable", "degrading"]),
        "last_assessment_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ── Login Analytics ─────────────────────────────────────────────


def generate_login_analytics(user_id: uuid.UUID, period_days: int = 30) -> dict:
    _seed(user_id)
    locations = [
        {"location": "New York, US", "risk": "low"},
        {"location": "Boston, US", "risk": "low"},
        {"location": "San Francisco, US", "risk": "medium"},
        {"location": "London, UK", "risk": "medium"},
        {"location": "Berlin, DE", "risk": "high"},
    ]

    hourly = []
    for hour in range(24):
        # Business-hours bias
        base_count = 4 if 8 <= hour <= 18 else 1
        hourly.append({"hour": hour, "count": base_count + random.randint(0, 3)})

    by_location = []
    for loc in locations[: random.randint(2, 5)]:
        by_location.append({**loc, "count": random.randint(1, 15)})

    return {
        "total_logins": sum(h["count"] for h in hourly),
        "unique_devices": random.randint(2, 5),
        "unique_locations": len(by_location),
        "hourly_distribution": hourly,
        "by_location": by_location,
        "period_days": period_days,
    }


# ── Device Health ───────────────────────────────────────────────


def generate_device_health(user_id: uuid.UUID) -> tuple[list[dict], int]:
    _seed(user_id)
    base = datetime.now(UTC)
    templates = [
        ("Chrome on Windows", 9.2, 48, "keep"),
        ("Safari on iPhone", 7.8, 32, "keep"),
        ("Firefox on Ubuntu", 4.1, 8, "review"),
        ("Edge on Surface", 6.5, 12, "keep"),
        ("Chrome on MacBook", 2.8, 3, "review"),
        ("Unknown Android WebView", 1.2, 1, "revoke"),
    ]

    devices = []
    flagged = 0
    for i, (label, trust, sessions, rec) in enumerate(templates):
        last_active_h = random.randint(1, 240)
        devices.append(
            {
                "device_id": _uid("dev", i),
                "label": label,
                "trust_score": round(trust + random.uniform(-0.5, 0.5), 1),
                "session_count": sessions + random.randint(-3, 3),
                "last_active": (base - timedelta(hours=last_active_h)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "recommendation": rec,
            }
        )
        if rec != "keep":
            flagged += 1

    devices.sort(key=lambda d: d["trust_score"], reverse=True)
    return devices, flagged
