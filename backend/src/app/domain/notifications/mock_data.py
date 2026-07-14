"""Deterministic notification mock data."""

from __future__ import annotations

import hashlib
import random
import uuid
from datetime import UTC, datetime, timedelta


def _seed(user_id: uuid.UUID) -> None:
    digest = hashlib.md5(str(user_id).encode()).hexdigest()
    random.seed(int(digest[:8], 16))


_TEMPLATES = [
    ("security", "info", "Passive re-auth succeeded", "Background behavioral check passed. Session extended silently.", None, None),
    ("security", "warn", "New device detected", "Safari on iPhone logged in from Boston, US. If this wasn't you, review your sessions.", "/app/guard", "Review"),
    ("banking", "info", "Paycheck deposited", "$7,200 deposited to Primary Checking from ACME Corp Payroll.", "/app/transactions", "View"),
    ("banking", "warn", "Budget alert: Dining +22%", "Dining spending is 22% above your monthly average. Consider adjusting your budget.", "/app/budgets", "Adjust"),
    ("insight", "info", "Portfolio update", "Your Growth Portfolio gained 4.2% this quarter. AAPL and SPY led gains.", "/app/investments", "View holdings"),
    ("banking", "info", "Transfer completed", "$500.00 sent to Jane Smith (Chase ****4321). Reference: Rent June.", "/app/transactions", "View"),
    ("security", "warn", "Login from unusual location", "Account accessed from San Francisco, US — no prior activity from this region.", "/app/guard", "Review"),
    ("system", "info", "Monthly statement ready", "Your June 2026 account statement is available for download.", "/app/statements", "Download"),
    ("banking", "info", "Savings goal reached", "Rainy Day Savings reached $138,900 — 93% of your $150K target.", "/app/savings", "View"),
    ("security", "critical", "Concurrent session warning", "Your account has active sessions in 3 countries simultaneously. Review immediately.", "/app/guard/sessions", "Review sessions"),
    ("insight", "info", "Spending pattern detected", "Your grocery spending peaks on Sundays. Try midweek shops to avoid crowds.", None, None),
    ("banking", "warn", "Mortgage payment due", "Your mortgage payment of $2,450 is due in 3 days. Ensure sufficient funds.", "/app/payments", "Pay now"),
    ("system", "info", "Password changed", "Your account password was changed successfully from Chrome on Windows.", None, None),
    ("security", "info", "Device trust upgraded", "Chrome on Windows is now a trusted device after 30 days of normal behavior.", "/app/guard/devices", "View devices"),
    ("banking", "info", "Recurring payment processed", "Netflix subscription — $15.99 charged to your Primary Checking.", "/app/transactions", "View"),
]


def generate_notifications(
    user_id: uuid.UUID, limit: int = 20, offset: int = 0, unread_only: bool = False
) -> tuple[list[dict], int, int]:
    _seed(user_id)
    base = datetime.now(UTC)

    all_notifications = []
    for i, (ntype, severity, title, body, path, label) in enumerate(_TEMPLATES):
        created = base - timedelta(hours=i * 4 + random.randint(0, 3))
        is_read = random.random() < 0.6 if i > 3 else False
        all_notifications.append({
            "id": f"notif_{hashlib.md5(f'{user_id}_{i}'.encode()).hexdigest()[:12]}",
            "type": ntype,
            "severity": severity,
            "title": title,
            "body": body,
            "action_label": label,
            "action_path": path,
            "read": is_read,
            "created_at": created.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })

    all_notifications.sort(key=lambda n: n["created_at"], reverse=True)

    if unread_only:
        all_notifications = [n for n in all_notifications if not n["read"]]

    total = len(all_notifications)
    unread_count = sum(1 for n in all_notifications if not n["read"])
    page = all_notifications[offset:offset + limit]
    return page, total, unread_count


def generate_preferences() -> dict:
    return {
        "channels": ["push", "email"],
        "categories": {"security": True, "banking": True, "insight": True, "system": True},
        "quiet_hours_enabled": False,
        "quiet_start": "22:00",
        "quiet_end": "07:00",
    }
