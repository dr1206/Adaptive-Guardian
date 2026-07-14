"""Dashboard aggregation schemas. All camelCase via serialization_alias."""

from __future__ import annotations

from pydantic import BaseModel, Field

# ── Summary ───────────────────────────────────────────────────

class SummaryCard(BaseModel):
    label: str
    value: str
    delta: str | None = None
    tone: str = "neutral"  # up, down, neutral, warn


class DashboardSummary(BaseModel):
    total_balance: SummaryCard = Field(serialization_alias="totalBalance")
    savings_balance: SummaryCard = Field(serialization_alias="savingsBalance")
    pending_count: SummaryCard = Field(serialization_alias="pendingCount")
    security_score: SummaryCard = Field(serialization_alias="securityScore")
    accounts_count: int = Field(serialization_alias="accountsCount")


# ── Trend ─────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    date: str
    value: float
    label: str | None = None


class TrendSeries(BaseModel):
    key: str
    label: str
    color: str
    points: list[TrendPoint]


class TrendResponse(BaseModel):
    series: list[TrendSeries]
    period: str  # 7d, 30d, 90d


# ── Analytics ─────────────────────────────────────────────────

class CategorySlice(BaseModel):
    category: str
    label: str
    amount: float
    percentage: float
    color: str


class AnalyticsResponse(BaseModel):
    total_income: float = Field(serialization_alias="totalIncome")
    total_expenses: float = Field(serialization_alias="totalExpenses")
    net_savings: float = Field(serialization_alias="netSavings")
    categories: list[CategorySlice]
    currency: str = "USD"


# ── Notification ──────────────────────────────────────────────

class DashboardNotification(BaseModel):
    id: str
    type: str  # security, banking, insight, system
    severity: str  # info, warn, critical
    title: str
    body: str
    action_label: str | None = Field(None, serialization_alias="actionLabel")
    action_path: str | None = Field(None, serialization_alias="actionPath")
    created_at: str = Field(serialization_alias="createdAt")
    read: bool = False


class NotificationFeed(BaseModel):
    notifications: list[DashboardNotification]
    unread: int
