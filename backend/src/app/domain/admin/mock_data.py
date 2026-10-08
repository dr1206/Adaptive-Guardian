"""Deterministic mock data for the admin platform. All dict keys use snake_case
matching Pydantic field names — serialization_alias handles camelCase output."""

from __future__ import annotations

import hashlib
import random
import uuid
from datetime import UTC, datetime, timedelta


def _seed(user_id: uuid.UUID | None = None) -> None:
    if user_id:
        digest = hashlib.md5(str(user_id).encode()).hexdigest()
        random.seed(int(digest[:8], 16))
    else:
        random.seed(42)


def _uid(prefix: str, idx: int) -> str:
    return f"{prefix}_{idx:04x}"


def _series(n: int, min_v: float, max_v: float) -> list[float]:
    _seed()
    v = (min_v + max_v) / 2
    out: list[float] = []
    for _ in range(n):
        v = v * 0.7 + (min_v + random.random() * (max_v - min_v)) * 0.3
        out.append(round(v, 2))
    return out


# ── KPIs ───────────────────────────────────────────────────────


def generate_kpis() -> dict:
    _seed()
    return {
        "total_users": {"label": "Total Users", "value": "12,847", "delta": "+342", "tone": "up"},
        "active_sessions": {"label": "Active Sessions", "value": "1,203", "delta": "+12%", "tone": "up"},
        "risk_events_today": {"label": "Risk Events Today", "value": "47", "delta": "-8", "tone": "neutral"},
        "blocked_attempts": {"label": "Blocked Attempts", "value": "12", "delta": "+3", "tone": "warn"},
        "mfa_challenges": {"label": "MFA Challenges", "value": "231", "delta": "+18%", "tone": "neutral"},
        "avg_confidence": {"label": "Avg Confidence", "value": "94.2%", "delta": "+0.3%", "tone": "up"},
    }


# ── Global Metrics ─────────────────────────────────────────────


def generate_global_metrics(period: str = "7d") -> dict:
    _seed()
    n = {"24h": 24, "7d": 168, "30d": 720}.get(period, 168)
    series = [
        {"id": "logins", "label": "Logins", "value": "12,847", "delta": "+12%", "signal": "ok", "series": _series(n, 50, 200)},
        {"id": "risk_events", "label": "Risk Events", "value": "47", "delta": "-8", "signal": "watch", "series": _series(n, 2, 12)},
        {"id": "challenges", "label": "Challenges", "value": "231", "delta": "+18%", "signal": "ok", "series": _series(n, 5, 25)},
        {"id": "blocks", "label": "Blocks", "value": "12", "delta": "+3", "signal": "alert", "series": _series(n, 0, 5)},
    ]
    return {"series": series, "period": period}


# ── Sessions ───────────────────────────────────────────────────


def generate_admin_sessions(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    _seed()
    names = ["Alice Chen", "Bob Kumar", "Carol Wu", "David Smith", "Eve Johnson",
             "Frank Li", "Grace Park", "Henry Jones", "Iris Kim", "Jack Brown"]
    base = datetime.now(UTC)
    sessions = []
    total = 87

    for i in range(offset, min(offset + limit, total)):
        s = {
            "session_id": _uid("adm_ses", i),
            "user_email": f"user{i}@bankdemo.com",
            "user_name": random.choice(names),
            "ip_address": f"203.0.113.{random.randint(1, 254)}",
            "device_label": random.choice(["Chrome on Windows", "Safari on iPhone", "Firefox on Ubuntu", "Edge on Surface"]),
            "risk_score": round(random.uniform(0.02, 0.35), 2),
            "risk_verdict": random.choice(["allow", "allow", "allow", "challenge"]),
            "active_since": (base - timedelta(hours=random.randint(1, 72))).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "last_active": (base - timedelta(minutes=random.randint(1, 30))).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        sessions.append(s)
    return sessions, total


# ── Users ──────────────────────────────────────────────────────


def generate_admin_users(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    _seed()
    names = ["Alice Chen", "Bob Kumar", "Carol Wu", "David Smith", "Eve Johnson",
             "Frank Li", "Grace Park", "Henry Jones", "Iris Kim", "Jack Brown",
             "Kate Adams", "Leo Martinez", "Mia Thompson", "Noah Garcia", "Olivia Lee"]
    base = datetime.now(UTC)
    users = []
    total = 12_847

    for i in range(offset, min(offset + limit, total)):
        name = random.choice(names)
        u = {
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user_{i}")),
            "email": f"{name.lower().replace(' ', '.')}@bankdemo.com",
            "full_name": name,
            "roles": ["user"] if random.random() > 0.05 else ["user", "admin"],
            "is_active": random.random() > 0.02,
            "is_verified": True,
            "enrollment_status": random.choice(["complete", "complete", "complete", "pending"]),
            "last_login": (base - timedelta(hours=random.randint(1, 720))).strftime("%Y-%m-%dT%H:%M:%SZ") if random.random() > 0.1 else None,
            "created_at": (base - timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "risk_level": random.choice(["low", "low", "low", "medium", "high"]),
        }
        users.append(u)
    return users, total


# ── Incidents ──────────────────────────────────────────────────

_INCIDENT_TEMPLATES = [
    ("critical", "open", "Account takeover suspected", "3 concurrent sessions from US, DE, BR"),
    ("warn", "investigating", "Credential stuffing pattern detected", "42 failed logins across 18 accounts from same /24 subnet"),
    ("critical", "resolved", "Admin API key leaked to GitHub", "Key found in public repo. Rotated within 4 minutes."),
    ("warn", "open", "New device enrollment spike", "8 new device enrollments in 10 minutes"),
    ("info", "resolved", "Geo-hop: NYC to Singapore in 8 min", "Legitimate VPN exit node switch. User confirmed."),
    ("warn", "investigating", "Unusual transfer velocity", "3 large transfers in 15 minutes from same account"),
    ("critical", "open", "Brute-force on admin portal", "114 failed admin login attempts in 5 minutes"),
    ("info", "resolved", "Password reset storm", "7 password reset requests for same account in 2 minutes"),
]


def generate_incidents(limit: int = 20, offset: int = 0) -> tuple[list[dict], int, int]:
    _seed()
    base = datetime.now(UTC)
    incidents = []
    for i, (severity, status, title, detail) in enumerate(_INCIDENT_TEMPLATES):
        created = base - timedelta(hours=i * 8 + random.randint(1, 4))
        resolved = (created + timedelta(hours=random.randint(1, 12))).strftime("%Y-%m-%dT%H:%M:%SZ") if status == "resolved" else None
        incidents.append({
            "id": _uid("inc", i),
            "severity": severity,
            "status": status,
            "title": title,
            "detail": detail,
            "user_email": f"user{random.randint(1, 50)}@bankdemo.com" if random.random() > 0.3 else None,
            "session_id": _uid("ses", random.randint(1, 10)) if random.random() > 0.3 else None,
            "created_at": created.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "resolved_at": resolved,
        })
    incidents.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(incidents)
    open_count = sum(1 for i in incidents if i["status"] != "resolved")
    return incidents[offset:offset+limit], total, open_count


# ── Models ─────────────────────────────────────────────────────


def generate_models() -> list[dict]:
    _seed()
    base = datetime.now(UTC)
    return [
        {
            "id": "model-weighted-fusion",
            "name": "Weighted Fusion (LightGBM + User-Specific OC-SVM)",
            "status": "deployed",
            "trained": (base - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "dataset": "ds-4users-canonical",
            "versions": [
                {
                    "version": "v2.6.0-weighted-fusion",
                    "status": "active",
                    "trained": (base - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "dataset": "ds-4users-canonical",
                    "accuracy": 0.932,
                    "precision": 0.820,
                    "recall": 0.875,
                    "f1": 0.843,
                    "latency_ms": 0.023,
                    "memory_mb": 64,
                },
                {
                    "version": "v2.5.0-rc",
                    "status": "retired",
                    "trained": (base - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "dataset": "ds-4users-v1",
                    "accuracy": 0.907,
                    "precision": 0.784,
                    "recall": 0.812,
                    "f1": 0.798,
                    "latency_ms": 0.025,
                    "memory_mb": 64,
                },
            ],
        },
        {
            "id": "model-lgbm-supervised",
            "name": "LightGBM Supervised Component",
            "status": "deployed",
            "trained": (base - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "dataset": "ds-4users-canonical",
            "versions": [
                {
                    "version": "v2.6.0-lightgbm",
                    "status": "active",
                    "trained": (base - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "dataset": "ds-4users-canonical",
                    "accuracy": 0.882,
                    "precision": 0.674,
                    "recall": 0.868,
                    "f1": 0.754,
                    "latency_ms": 0.026,
                    "memory_mb": 48,
                },
            ],
        },
        {
            "id": "model-ocsvm-anomaly",
            "name": "One-Class SVM Novelty Detector",
            "status": "deployed",
            "trained": (base - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "dataset": "ds-4users-canonical",
            "versions": [
                {
                    "version": "v2.6.0-ocsvm",
                    "status": "active",
                    "trained": (base - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "dataset": "ds-4users-canonical",
                    "accuracy": 0.630,
                    "precision": 0.315,
                    "recall": 0.636,
                    "f1": 0.420,
                    "latency_ms": 0.004,
                    "memory_mb": 16,
                },
            ],
        },
    ]


# ── Datasets ───────────────────────────────────────────────────


def generate_datasets() -> list[dict]:
    _seed()
    base = datetime.now(UTC)
    return [
        {"id": "ds-keystroke", "version": "v4", "samples": 4_200_000, "users": 8_241, "sessions": 42_000, "features": 128, "quality": 0.94, "duplicates": 0.03, "coverage": 0.88, "created": (base - timedelta(days=90)).strftime("%Y-%m-%dT%H:%M:%SZ"), "status": "active"},
        {"id": "ds-mouse", "version": "v3", "samples": 3_100_000, "users": 7_890, "sessions": 38_000, "features": 96, "quality": 0.91, "duplicates": 0.05, "coverage": 0.85, "created": (base - timedelta(days=75)).strftime("%Y-%m-%dT%H:%M:%SZ"), "status": "active"},
        {"id": "ds-session", "version": "v2", "samples": 12_500_000, "users": 12_300, "sessions": 156_000, "features": 256, "quality": 0.96, "duplicates": 0.01, "coverage": 0.92, "created": (base - timedelta(days=60)).strftime("%Y-%m-%dT%H:%M:%SZ"), "status": "active"},
        {"id": "ds-combined", "version": "v1", "samples": 8_900_000, "users": 6_500, "sessions": 72_000, "features": 512, "quality": 0.89, "duplicates": 0.08, "coverage": 0.80, "created": (base - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ"), "status": "processing"},
    ]


# ── API Services ───────────────────────────────────────────────


def generate_api_services() -> dict:
    _seed()
    services = [
        {"name": "auth-service", "status": "healthy", "latency": {"p50": 12.1, "p95": 28.4, "p99": 45.2}, "error_rate": 0.001, "uptime": 99.97, "series": _series(48, 8, 30)},
        {"name": "banking-service", "status": "healthy", "latency": {"p50": 18.3, "p95": 42.1, "p99": 78.5}, "error_rate": 0.002, "uptime": 99.95, "series": _series(48, 10, 50)},
        {"name": "aegis-scoring", "status": "healthy", "latency": {"p50": 45.7, "p95": 98.2, "p99": 145.3}, "error_rate": 0.005, "uptime": 99.82, "series": _series(48, 30, 120)},
        {"name": "notification-service", "status": "degraded", "latency": {"p50": 210.5, "p95": 580.2, "p99": 920.1}, "error_rate": 0.042, "uptime": 97.41, "series": _series(48, 50, 800)},
        {"name": "redis-cache", "status": "healthy", "latency": {"p50": 0.8, "p95": 1.5, "p99": 2.1}, "error_rate": 0.0, "uptime": 99.99, "series": _series(48, 0.5, 2.5)},
        {"name": "mongodb-atlas", "status": "healthy", "latency": {"p50": 4.2, "p95": 8.1, "p99": 14.3}, "error_rate": 0.0, "uptime": 99.99, "series": _series(48, 2, 10)},
    ]
    return {"services": services, "overall": "degraded" if any(s["status"] == "degraded" for s in services) else "healthy"}


# ── Controls ───────────────────────────────────────────────────


def generate_controls() -> list[dict]:
    return [
        {"id": "ctrl-keystroke", "framework": "SOC 2 — CC6.1", "coverage": 94.0, "status": "ok", "evidence": 42, "owner": "Alice Chen", "next": "2026-08-15", "enabled": True, "actions": ["read", "review"]},
        {"id": "ctrl-mouse", "framework": "SOC 2 — CC6.1", "coverage": 88.0, "status": "ok", "evidence": 35, "owner": "Bob Kumar", "next": "2026-08-20", "enabled": True, "actions": ["read", "review"]},
        {"id": "ctrl-geo", "framework": "PCI DSS — 7.2", "coverage": 72.0, "status": "watch", "evidence": 18, "owner": "Carol Wu", "next": "2026-07-30", "enabled": True, "actions": ["read", "review"]},
        {"id": "ctrl-device-fp", "framework": "ISO 27001 — A.9.4", "coverage": 95.0, "status": "ok", "evidence": 56, "owner": "David Smith", "next": "2026-09-01", "enabled": True, "actions": ["read", "review"]},
        {"id": "ctrl-ip-reputation", "framework": "PCI DSS — 7.2", "coverage": 45.0, "status": "alert", "evidence": 12, "owner": "Eve Johnson", "next": "2026-07-15", "enabled": True, "actions": ["read", "review"]},
        {"id": "ctrl-session-limit", "framework": "ISO 27001 — A.9.2", "coverage": 30.0, "status": "critical", "evidence": 5, "owner": "Frank Li", "next": "2026-07-01", "enabled": True, "actions": ["read", "review"]},
    ]


# ── Report Templates ───────────────────────────────────────────


def generate_report_templates() -> list[dict]:
    return [
        {"name": "Daily Security Summary", "cadence": "daily", "last": "2026-06-30 06:00", "owner": "System", "format": "pdf"},
        {"name": "Weekly Risk Report", "cadence": "weekly", "last": "2026-06-24 07:00", "owner": "Alice Chen", "format": "pdf"},
        {"name": "User Activity Export", "cadence": "on-demand", "last": "2026-06-29 14:22", "owner": "Bob Kumar", "format": "csv"},
        {"name": "Model Health Dashboard", "cadence": "weekly", "last": "2026-06-28 08:00", "owner": "System", "format": "pdf"},
        {"name": "Audit Log Export", "cadence": "daily", "last": "2026-06-30 00:00", "owner": "System", "format": "json"},
    ]


# ── Audit ──────────────────────────────────────────────────────


def generate_audit_log(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    _seed()
    base = datetime.now(UTC)
    actions = [
        ("admin@bankdemo.com", "user.suspend", "users", "Suspended user carol.wu@bankdemo.com", "success"),
        ("system", "risk.block", "sessions", "Auto-blocked session from Lagos, NG", "success"),
        ("admin@bankdemo.com", "role.update", "roles", "Added admin role to bob.kumar@bankdemo.com", "success"),
        ("system", "token.revoke", "sessions", "Bulk-revoked 3 sessions for compromised account", "success"),
        ("admin@bankdemo.com", "control.update", "controls", "Enabled concurrent session limit", "success"),
        ("system", "model.deploy", "models", "Deployed keystroke-lgbm v2.4.1 to production", "success"),
        ("admin@bankdemo.com", "report.generate", "reports", "Generated weekly risk report", "success"),
        ("system", "incident.create", "incidents", "Auto-created incident: credential stuffing", "success"),
        ("admin@bankdemo.com", "user.create", "users", "Created admin account for security-team", "failure"),
        ("system", "dataset.update", "datasets", "Updated session-meta dataset with 42K new samples", "success"),
    ]
    entries = []
    for i, (actor, action, resource, detail, outcome) in enumerate(actions):
        entries.append({
            "id": _uid("audit", i),
            "actor": actor,
            "action": action,
            "resource": resource,
            "detail": detail,
            "outcome": outcome,
            "ip_address": f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}" if actor != "system" else None,
            "created_at": (base - timedelta(hours=i * 3 + random.randint(0, 2))).strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(entries)
    return entries[offset:offset+limit], total


# ── Challenge Reasons ──────────────────────────────────────────


def generate_challenge_reasons() -> list[dict]:
    return [
        {"reason": "mouse_velocity_anomaly", "count": 342, "rate": 0.12},
        {"reason": "keystroke_rhythm_drift", "count": 287, "rate": 0.10},
        {"reason": "new_device_fingerprint", "count": 198, "rate": 0.07},
        {"reason": "unusual_login_hour", "count": 156, "rate": 0.05},
        {"reason": "impossible_travel", "count": 73, "rate": 0.03},
        {"reason": "copy_paste_burst", "count": 41, "rate": 0.01},
    ]


# ── Challenges ─────────────────────────────────────────────────


def generate_challenges(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    _seed()
    base = datetime.now(UTC)
    total = 156
    challenges = []
    for i in range(offset, min(offset + limit, total)):
        outcome = random.choice(["passed", "passed", "passed", "pending", "failed"])
        ts = base - timedelta(hours=random.randint(1, 72))
        challenges.append({
            "id": _uid("ch", i),
            "when": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "user": f"user{random.randint(1, 500)}@bankdemo.com",
            "reason": random.choice(["mouse_velocity_anomaly", "keystroke_rhythm_drift", "new_device_fingerprint", "impossible_travel", "unusual_login_hour"]),
            "confidence": round(random.uniform(0.55, 0.99), 2),
            "outcome": outcome,
            "duration": f"{random.randint(1, 15)}s",
            "device": random.choice(["Chrome on Windows", "Safari on iPhone", "Firefox on Ubuntu", "Edge on Surface"]),
        })
    challenges.sort(key=lambda x: x["when"], reverse=True)
    return challenges, total


# ── Roles ──────────────────────────────────────────────────────


def generate_roles() -> list[dict]:
    return [
        {"id": "role-admin", "label": "Admin", "members": 12, "user_count": 12, "color": "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)", "description": "Full platform access including user management, security controls, and audit"},
        {"id": "role-security-analyst", "label": "Security Analyst", "members": 8, "user_count": 8, "color": "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)", "description": "View security dashboards, incidents, risk events, and audit logs"},
        {"id": "role-compliance", "label": "Compliance Officer", "members": 5, "user_count": 5, "color": "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", "description": "Read-only access to audit logs, reports, and user activity"},
        {"id": "role-support", "label": "Support Agent", "members": 24, "user_count": 24, "color": "linear-gradient(135deg, #059669 0%, #10B981 100%)", "description": "View user sessions, devices, and login history for troubleshooting"},
        {"id": "role-user", "label": "User", "members": 12798, "user_count": 12798, "color": "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)", "description": "Standard banking platform access"},
    ]


# ── Permissions ────────────────────────────────────────────────


def generate_permissions() -> list[dict]:
    return [
        {"resource": "users", "action": "read", "actions": ["read", "write", "suspend"]},
        {"resource": "sessions", "action": "read", "actions": ["read", "revoke"]},
        {"resource": "incidents", "action": "read", "actions": ["read", "create", "resolve"]},
        {"resource": "controls", "action": "read", "actions": ["read", "write"]},
        {"resource": "audit", "action": "read", "actions": ["read", "export"]},
        {"resource": "models", "action": "read", "actions": ["read", "deploy", "retire"]},
        {"resource": "reports", "action": "generate", "actions": ["generate", "schedule"]},
        {"resource": "datasets", "action": "read", "actions": ["read", "create", "update"]},
        {"resource": "roles", "action": "read", "actions": ["read", "write"]},
    ]


# ── Role Permissions ───────────────────────────────────────────


def generate_role_permissions() -> list[dict]:
    return [
        {"role": "role-admin", "role_id": "role-admin", "permissions": [
            "users:read", "users:write", "users:suspend",
            "sessions:read", "sessions:revoke",
            "incidents:read", "incidents:create", "incidents:resolve",
            "controls:read", "controls:write",
            "audit:read", "audit:export",
            "models:read", "models:deploy", "models:retire",
            "reports:generate", "reports:schedule",
            "datasets:read", "datasets:create", "datasets:update",
            "roles:read", "roles:write",
        ], "permission_ids": [
            "users:read", "users:write", "users:suspend",
            "sessions:read", "sessions:revoke",
            "incidents:read", "incidents:create", "incidents:resolve",
            "controls:read", "controls:write",
            "audit:read", "audit:export",
            "models:read", "models:deploy", "models:retire",
            "reports:generate", "reports:schedule",
            "datasets:read", "datasets:create", "datasets:update",
            "roles:read", "roles:write",
        ]},
        {"role": "role-security-analyst", "role_id": "role-security-analyst", "permissions": [
            "users:read", "sessions:read", "sessions:revoke",
            "incidents:read", "incidents:create", "incidents:resolve",
            "controls:read", "audit:read", "reports:generate",
        ], "permission_ids": [
            "users:read", "sessions:read", "sessions:revoke",
            "incidents:read", "incidents:create", "incidents:resolve",
            "controls:read", "audit:read", "reports:generate",
        ]},
        {"role": "role-compliance", "role_id": "role-compliance", "permissions": [
            "users:read", "audit:read", "audit:export", "reports:generate",
        ], "permission_ids": [
            "users:read", "audit:read", "audit:export", "reports:generate",
        ]},
        {"role": "role-support", "role_id": "role-support", "permissions": [
            "users:read", "sessions:read", "incidents:read",
        ], "permission_ids": [
            "users:read", "sessions:read", "incidents:read",
        ]},
        {"role": "role-user", "role_id": "role-user", "permissions": [], "permission_ids": []},
    ]


# ── Notification Groups ────────────────────────────────────────


def generate_notification_groups() -> list[dict]:
    return [
        {"id": "ng-sec-ops", "label": "Security Operations", "count": 8, "signal": "ok"},
        {"id": "ng-compliance", "label": "Compliance Team", "count": 5, "signal": "ok"},
        {"id": "ng-oncall", "label": "On-Call Rotation", "count": 4, "signal": "watch"},
        {"id": "ng-all-users", "label": "All Users", "count": 12847, "signal": "alert"},
    ]


# ── Geo Dots ───────────────────────────────────────────────────


def generate_geo_dots() -> dict:
    _seed()
    base = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    dots = [
        {"x": 0.21, "y": 0.38, "lat": 40.71, "lng": -74.00, "intensity": 0.92, "anomaly": False},   # US East
        {"x": 0.05, "y": 0.42, "lat": 37.77, "lng": -122.41, "intensity": 0.78, "anomaly": False},  # US West
        {"x": 0.46, "y": 0.28, "lat": 51.50, "lng": -0.12, "intensity": 0.55, "anomaly": False},    # UK
        {"x": 0.50, "y": 0.30, "lat": 52.52, "lng": 13.40, "intensity": 0.42, "anomaly": False},    # DE
        {"x": 0.82, "y": 0.35, "lat": 35.68, "lng": 139.69, "intensity": 0.38, "anomaly": False},   # JP
        {"x": 0.88, "y": 0.62, "lat": -33.86, "lng": 151.20, "intensity": 0.25, "anomaly": False},  # AU
        {"x": 0.48, "y": 0.58, "lat": 6.52, "lng": 3.37, "intensity": 0.15, "anomaly": True},      # NG
        {"x": 0.58, "y": 0.25, "lat": 55.75, "lng": 37.61, "intensity": 0.20, "anomaly": True},     # RU
        {"x": 0.66, "y": 0.48, "lat": 28.61, "lng": 77.20, "intensity": 0.48, "anomaly": False},    # IN
        {"x": 0.32, "y": 0.68, "lat": -23.55, "lng": -46.63, "intensity": 0.35, "anomaly": False},  # BR
        {"x": 0.47, "y": 0.32, "lat": 48.85, "lng": 2.35, "intensity": 0.44, "anomaly": False},     # FR
        {"x": 0.74, "y": 0.52, "lat": 1.35, "lng": 103.81, "intensity": 0.30, "anomaly": False},    # SG
    ]
    return {"dots": dots, "generated_at": base}


# ── Infra ──────────────────────────────────────────────────────


def generate_infra() -> dict:
    _seed()
    return {
        "region": "us-east-1",
        "cpu": {"value": 42.1, "series": _series(48, 30, 55)},
        "memory": {"value": 67.8, "series": _series(48, 55, 80)},
        "disk": {"value": 55.2, "series": _series(48, 48, 62)},
        "gpu": {"value": 23.4, "series": _series(48, 10, 35)},
        "network": {"value": 38.9, "series": _series(48, 25, 50)},
        "containers": 24,
        "workers": 8,
        "inference_queue": 12,
        "jobs_running": 42,
        "jobs_queued": 7,
        "jobs_failed": 2,
        "components": [
            {"name": "mongodb-cluster", "status": "healthy", "kind": "database"},
            {"name": "redis-cache", "status": "healthy", "kind": "cache"},
            {"name": "aegis-inference-queue", "status": "healthy", "kind": "queue"},
            {"name": "model-storage-s3", "status": "healthy", "kind": "storage"},
            {"name": "inference-worker-nodes", "status": "healthy", "kind": "compute"},
        ],
    }


# ── Admin Accounts ─────────────────────────────────────────────


def generate_admin_accounts(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    _seed()
    base = datetime.now(UTC)
    templates = [
        ("Eleanor Voss", "Current", 142750.50, "USD", "active"),
        ("Marcus Chen", "Savings", 897200.00, "USD", "active"),
        ("Sovereign Wealth Holdings", "Treasury", 2487102.12, "USD", "active"),
        ("Julia Adebayo", "Card", 3250.75, "USD", "active"),
        ("Nordic Exports Ltd", "FX", 1560000.00, "EUR", "active"),
        ("Carlos Mendez", "Loan", -48500.00, "USD", "active"),
        ("Aisha Patel", "Current", 23400.00, "GBP", "active"),
        ("Blackstone Partners", "Treasury", 5100000.00, "USD", "active"),
        ("Yuki Tanaka", "Savings", 1230000.00, "JPY", "active"),
        ("David Okonkwo", "Current", 8750.00, "USD", "frozen"),
        ("Sophie Laurent", "FX", 320000.00, "EUR", "AML review"),
        ("Pinnacle REIT", "Treasury", 9800000.00, "USD", "active"),
        ("Raj Krishnan", "Card", 12750.00, "USD", "active"),
        ("Maria Santos", "Savings", 450000.00, "USD", "active"),
        ("Omega Trading Co", "Current", 67800.00, "USD", "AML review"),
        ("Thomas Berg", "Loan", -125000.00, "EUR", "active"),
        ("Linh Nguyen", "FX", 2100000.00, "VND", "active"),
        ("Atlas Ventures", "Treasury", 3450000.00, "USD", "active"),
        ("Fatima Al-Rashid", "Savings", 675000.00, "USD", "active"),
        ("James Wright", "Card", 890.00, "USD", "frozen"),
    ]
    accounts = []
    for i, (holder, product, balance, currency, flags) in enumerate(templates):
        if i < offset:
            continue
        if len(accounts) >= limit:
            break
        opened = base - timedelta(days=random.randint(30, 1200))
        accounts.append({
            "id": f"ACC-{1000 + i:04d}",
            "holder": holder,
            "product": product,
            "balance": balance,
            "currency": currency,
            "flags": flags,
            "opened": opened.strftime("%Y-%m-%d"),
        })
    return accounts, len(templates)


# ── Anomaly Signatures ─────────────────────────────────────────


def generate_anomaly_signatures() -> list[dict]:
    _seed()
    base = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    return [
        {"id": "sig-1", "name": "Hold Time Drift", "channel": "keystroke", "threshold_sigma": 2.5, "description": "Key press duration exceeds normal envelope", "count": 87, "trigger_count_24h": 87, "last": base, "severity": "watch"},
        {"id": "sig-2", "name": "Flight Time Spike", "channel": "keystroke", "threshold_sigma": 2.8, "description": "Inter-key flight time hesitation", "count": 42, "trigger_count_24h": 42, "last": base, "severity": "watch"},
        {"id": "sig-3", "name": "Mouse Velocity Anomaly", "channel": "mouse", "threshold_sigma": 3.0, "description": "Cursor speed deviates from biological baseline", "count": 58, "trigger_count_24h": 58, "last": base, "severity": "alert"},
        {"id": "sig-4", "name": "Jerk Profile Mismatch", "channel": "mouse", "threshold_sigma": 2.7, "description": "Trajectory smoothness is robotic or uncharacteristic", "count": 31, "trigger_count_24h": 31, "last": base, "severity": "watch"},
        {"id": "sig-5", "name": "Excessive Session Age", "channel": "session", "threshold_sigma": 2.0, "description": "Session active without re-verification", "count": 0, "trigger_count_24h": 0, "last": "2026-06-01T00:00:00Z", "severity": "ok"},
        {"id": "sig-6", "name": "Impossible Geo-Hop", "channel": "geo", "threshold_sigma": 4.0, "description": "Location change violates physical speed limits", "count": 12, "trigger_count_24h": 12, "last": base, "severity": "critical"},
        {"id": "sig-7", "name": "Copy-Paste Burst", "channel": "keystroke", "threshold_sigma": 2.2, "description": "Rapid text buffer insertions", "count": 23, "trigger_count_24h": 23, "last": base, "severity": "alert"},
    ]
