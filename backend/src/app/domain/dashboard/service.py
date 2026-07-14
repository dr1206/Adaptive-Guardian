"""Dashboard aggregation service. Queries real banking, security, and notification data."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from app.domain.aegis.mock_data import generate_snapshot
from app.domain.banking import repository as banking_repo
from app.domain.banking.models import TransactionRecord as TransactionRecordDoc
from app.domain.dashboard.schemas import (
    AnalyticsResponse,
    CategorySlice,
    DashboardNotification,
    DashboardSummary,
    NotificationFeed,
    SummaryCard,
    TrendPoint,
    TrendResponse,
    TrendSeries,
)
from app.domain.notifications.models import Notification

_CATEGORY_COLORS: dict[str, str] = {
    "groceries": "#10B981",
    "dining": "#F59E0B",
    "transport": "#3B82F6",
    "utilities": "#8B5CF6",
    "shopping": "#EC4899",
    "subscriptions": "#06B6D4",
    "travel": "#F97316",
    "health": "#14B8A6",
    "entertainment": "#EF4444",
    "housing": "#6366F1",
    "payroll": "#22C55E",
    "freelance": "#A855F7",
    "investment": "#EAB308",
    "interest": "#84CC16",
    "transfer": "#78716C",
    "personal": "#D946EF",
    "electronics": "#0EA5E9",
}


def _category_color(cat: str) -> str:
    return _CATEGORY_COLORS.get(cat, "#6B7280")


def _fmt_dt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Summary ───────────────────────────────────────────────────


async def get_summary(user_id: uuid.UUID) -> DashboardSummary:
    accounts = await banking_repo.seed_accounts_if_empty(user_id)
    snapshot = generate_snapshot(user_id)

    total = sum(a.balance for a in accounts)
    savings = sum(a.balance for a in accounts if a.type == "savings")
    pending = sum(a.pending for a in accounts)

    # Compute actual total delta from account balances
    total_delta = sum(a.delta_pct for a in accounts) / max(len(accounts), 1) if accounts else 0
    savings_accounts = [a for a in accounts if a.type == "savings"]
    savings_delta = sum(a.delta_pct for a in savings_accounts) / max(len(savings_accounts), 1) if savings_accounts else 0
    tone_total = "up" if total_delta >= 0 else "down"
    tone_savings = "up" if savings_delta >= 0 else "down"

    return DashboardSummary(
        total_balance=SummaryCard(
            label="Total Balance",
            value=f"${total:,.2f}",
            delta=f"{total_delta:+.1f}%",
            tone=tone_total,
        ),
        savings_balance=SummaryCard(
            label="Savings",
            value=f"${savings:,.2f}",
            delta=f"{savings_delta:+.1f}%",
            tone=tone_savings,
        ),
        pending_count=SummaryCard(
            label="Pending",
            value=f"${pending:,.2f}",
            delta=None,
            tone="neutral",
        ),
        security_score=SummaryCard(
            label="Aegis Score",
            value=f"{snapshot['confidence'] * 100:.1f}%",
            delta="A+",
            tone="neutral" if snapshot["confidence"] > 0.9 else "warn",
        ),
        accounts_count=len(accounts),
    )


# ── Trends ────────────────────────────────────────────────────


async def get_trends(user_id: uuid.UUID, period: str = "7d") -> TrendResponse:
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)
    base = datetime.now(UTC)
    start = base - timedelta(days=days)

    txns = await banking_repo.seed_transactions_if_empty(user_id, limit=500)
    # Filter to relevant period
    txns = [t for t in txns if t.date >= start]

    # Bucket by date
    daily_income: dict[str, float] = {}
    daily_expense: dict[str, float] = {}
    accumulated = sum((await banking_repo.seed_accounts_if_empty(user_id))[0].balance for _ in [0]) if False else 0

    # Get initial accumulated from accounts before the trend window
    accounts = await banking_repo.seed_accounts_if_empty(user_id)
    accumulated = sum(a.balance for a in accounts)

    # Subtract all transactions in the window to get opening balance
    for t in txns:
        if t.type == "credit":
            accumulated -= t.amount
        else:
            accumulated += t.amount

    for t in txns:
        date_key = t.date.strftime("%Y-%m-%d")
        if t.type == "credit":
            daily_income[date_key] = daily_income.get(date_key, 0) + t.amount
        else:
            daily_expense[date_key] = daily_expense.get(date_key, 0) + abs(t.amount)

    income_points: list[TrendPoint] = []
    expense_points: list[TrendPoint] = []
    savings_points: list[TrendPoint] = []

    for d in range(days):
        date = start + timedelta(days=d)
        date_key = date.strftime("%Y-%m-%d")
        inc = round(daily_income.get(date_key, 0), 2)
        exp = round(daily_expense.get(date_key, 0), 2)
        accumulated += inc - exp
        income_points.append(TrendPoint(date=date_key, value=inc))
        expense_points.append(TrendPoint(date=date_key, value=exp))
        savings_points.append(TrendPoint(date=date_key, value=round(accumulated, 2)))

    series = [
        TrendSeries(key="income", label="Income", color="#22C55E", points=income_points),
        TrendSeries(key="expenses", label="Expenses", color="#EF4444", points=expense_points),
        TrendSeries(key="savings", label="Savings", color="#3B82F6", points=savings_points),
    ]

    return TrendResponse(series=series, period=period)


# ── Analytics ─────────────────────────────────────────────────


async def get_analytics(user_id: uuid.UUID) -> AnalyticsResponse:
    docs = await banking_repo.seed_transactions_if_empty(user_id, limit=200)

    total_income = sum(t.amount for t in docs if t.type == "credit")
    total_expenses = sum(abs(t.amount) for t in docs if t.type == "debit")

    category_totals: dict[str, float] = {}
    for t in docs:
        if t.type == "debit" and t.category:
            category_totals[t.category] = category_totals.get(t.category, 0) + abs(t.amount)

    categories = []
    for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        categories.append(
            CategorySlice(
                category=cat,
                label=cat.capitalize(),
                amount=round(amt, 2),
                percentage=round(amt / total_expenses * 100, 1) if total_expenses > 0 else 0,
                color=_category_color(cat),
            )
        )

    return AnalyticsResponse(
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_savings=round(total_income - total_expenses, 2),
        categories=categories[:10],
        currency="USD",
    )


# ── Notifications ─────────────────────────────────────────────


async def get_notifications(user_id: uuid.UUID) -> NotificationFeed:
    docs = await Notification.find(Notification.user_id == user_id).sort(-Notification.created_at).limit(20).to_list()
    unread = sum(1 for n in docs if not n.read)

    notifications: list[DashboardNotification] = [
        DashboardNotification(
            id=str(n.id),
            type=n.type,
            severity=n.severity,
            title=n.title,
            body=n.body,
            action_label=n.action_label,
            action_path=n.action_path,
            created_at=_fmt_dt(n.created_at),
            read=n.read,
        )
        for n in docs
    ]

    return NotificationFeed(notifications=notifications, unread=unread)
