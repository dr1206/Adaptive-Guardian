"""
Deterministic mock data generators for the banking domain.

Each user gets a consistent, realistic set of accounts, transactions, cards,
etc. seeded from their user_id. No database writes — pure generation.
"""

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


# ── Accounts ──────────────────────────────────────────────────

_ACCOUNT_TYPES = [
    {"name": "Primary Checking", "type": "primary", "currency": "USD", "balance": 24_562.30, "pending": 150.00, "iban": "AD90 1510 4091 9906 8431 7465", "delta_pct": 3.2, "spark": [50, 55, 52, 60, 58, 63, 61, 67, 70, 68, 72, 75, 78, 73, 76, 80, 82, 85, 88, 90]},
    {"name": "Rainy Day Savings", "type": "savings", "currency": "USD", "balance": 138_900.45, "pending": 0, "iban": "AD90 1510 4091 9906 8431 7466", "delta_pct": 5.8, "spark": [40, 42, 45, 47, 50, 52, 55, 58, 60, 63, 65, 68, 70, 73, 75, 78, 80, 83, 85, 88]},
    {"name": "Growth Portfolio", "type": "investment", "currency": "EUR", "balance": 52_310.10, "pending": 0, "iban": "AD90 1510 4091 9906 8431 7467", "delta_pct": -1.4, "spark": [80, 78, 75, 73, 70, 68, 65, 63, 68, 72, 70, 75, 72, 68, 70, 67, 65, 62, 60, 58]},
    {"name": "Business Account", "type": "business", "currency": "USD", "balance": 8_921.00, "pending": 2_340.00, "iban": "AD90 1510 4091 9906 8431 7468", "delta_pct": 12.1, "spark": [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 78, 80, 82, 85, 88, 90, 92, 95]},
]


def generate_accounts(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    accounts = []
    for i, tmpl in enumerate(_ACCOUNT_TYPES):
        jitter = random.uniform(-500, 500)
        spark = [s + random.uniform(-3, 3) for s in tmpl["spark"]]
        accounts.append({
            "id": _uid("acc", i),
            "name": tmpl["name"],
            "type": tmpl["type"],
            "currency": tmpl["currency"],
            "balance": round(tmpl["balance"] + jitter, 2),
            "pending": tmpl["pending"],
            "iban": tmpl["iban"],
            "delta_pct": round(tmpl["delta_pct"] + random.uniform(-0.5, 0.5), 1),
            "spark": [round(s, 1) for s in spark],
            "status": "active",
        })
    return accounts


# ── Transactions ──────────────────────────────────────────────

_TXN_TEMPLATES = [
    ("Netflix Subscription", 15.99, "debit", "completed", "subscriptions"),
    ("Salary Deposit", 7_200.00, "credit", "completed", "payroll"),
    ("Whole Foods Market", 87.40, "debit", "completed", "groceries"),
    ("Wire Transfer to Jane", 450.00, "debit", "completed", "transfer"),
    ("Spotify Premium", 9.99, "debit", "completed", "subscriptions"),
    ("Freelance Payment", 2_100.00, "credit", "completed", "freelance"),
    ("Uber Ride", 23.50, "debit", "completed", "transport"),
    ("Starbucks Coffee", 5.75, "debit", "completed", "dining"),
    ("Amazon.com", 124.99, "debit", "completed", "shopping"),
    ("Dividend Payout", 320.00, "credit", "completed", "investment"),
    ("Gym Membership", 55.00, "debit", "completed", "health"),
    ("Electric Bill", 142.30, "debit", "pending", "utilities"),
    ("Internet Service", 79.99, "debit", "completed", "utilities"),
    ("Target Store", 48.25, "debit", "completed", "shopping"),
    ("Refund: Amazon", 34.99, "credit", "completed", "shopping"),
    ("Chipotle", 12.80, "debit", "completed", "dining"),
    ("Gas Station", 52.00, "debit", "completed", "transport"),
    ("Apple.com", 999.00, "debit", "completed", "electronics"),
    ("Interest Earned", 14.20, "credit", "completed", "interest"),
    ("Venmo: Dinner Split", 30.00, "debit", "completed", "personal"),
    ("ATT Mobile", 65.00, "debit", "completed", "utilities"),
    ("Delta Airlines", 387.50, "debit", "completed", "travel"),
    ("Hotel Booking", 245.00, "debit", "pending", "travel"),
    ("Bonus", 3_000.00, "credit", "completed", "payroll"),
    ("Trader Joes", 34.15, "debit", "completed", "groceries"),
]

_BENEFICIARY_NAMES = ["Jane Smith", "Robert Chen", "Maria Garcia", "Acme Corp", "Landlord LLC"]


def generate_transactions(user_id: uuid.UUID, limit: int = 50, account_id: str | None = None) -> list[dict]:
    _seed(user_id)
    base_date = datetime.now(UTC) - timedelta(days=90)
    transactions = []
    for i in range(min(limit, len(_TXN_TEMPLATES))):
        desc, amt, tx_type, status, category = _TXN_TEMPLATES[i]
        txn_date = base_date + timedelta(days=i * 3 + random.randint(0, 2))
        beneficiary = random.choice(_BENEFICIARY_NAMES) if tx_type == "debit" else None
        transactions.append({
            "id": _uid("txn", i + random.randint(0, 1000)),
            "date": txn_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "description": desc,
            "amount": round(amt + random.uniform(-2, 2), 2),
            "currency": "USD",
            "type": tx_type,
            "status": status,
            "category": category,
            "beneficiary": beneficiary,
            "reference": f"REF-{uuid.uuid4().hex[:8].upper()}",
            "account_id": _uid("acc", i % 4),
        })
    return sorted(transactions, key=lambda t: t["date"], reverse=True)


# ── Bank Cards ────────────────────────────────────────────────

_CARD_TEMPLATES = [
    {"label": "Platinum Debit", "kind": "primary", "network": "visa", "last4": "4508", "holder": "Alex Morgan", "exp": "06/28", "frozen": False, "finish": "platinum", "limits": {"daily": 5_000, "monthly": 50_000, "atm": 1_000, "used_daily": 320, "used_monthly": 12_450, "used_atm": 200}, "spent_month": 12_450},
    {"label": "Travel Rewards", "kind": "credit", "network": "mastercard", "last4": "8921", "holder": "Alex Morgan", "exp": "03/27", "frozen": False, "finish": "champagne", "limits": {"daily": 10_000, "monthly": 100_000, "atm": 500, "used_daily": 1_540, "used_monthly": 23_870, "used_atm": 0}, "spent_month": 23_870},
    {"label": "Virtual Card", "kind": "virtual", "network": "visa", "last4": "1032", "holder": "Alex Morgan", "exp": "11/26", "frozen": True, "finish": "iris", "limits": {"daily": 2_000, "monthly": 20_000, "atm": 0, "used_daily": 0, "used_monthly": 4_200, "used_atm": 0}, "spent_month": 4_200},
]


def generate_cards(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    cards = []
    for i, tmpl in enumerate(_CARD_TEMPLATES):
        cards.append({**tmpl, "id": _uid("card", i)})
    return cards


# ── Payments ──────────────────────────────────────────────────

_PAYMENT_TEMPLATES = [
    {"description": "Rent Payment", "amount": 2_400, "currency": "USD", "frequency": "monthly", "beneficiary": "Landlord LLC"},
    {"description": "Car Insurance", "amount": 180, "currency": "USD", "frequency": "quarterly", "beneficiary": "SafeDrive Inc"},
    {"description": "Cloud Subscription", "amount": 49.99, "currency": "USD", "frequency": "monthly", "beneficiary": "AWS"},
]


def generate_payments(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    base_date = datetime.now(UTC)
    payments = []
    for i, tmpl in enumerate(_PAYMENT_TEMPLATES):
        next_date = base_date + timedelta(days=random.randint(1, 30))
        payments.append({
            "id": _uid("pmt", i),
            **tmpl,
            "next_date": next_date.strftime("%Y-%m-%d"),
        })
    return payments


# ── Savings Goals ─────────────────────────────────────────────

_SAVINGS_TEMPLATES = [
    {"name": "Vacation Fund", "target": 10_000, "current": 6_750, "currency": "USD", "deadline": "2027-06-01", "image": "beach"},
    {"name": "New Car", "target": 35_000, "current": 14_200, "currency": "USD", "deadline": "2027-12-15", "image": "car"},
    {"name": "Emergency Fund", "target": 20_000, "current": 18_500, "currency": "USD", "deadline": "2026-12-31", "image": "shield"},
]


def generate_savings_goals(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    return [{**tmpl, "id": _uid("sav", i)} for i, tmpl in enumerate(_SAVINGS_TEMPLATES)]


# ── Holdings ──────────────────────────────────────────────────

_HOLDING_TEMPLATES = [
    {"symbol": "AAPL", "name": "Apple Inc.", "quantity": 45, "price": 218.40, "currency": "USD", "delta_pct": 2.4},
    {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "quantity": 120, "price": 257.80, "currency": "USD", "delta_pct": -0.8},
    {"symbol": "BTC", "name": "Bitcoin", "quantity": 0.15, "price": 68_320.00, "currency": "USD", "delta_pct": 5.2},
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "quantity": 30, "price": 542.10, "currency": "USD", "delta_pct": 1.2},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "quantity": 10, "price": 175.60, "currency": "USD", "delta_pct": -2.1},
]


def generate_holdings(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    holdings = []
    for i, tmpl in enumerate(_HOLDING_TEMPLATES):
        jitter = tmpl["price"] * random.uniform(-0.02, 0.02)
        holdings.append({
            "id": _uid("hld", i),
            "symbol": tmpl["symbol"],
            "name": tmpl["name"],
            "quantity": tmpl["quantity"],
            "price": round(tmpl["price"] + jitter, 2),
            "currency": tmpl["currency"],
            "delta_pct": round(tmpl["delta_pct"] + random.uniform(-0.5, 0.5), 1),
        })
    return holdings


# ── Loans ─────────────────────────────────────────────────────

_LOAN_TEMPLATES = [
    {"name": "Home Mortgage", "principal": 450_000, "remaining": 312_450, "currency": "USD", "rate": 3.25, "next_payment": "2026-07-15"},
    {"name": "Auto Loan", "principal": 28_000, "remaining": 12_340, "currency": "USD", "rate": 4.9, "next_payment": "2026-07-08"},
]


def generate_loans(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    return [{**tmpl, "id": _uid("loan", i)} for i, tmpl in enumerate(_LOAN_TEMPLATES)]


# ── Currencies ────────────────────────────────────────────────

_CURRENCIES = [
    {"code": "USD", "name": "US Dollar", "rate": 1.0, "symbol": "$"},
    {"code": "EUR", "name": "Euro", "rate": 0.92, "symbol": "€"},
    {"code": "GBP", "name": "British Pound", "rate": 0.79, "symbol": "£"},
    {"code": "JPY", "name": "Japanese Yen", "rate": 149.5, "symbol": "¥"},
    {"code": "CHF", "name": "Swiss Franc", "rate": 0.88, "symbol": "CHF"},
    {"code": "CAD", "name": "Canadian Dollar", "rate": 1.36, "symbol": "C$"},
    {"code": "AUD", "name": "Australian Dollar", "rate": 1.52, "symbol": "A$"},
    {"code": "INR", "name": "Indian Rupee", "rate": 83.1, "symbol": "₹"},
]


def generate_currencies(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    currencies = []
    for _i, tmpl in enumerate(_CURRENCIES):
        jitter = tmpl["rate"] * random.uniform(-0.005, 0.005)
        currencies.append({**tmpl, "rate": round(tmpl["rate"] + jitter, 4)})
    return currencies


# ── Insights ──────────────────────────────────────────────────

_INSIGHT_TEMPLATES = [
    {"tone": "up", "title": "Spending increased 12% this month", "body": "Your total spend is up compared to last month, driven mostly by travel and dining.", "action": "Review budget"},
    {"tone": "saving", "title": "You're on track for your Vacation Fund", "body": "At your current savings rate you'll reach your goal 3 weeks ahead of schedule.", "action": "See goal"},
    {"tone": "down", "title": "Subscription overlap detected", "body": "You have both Spotify and Apple Music. Consolidating could save $120/year.", "action": "Manage subs"},
    {"tone": "shield", "title": "Security: new device detected", "body": "A login from Windows / Chrome was seen today. If this wasn't you, review your sessions.", "action": "Review devices"},
    {"tone": "calendar", "title": "Mortgage payment in 3 days", "body": "Your monthly mortgage payment of $2,400 is scheduled for July 15.", "action": "View details"},
    {"tone": "growth", "title": "Your portfolio gained 4.2% this quarter", "body": "AAPL and SPY led gains. Consider rebalancing VTI which underperformed.", "action": "View holdings"},
]


def generate_insights(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    return [{**tmpl, "id": _uid("ins", i)} for i, tmpl in enumerate(_INSIGHT_TEMPLATES)]


# ── Statements ────────────────────────────────────────────────


def generate_statement_years(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    current = datetime.now(UTC)
    years = []
    for yr in range(current.year - 2, current.year + 1):
        months = list(range(1, 13 if yr < current.year else current.month))
        years.append({"year": yr, "months": months})
    return sorted(years, key=lambda y: y["year"], reverse=True)


def generate_statement_sample(user_id: uuid.UUID, year: int, month: int) -> dict:
    _seed(user_id)
    opening = 22_000 + random.uniform(-2_000, 5_000)
    closing = opening + random.uniform(-3_000, 4_000)
    base_date = datetime(year, month, 1, tzinfo=UTC)

    txns = []
    for d in range(1, min(29, 28 if month == 2 else 30)):
        txns.append({
            "id": _uid("stmt", d),
            "date": base_date.replace(day=d).strftime("%Y-%m-%dT12:00:00Z"),
            "description": random.choice(["Grocery Store", "Online Payment", "Restaurant", "Utility Bill", "Direct Deposit"]),
            "amount": round(random.uniform(5, 500), 2),
            "currency": "USD",
            "type": random.choice(["credit", "debit"]),
            "status": "completed",
            "category": random.choice(["groceries", "utilities", "dining", "shopping", "payroll"]),
        })

    return {"year": year, "month": month, "opening_balance": round(opening, 2), "closing_balance": round(closing, 2), "transactions": txns}


# ── Activity ──────────────────────────────────────────────────

_ACTIVITY_TYPES = ["login", "transfer", "beneficiary_added", "card_frozen", "statement_viewed"]
_ACTIVITY_DESC = [
    "Login from Chrome on Windows",
    "Transfer of $450.00 to Jane Smith",
    "Beneficiary 'Robert Chen' added",
    "Virtual Card frozen",
    "Statement for May 2026 viewed",
]


def generate_activity(user_id: uuid.UUID, limit: int = 20) -> list[dict]:
    _seed(user_id)
    base_date = datetime.now(UTC)
    events = []
    for i in range(limit):
        t = i % len(_ACTIVITY_TYPES)
        occurred = base_date - timedelta(hours=i * 6 + random.randint(0, 3))
        events.append({
            "id": _uid("act", i),
            "type": _ACTIVITY_TYPES[t],
            "description": _ACTIVITY_DESC[t],
            "occurred_at": occurred.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
    return events


# ── Budgets ───────────────────────────────────────────────────

_BUDGET_COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"]


def generate_budgets(user_id: uuid.UUID) -> list[dict]:
    _seed(user_id)
    categories = [
        ("Housing", 2_400, 2_350),
        ("Groceries", 800, 620),
        ("Transport", 400, 375),
        ("Dining Out", 500, 480),
        ("Entertainment", 300, 210),
        ("Utilities", 350, 320),
        ("Shopping", 400, 390),
        ("Healthcare", 250, 180),
    ]
    budgets = []
    for i, (cat, budgeted, spent) in enumerate(categories):
        budgets.append({
            "id": _uid("bud", i),
            "category": cat,
            "budgeted": budgeted,
            "spent": spent + round(random.uniform(-30, 30), 2),
            "currency": "USD",
            "color": _BUDGET_COLORS[i],
        })
    return budgets
