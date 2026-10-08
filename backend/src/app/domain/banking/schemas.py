from __future__ import annotations

from pydantic import BaseModel, Field

# ── Account ───────────────────────────────────────────────────

class Account(BaseModel):
    id: str
    name: str
    type: str  # primary, savings, investment, credit, business, fixed
    currency: str
    balance: float
    pending: float = 0
    iban: str
    delta_pct: float = Field(serialization_alias="deltaPct")
    spark: list[float]
    status: str = "active"  # active, frozen


# ── Transaction ───────────────────────────────────────────────

class Transaction(BaseModel):
    id: str
    date: str
    description: str
    amount: float
    currency: str
    type: str  # credit, debit
    status: str  # completed, pending, failed
    category: str | None = None
    beneficiary: str | None = None
    reference: str | None = None


# ── Transfer ──────────────────────────────────────────────────

class TransferInput(BaseModel):
    model_config = {"populate_by_name": True}
    from_account_id: str = Field(validation_alias="fromAccountId")
    beneficiary_id: str = Field(validation_alias="beneficiaryId")
    amount: float = Field(gt=0)
    currency: str
    reference: str | None = None
    dwell_ms: float | None = Field(None, validation_alias="dwellMs")
    idempotency_key: str | None = Field(None, validation_alias="idempotencyKey")
    behavioral_features: dict | None = Field(None, validation_alias="behavioralFeatures")
    otp_code: str | None = Field(None, validation_alias="otpCode")
    challenge_id: str | None = Field(None, validation_alias="challengeId")


class TransferResult(BaseModel):
    transaction_id: str = Field(serialization_alias="transactionId")
    scheduled_for: str = Field(serialization_alias="scheduledFor")
    signature: str
    status: str = "completed"  # completed, step_up_required, blocked
    risk_score: float | None = Field(None, serialization_alias="riskScore")
    risk_decision: str | None = Field(None, serialization_alias="riskDecision")
    message: str | None = None
    challenge_id: str | None = Field(None, serialization_alias="challengeId")


# ── Deposit ────────────────────────────────────────────────────

class DepositInput(BaseModel):
    model_config = {"populate_by_name": True}
    account_id: str = Field(validation_alias="accountId")
    amount: float = Field(gt=0)
    currency: str
    description: str | None = None
    reference: str | None = None
    idempotency_key: str | None = Field(None, validation_alias="idempotencyKey")


class DepositResult(BaseModel):
    transaction_id: str = Field(serialization_alias="transactionId")
    new_balance: float = Field(serialization_alias="newBalance")
    currency: str


# ── Beneficiary ───────────────────────────────────────────────

class BeneficiaryOut(BaseModel):
    id: str
    name: str
    iban: str
    bank: str
    currency: str = "INR"
    category: str = "General"
    is_verified: bool = Field(True, serialization_alias="isVerified")
    cooling_until: str | None = Field(None, serialization_alias="coolingUntil")
    cooling_limit: float | None = Field(None, serialization_alias="coolingLimit")
    last_used: str | None = Field(None, serialization_alias="lastUsed")


class BeneficiaryInput(BaseModel):
    name: str
    iban: str
    bank: str
    currency: str = "INR"
    category: str = "General"
    idempotency_key: str | None = Field(None, validation_alias="idempotencyKey")


# ── Bank Card ─────────────────────────────────────────────────

class CardLimits(BaseModel):
    model_config = {"populate_by_name": True}
    daily: float
    monthly: float
    atm: float
    used_daily: float = Field(validation_alias="usedDaily", serialization_alias="usedDaily")
    used_monthly: float = Field(validation_alias="usedMonthly", serialization_alias="usedMonthly")
    used_atm: float = Field(validation_alias="usedAtm", serialization_alias="usedAtm")


class CardInput(BaseModel):
    label: str
    kind: str = "virtual"
    network: str = "visa"
    last4: str
    holder: str
    exp: str
    finish: str = "graphite"


class BankCard(BaseModel):
    id: str
    label: str
    kind: str  # primary, virtual, credit, travel
    network: str  # visa, mastercard
    last4: str
    holder: str
    exp: str
    frozen: bool
    finish: str  # obsidian, champagne, iris, graphite, platinum
    limits: CardLimits
    spent_month: float = Field(serialization_alias="spentMonth")


# ── Payment ───────────────────────────────────────────────────

class PaymentInput(BaseModel):
    model_config = {"populate_by_name": True}
    description: str
    amount: float = Field(gt=0)
    currency: str = "USD"
    next_date: str = Field(validation_alias="nextDate")
    frequency: str = "monthly"
    beneficiary: str


class Payment(BaseModel):
    id: str
    description: str
    amount: float
    currency: str
    next_date: str = Field(serialization_alias="nextDate")
    frequency: str  # weekly, monthly, quarterly, yearly
    beneficiary: str
    status: str = "active"


# ── Savings Goal ──────────────────────────────────────────────

class SavingsGoalInput(BaseModel):
    name: str
    target: float = Field(gt=0)
    currency: str = "USD"
    deadline: str
    image: str | None = None


class SavingsGoalUpdate(BaseModel):
    name: str | None = None
    target: float | None = Field(None, gt=0)
    current: float | None = Field(None, ge=0)
    deadline: str | None = None


class SavingsGoal(BaseModel):
    id: str
    name: str
    target: float
    current: float
    currency: str
    deadline: str
    image: str | None = None


# ── Holding ───────────────────────────────────────────────────

class Holding(BaseModel):
    id: str
    symbol: str
    name: str
    quantity: float
    price: float
    currency: str
    delta_pct: float = Field(serialization_alias="deltaPct")


# ── Loan ──────────────────────────────────────────────────────

class LoanRecord(BaseModel):
    id: str
    name: str
    principal: float
    remaining: float
    currency: str
    rate: float
    next_payment: str = Field(serialization_alias="nextPayment")


# ── Currency ──────────────────────────────────────────────────

class Currency(BaseModel):
    code: str
    name: str
    rate: float
    symbol: str


# ── Insight ───────────────────────────────────────────────────

class Insight(BaseModel):
    id: str
    tone: str  # down, up, calendar, shield, saving, growth
    title: str
    body: str
    action: str


# ── Statement ─────────────────────────────────────────────────

class StatementYearGroup(BaseModel):
    year: int
    months: list[int]


class StatementSample(BaseModel):
    year: int
    month: int
    opening_balance: float = Field(serialization_alias="openingBalance")
    closing_balance: float = Field(serialization_alias="closingBalance")
    transactions: list[Transaction]


# ── Activity ──────────────────────────────────────────────────

class ActivityEvent(BaseModel):
    id: str
    type: str  # login, transfer, beneficiary_added, card_frozen, statement_viewed
    description: str
    occurred_at: str = Field(serialization_alias="occurredAt")


# ── Budget ────────────────────────────────────────────────────

class BudgetInput(BaseModel):
    category: str
    budgeted: float = Field(gt=0)
    currency: str = "USD"
    color: str | None = None


class BudgetEnvelope(BaseModel):
    id: str
    category: str
    budgeted: float
    spent: float
    currency: str
    color: str | None = None


# ── Card Security & Control Actions ─────────────────────────────

class CardLimitsUpdate(BaseModel):
    model_config = {"populate_by_name": True}
    daily: float = Field(ge=0)
    monthly: float = Field(ge=0)
    atm: float = Field(ge=0)


class CardPinChange(BaseModel):
    pin: str = Field(min_length=4, max_length=6)


# ── Savings Contribution / Withdrawal ───────────────────────────

class GoalFundAction(BaseModel):
    model_config = {"populate_by_name": True}
    amount: float = Field(gt=0)
    account_id: str = Field(validation_alias="accountId")


# ── Transaction Dispute ─────────────────────────────────────────

class DisputeInput(BaseModel):
    model_config = {"populate_by_name": True}
    transaction_id: str = Field(validation_alias="transactionId")
    reason: str
    details: str = ""


class DisputeOut(BaseModel):
    id: str
    transaction_id: str = Field(serialization_alias="transactionId")
    status: str
    created_at: str = Field(serialization_alias="createdAt")


# ── FX Exchange ─────────────────────────────────────────────────

class ExchangeExecuteInput(BaseModel):
    model_config = {"populate_by_name": True}
    from_account_id: str = Field(validation_alias="fromAccountId")
    to_account_id: str = Field(validation_alias="toAccountId")
    from_currency: str = Field(validation_alias="fromCurrency")
    to_currency: str = Field(validation_alias="toCurrency")
    amount: float = Field(gt=0)
    idempotency_key: str | None = Field(None, validation_alias="idempotencyKey")


class ExchangeExecuteResult(BaseModel):
    transaction_id: str = Field(serialization_alias="transactionId")
    from_amount: float = Field(serialization_alias="fromAmount")
    to_amount: float = Field(serialization_alias="toAmount")
    exchange_rate: float = Field(serialization_alias="exchangeRate")
    status: str = "completed"
