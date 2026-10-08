from __future__ import annotations

import uuid
from datetime import UTC, datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class Beneficiary(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    name: str
    iban: str
    bank: str
    currency: str = "INR"
    category: str = "General"
    is_verified: bool = True
    cooling_until: datetime | None = None
    cooling_limit_paise: int = 5000000  # ₹50,000 maximum during cooling window
    last_used: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "beneficiaries"
        indexes = [
            "user_id",
            IndexModel([("user_id", 1), ("iban", 1)], unique=True),
        ]


class TransferRecord(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    from_account_id: str
    beneficiary_id: str
    beneficiary_name: str
    amount: float
    amount_paise: int = 0
    currency: str
    reference: str | None = None
    scheduled_for: datetime = Field(default_factory=lambda: datetime.now(UTC))
    signature: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    risk_score: float | None = None
    risk_decision: str = "allow"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "transfer_records"
        indexes = ["user_id", "created_at"]


# ── BankAccount ─────────────────────────────────────────────────

class BankAccount(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    name: str
    type: str
    currency: str
    balance: float
    balance_paise: int | None = None
    pending: float = 0
    pending_paise: int | None = None
    iban: str
    delta_pct: float
    spark: list[float]
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "bank_accounts"
        indexes = ["user_id", IndexModel([("user_id", 1), ("type", 1)])]


# ── TransactionRecord ───────────────────────────────────────────

class TransactionRecord(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    account_id: str
    date: datetime
    description: str
    amount: float
    currency: str
    type: str
    status: str
    category: str | None = None
    beneficiary: str | None = None
    reference: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "transaction_records"
        indexes = ["user_id", "account_id", IndexModel([("user_id", 1), ("date", -1)])]


# ── BankCard ────────────────────────────────────────────────────

class BankCard(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    label: str
    kind: str
    network: str
    last4: str
    holder: str
    exp: str
    frozen: bool
    finish: str
    limits: dict
    spent_month: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "bank_cards"
        indexes = ["user_id"]


# ── ScheduledPayment ────────────────────────────────────────────

class ScheduledPayment(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    description: str
    amount: float
    currency: str
    next_date: datetime
    frequency: str
    beneficiary: str
    status: str = "active"  # "active" | "paused"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "scheduled_payments"
        indexes = ["user_id"]


# ── SavingsGoal ─────────────────────────────────────────────────

class SavingsGoal(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    name: str
    target: float
    current: float
    currency: str
    deadline: str
    image: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "savings_goals"
        indexes = ["user_id"]


# ── Holding ─────────────────────────────────────────────────────

class Holding(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    symbol: str
    name: str
    quantity: float
    price: float
    currency: str
    delta_pct: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "holdings"
        indexes = ["user_id"]


# ── LoanRecord ──────────────────────────────────────────────────

class LoanRecord(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    name: str
    principal: float
    remaining: float
    currency: str
    rate: float
    next_payment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "loan_records"
        indexes = ["user_id"]


# ── Currency ────────────────────────────────────────────────────

class Currency(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    code: str
    name: str
    rate: float
    symbol: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "currencies"
        indexes = [IndexModel([("code", 1)], unique=True)]


# ── Insight ─────────────────────────────────────────────────────

class Insight(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    tone: str
    title: str
    body: str
    action: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "insights"
        indexes = ["user_id"]


# ── ActivityEvent ───────────────────────────────────────────────

class ActivityEvent(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    type: str
    description: str
    occurred_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "activity_events"
        indexes = [IndexModel([("user_id", 1), ("occurred_at", -1)])]


# ── BudgetEnvelope ──────────────────────────────────────────────

class BudgetEnvelope(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    category: str
    budgeted: float
    spent: float
    currency: str
    color: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "budget_envelopes"
        indexes = ["user_id"]


# ── Financial Ledger & Idempotency ──────────────────────────────

class LedgerTransaction(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    transaction_ref: str
    user_id: uuid.UUID
    source_account_id: str | None = None
    destination_account_id: str | None = None
    amount_paise: int
    currency: str = "INR"
    transaction_type: str  # transfer, deposit, withdrawal, payment, fee, reversal, exchange
    status: str = "completed"  # completed, pending, failed, reversed
    reference: str | None = None
    initiated_by: str = "customer"
    authorized_by: str = "system"
    risk_score: float | None = None
    risk_decision: str | None = "allow"
    failure_reason: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "ledger_transactions"
        indexes = [
            "user_id",
            IndexModel([("transaction_ref", 1)], unique=True),
            IndexModel([("user_id", 1), ("created_at", -1)]),
        ]


class LedgerEntry(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    ledger_txn_id: uuid.UUID
    account_id: str
    entry_type: str  # debit | credit
    amount_paise: int
    balance_after_paise: int
    currency: str = "INR"
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "ledger_entries"
        indexes = [
            "account_id",
            "ledger_txn_id",
            IndexModel([("account_id", 1), ("created_at", -1)]),
        ]


class IdempotencyRecord(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    key: str
    user_id: uuid.UUID
    action: str
    request_hash: str
    status: str = "processing"  # processing, completed, failed
    response_code: int = 200
    response_body: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime

    class Settings:
        name = "idempotency_records"
        indexes = [
            IndexModel([("user_id", 1), ("key", 1)], unique=True),
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]


class DisputeRecord(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)  # type: ignore[assignment]
    user_id: uuid.UUID
    transaction_id: str
    reason: str
    details: str
    status: str = "under_investigation"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "dispute_records"
        indexes = [
            "user_id",
            "transaction_id",
        ]
