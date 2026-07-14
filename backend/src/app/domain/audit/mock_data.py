"""Audit trail mock data — snake_case keys matching Pydantic field names."""

from __future__ import annotations

import random
import uuid
from datetime import UTC, datetime, timedelta


def _seed() -> None:
    random.seed(42)


def _uid(prefix: str, idx: int) -> str:
    return f"{prefix}_{idx:04x}"


_AUDIT_ACTIONS = [
    ("admin@bankdemo.com", "user.suspend", "users", "Suspended user carol.wu@bankdemo.com"),
    ("system", "risk.block", "sessions", "Auto-blocked session from Lagos, NG"),
    ("admin@bankdemo.com", "role.update", "roles", "Added admin role to bob.kumar@bankdemo.com"),
    ("system", "token.revoke", "sessions", "Bulk-revoked 3 sessions for compromised account"),
    ("admin@bankdemo.com", "control.update", "controls", "Enabled concurrent session limit"),
    ("system", "model.deploy", "models", "Deployed keystroke-lgbm v2.4.1 to production"),
    ("admin@bankdemo.com", "report.generate", "reports", "Generated weekly risk report"),
    ("system", "incident.create", "incidents", "Auto-created incident: credential stuffing"),
    ("admin@bankdemo.com", "user.create", "users", "Created admin account for security-team"),
    ("system", "dataset.update", "datasets", "Updated session-meta dataset with 42K new samples"),
    ("system", "session.revoke", "sessions", "Bulk session revocation for security incident"),
    ("admin@bankdemo.com", "control.disable", "controls", "Disabled concurrent session limit"),
    ("admin@bankdemo.com", "user.login", "users", "Admin login from Chrome on Windows"),
    ("system", "risk.challenge", "sessions", "MFA challenge issued for unusual geo-hop"),
    ("system", "notification.send", "notifications", "Sent critical alert to security operations"),
]


def generate_audit_entries(
    limit: int = 20,
    offset: int = 0,
    actor: str | None = None,
    action: str | None = None,
    resource: str | None = None,
    outcome: str | None = None,
) -> tuple[list[dict], int]:
    _seed()
    base = datetime.now(UTC)

    entries = []
    for i, (act, act_type, res, detail) in enumerate(_AUDIT_ACTIONS):
        occurred = base - timedelta(hours=i * 3 + random.randint(0, 2))
        entry_outcome = "failure" if "block" in act_type or "revoke" in act_type else "success"

        entries.append({
            "id": _uid("audit", i),
            "actor": act,
            "actor_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, act)) if act != "system" else None,
            "action": act_type,
            "resource": res,
            "resource_id": _uid("res", random.randint(1, 100)),
            "details": {"summary": detail},
            "ip_address": f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}" if act != "system" else None,
            "user_agent": "AdminDashboard/2.4" if act != "system" else None,
            "outcome": entry_outcome,
            "time": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })

    entries.sort(key=lambda x: x["time"], reverse=True)

    # Apply filters
    filtered = entries
    if actor:
        filtered = [e for e in filtered if e["actor"] == actor]
    if action:
        filtered = [e for e in filtered if e["action"] == action]
    if resource:
        filtered = [e for e in filtered if e["resource"] == resource]
    if outcome:
        filtered = [e for e in filtered if e["outcome"] == outcome]

    total = len(filtered)
    page = filtered[offset:offset + limit]
    return page, total
