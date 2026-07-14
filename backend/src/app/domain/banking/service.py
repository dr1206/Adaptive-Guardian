from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.domain.banking import repository as repo
from app.domain.banking.mock_data import generate_statement_sample, generate_statement_years
from app.domain.banking.schemas import (
    Account,
    ActivityEvent,
    BankCard,
    BeneficiaryInput,
    BeneficiaryOut,
    BudgetEnvelope,
    CardLimits,
    Currency,
    DepositInput,
    DepositResult,
    Holding,
    Insight,
    LoanRecord,
    Payment,
    SavingsGoal,
    StatementSample,
    StatementYearGroup,
    Transaction,
    TransferInput,
    TransferResult,
)
from app.shared.errors import ConflictError, NotFoundError, ValidationError


def _fmt_dt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _ensure_tz(dt: datetime) -> datetime:
    """Return a UTC-aware datetime, adding UTC tzinfo if the input is naive."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


# ── Accounts ──────────────────────────────────────────────────

async def list_accounts(user_id: uuid.UUID) -> list[Account]:
    docs = await repo.seed_accounts_if_empty(user_id)
    return [
        Account(
            id=str(d.id),
            name=d.name,
            type=d.type,
            currency=d.currency,
            balance=d.balance,
            pending=d.pending,
            iban=d.iban,
            delta_pct=d.delta_pct,
            spark=d.spark,
            status=d.status,
        )
        for d in docs
    ]


async def get_account(user_id: uuid.UUID, account_id: str) -> Account:
    doc = await repo.get_account_by_id(account_id, user_id)
    if not doc:
        raise NotFoundError("Account not found")
    return Account(
        id=str(doc.id),
        name=doc.name,
        type=doc.type,
        currency=doc.currency,
        balance=doc.balance,
        pending=doc.pending,
        iban=doc.iban,
        delta_pct=doc.delta_pct,
        spark=doc.spark,
        status=doc.status,
    )


# ── Transactions ──────────────────────────────────────────────

async def list_transactions(
    user_id: uuid.UUID,
    account_id: str | None = None,
    limit: int = 50,
) -> list[Transaction]:
    # Try real data first; seed mock data if the user has none yet
    docs = await repo.get_transactions_for_user(
        user_id, limit=limit, account_id=account_id
    )
    if not docs:
        docs = await repo.seed_transactions_if_empty(user_id, limit=100)
        if account_id:
            docs = [d for d in docs if d.account_id == account_id]
        docs = docs[:limit]

    return [
        Transaction(
            id=str(d.id),
            date=_fmt_dt(d.date),
            description=d.description,
            amount=d.amount,
            currency=d.currency,
            type=d.type,
            status=d.status,
            category=d.category,
            beneficiary=d.beneficiary,
            reference=d.reference,
        )
        for d in docs
    ]


# ── Transfers ─────────────────────────────────────────────────

async def create_transfer(user_id: uuid.UUID, data: TransferInput) -> TransferResult:
    account_doc = await repo.get_account_by_id(data.from_account_id, user_id)
    if not account_doc:
        raise NotFoundError("Account not found")

    beneficiary = await repo.get_beneficiary_by_id(data.beneficiary_id, user_id)
    if not beneficiary:
        raise NotFoundError("Beneficiary not found")

    if data.currency != account_doc.currency:
        raise ValidationError("Currency mismatch")

    if data.amount > account_doc.balance:
        raise ValidationError("Insufficient funds")

    new_balance = account_doc.balance - data.amount

    # Create the transfer record
    record = await repo.create_transfer(
        user_id=user_id,
        from_account_id=data.from_account_id,
        beneficiary_id=data.beneficiary_id,
        beneficiary_name=beneficiary.name,
        amount=data.amount,
        currency=data.currency,
        reference=data.reference,
    )

    # Deduct balance from the source account
    await repo.update_account_balance(
        data.from_account_id, user_id, new_balance
    )

    # Record the debit transaction
    await repo.create_transaction(
        user_id=user_id,
        account_id=data.from_account_id,
        amount=data.amount,
        currency=data.currency,
        description=f"Transfer to {beneficiary.name}",
        transaction_type="debit",
        category="transfer",
        beneficiary=beneficiary.name,
        reference=data.reference,
    )

    # Log the activity event
    await repo.create_activity_event(
        user_id=user_id,
        event_type="transfer",
        description=f"Transferred {data.amount:,.2f} {data.currency} to {beneficiary.name}",
    )

    # Update beneficiary's last_used timestamp
    beneficiary.last_used = datetime.now(UTC)
    await beneficiary.save()

    return TransferResult(
        transaction_id=str(record.id),
        scheduled_for=_fmt_dt(record.scheduled_for),
        signature=record.signature,
    )


# ── Beneficiaries ─────────────────────────────────────────────

async def list_beneficiaries(user_id: uuid.UUID) -> list[BeneficiaryOut]:
    results = await repo.get_beneficiaries_for_user(user_id)
    return [
        BeneficiaryOut(
            id=str(b.id),
            name=b.name,
            iban=b.iban,
            bank=b.bank,
            currency=b.currency,
            last_used=_fmt_dt(b.last_used) if b.last_used else None,
        )
        for b in results
    ]


async def add_beneficiary(user_id: uuid.UUID, data: BeneficiaryInput) -> BeneficiaryOut:
    existing = await repo.get_beneficiaries_for_user(user_id)
    for b in existing:
        if b.iban == data.iban:
            raise ConflictError("Beneficiary with this IBAN already exists")

    beneficiary = await repo.create_beneficiary(
        user_id=user_id,
        name=data.name,
        iban=data.iban,
        bank=data.bank,
        currency=data.currency,
    )

    await repo.create_activity_event(
        user_id=user_id,
        event_type="beneficiary_added",
        description=f"Added beneficiary {data.name}",
    )

    return BeneficiaryOut(
        id=str(beneficiary.id),
        name=beneficiary.name,
        iban=beneficiary.iban,
        bank=beneficiary.bank,
        currency=beneficiary.currency,
        last_used=None,
    )


# ── Cards ─────────────────────────────────────────────────────

async def list_cards(user_id: uuid.UUID) -> list[BankCard]:
    docs = await repo.seed_cards_if_empty(user_id)
    return [
        BankCard(
            id=str(d.id),
            label=d.label,
            kind=d.kind,
            network=d.network,
            last4=d.last4,
            holder=d.holder,
            exp=d.exp,
            frozen=d.frozen,
            finish=d.finish,
            limits=CardLimits(**d.limits),
            spent_month=d.spent_month,
        )
        for d in docs
    ]


async def freeze_card(user_id: uuid.UUID, card_id: str) -> BankCard:
    card = await repo.update_card_frozen(card_id, user_id, frozen=True)
    if not card:
        raise NotFoundError("Card not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="card_frozen",
        description=f"Froze card {card.label} ending in {card.last4}",
    )
    return BankCard(
        id=str(card.id),
        label=card.label,
        kind=card.kind,
        network=card.network,
        last4=card.last4,
        holder=card.holder,
        exp=card.exp,
        frozen=card.frozen,
        finish=card.finish,
        limits=CardLimits(**card.limits),
        spent_month=card.spent_month,
    )


async def unfreeze_card(user_id: uuid.UUID, card_id: str) -> BankCard:
    card = await repo.update_card_frozen(card_id, user_id, frozen=False)
    if not card:
        raise NotFoundError("Card not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="card_unfrozen",
        description=f"Unfroze card {card.label} ending in {card.last4}",
    )
    return BankCard(
        id=str(card.id),
        label=card.label,
        kind=card.kind,
        network=card.network,
        last4=card.last4,
        holder=card.holder,
        exp=card.exp,
        frozen=card.frozen,
        finish=card.finish,
        limits=CardLimits(**card.limits),
        spent_month=card.spent_month,
    )


async def create_card(
    user_id: uuid.UUID,
    label: str,
    kind: str,
    network: str,
    last4: str,
    holder: str,
    exp: str,
    finish: str,
) -> BankCard:
    card = await repo.create_card(user_id, label, kind, network, last4, holder, exp, finish)
    await repo.create_activity_event(
        user_id=user_id,
        event_type="card_added",
        description=f"Added {kind} card {label}",
    )
    return BankCard(
        id=str(card.id),
        label=card.label,
        kind=card.kind,
        network=card.network,
        last4=card.last4,
        holder=card.holder,
        exp=card.exp,
        frozen=card.frozen,
        finish=card.finish,
        limits=CardLimits(**card.limits),
        spent_month=card.spent_month,
    )


# ── Payments ──────────────────────────────────────────────────

async def list_payments(user_id: uuid.UUID) -> list[Payment]:
    docs = await repo.seed_payments_if_empty(user_id)
    return [
        Payment(
            id=str(d.id),
            description=d.description,
            amount=d.amount,
            currency=d.currency,
            next_date=d.next_date.strftime("%Y-%m-%d"),
            frequency=d.frequency,
            beneficiary=d.beneficiary,
        )
        for d in docs
    ]


async def create_payment(
    user_id: uuid.UUID,
    description: str,
    amount: float,
    currency: str,
    next_date: str,
    frequency: str,
    beneficiary: str,
) -> Payment:
    dt = datetime.fromisoformat(next_date.replace("Z", "+00:00"))
    doc = await repo.create_payment(user_id, description, amount, currency, dt, frequency, beneficiary)
    await repo.create_activity_event(
        user_id=user_id,
        event_type="payment_scheduled",
        description=f"Scheduled {frequency} payment of {amount:,.2f} {currency} for {description}",
    )
    return Payment(
        id=str(doc.id),
        description=doc.description,
        amount=doc.amount,
        currency=doc.currency,
        next_date=doc.next_date.strftime("%Y-%m-%d"),
        frequency=doc.frequency,
        beneficiary=doc.beneficiary,
    )


async def delete_payment(user_id: uuid.UUID, payment_id: str) -> None:
    deleted = await repo.delete_payment(payment_id, user_id)
    if not deleted:
        raise NotFoundError("Payment not found")


# ── Savings Goals ─────────────────────────────────────────────

async def list_savings_goals(user_id: uuid.UUID) -> list[SavingsGoal]:
    docs = await repo.list_savings_goals(user_id)
    return [
        SavingsGoal(
            id=str(d.id),
            name=d.name,
            target=d.target,
            current=d.current,
            currency=d.currency,
            deadline=d.deadline,
            image=d.image,
        )
        for d in docs
    ]


async def create_savings_goal(
    user_id: uuid.UUID,
    name: str,
    target: float,
    currency: str,
    deadline: str,
    image: str | None = None,
) -> SavingsGoal:
    doc = await repo.create_savings_goal(user_id, name, target, currency, deadline, image)
    return SavingsGoal(
        id=str(doc.id),
        name=doc.name,
        target=doc.target,
        current=doc.current,
        currency=doc.currency,
        deadline=doc.deadline,
        image=doc.image,
    )


async def update_savings_goal(
    user_id: uuid.UUID,
    goal_id: str,
    name: str | None = None,
    target: float | None = None,
    current: float | None = None,
    deadline: str | None = None,
) -> SavingsGoal:
    updates = {}
    if name is not None:
        updates["name"] = name
    if target is not None:
        updates["target"] = target
    if current is not None:
        updates["current"] = current
    if deadline is not None:
        updates["deadline"] = deadline
    doc = await repo.update_savings_goal(goal_id, user_id, **updates)
    if not doc:
        raise NotFoundError("Savings goal not found")
    return SavingsGoal(
        id=str(doc.id),
        name=doc.name,
        target=doc.target,
        current=doc.current,
        currency=doc.currency,
        deadline=doc.deadline,
        image=doc.image,
    )


async def delete_savings_goal(user_id: uuid.UUID, goal_id: str) -> None:
    deleted = await repo.delete_savings_goal(goal_id, user_id)
    if not deleted:
        raise NotFoundError("Savings goal not found")


# ── Holdings ──────────────────────────────────────────────────

async def list_holdings(user_id: uuid.UUID) -> list[Holding]:
    docs = await repo.seed_holdings_if_empty(user_id)
    return [
        Holding(
            id=str(d.id),
            symbol=d.symbol,
            name=d.name,
            quantity=d.quantity,
            price=d.price,
            currency=d.currency,
            delta_pct=d.delta_pct,
        )
        for d in docs
    ]


# ── Loans ─────────────────────────────────────────────────────

async def list_loans(user_id: uuid.UUID) -> list[LoanRecord]:
    docs = await repo.seed_loans_if_empty(user_id)
    return [
        LoanRecord(
            id=str(d.id),
            name=d.name,
            principal=d.principal,
            remaining=d.remaining,
            currency=d.currency,
            rate=d.rate,
            next_payment=d.next_payment,
        )
        for d in docs
    ]


# ── Currencies ────────────────────────────────────────────────

async def list_currencies(user_id: uuid.UUID) -> list[Currency]:
    docs = await repo.seed_currencies_if_empty()
    return [
        Currency(code=d.code, name=d.name, rate=d.rate, symbol=d.symbol)
        for d in docs
    ]


# ── Insights ──────────────────────────────────────────────────

async def list_insights(user_id: uuid.UUID) -> list[Insight]:
    docs = await repo.seed_insights_if_empty(user_id)
    return [
        Insight(
            id=str(d.id),
            tone=d.tone,
            title=d.title,
            body=d.body,
            action=d.action,
        )
        for d in docs
    ]


# ── Statements ────────────────────────────────────────────────

async def list_statement_years(user_id: uuid.UUID) -> list[StatementYearGroup]:
    months = await repo.get_distinct_transaction_months(user_id)
    if not months:
        return [StatementYearGroup(**y) for y in generate_statement_years(user_id)]
    grouped: dict[int, list[int]] = {}
    for m in months:
        grouped.setdefault(m["year"], []).append(m["month"])
    return [
        StatementYearGroup(year=year, months=sorted(months, reverse=True))
        for year, months in sorted(grouped.items(), reverse=True)
    ]


async def get_statement(user_id: uuid.UUID, year: int, month: int) -> StatementSample:
    if month < 1 or month > 12:
        raise ValidationError("Month must be between 1 and 12")

    txns = await repo.get_transactions_for_period(user_id, year, month)

    if not txns:
        sample = generate_statement_sample(user_id, year, month)
        sample["transactions"] = [Transaction(**t) for t in sample["transactions"]]
        return StatementSample(**sample)

    debit_total = sum(t.amount for t in txns if t.type == "debit")
    credit_total = sum(t.amount for t in txns if t.type == "credit")
    closing_balance = credit_total - debit_total

    accounts = await repo.get_accounts_for_user(user_id)
    opening_balance = sum(a.balance for a in accounts) - closing_balance

    return StatementSample(
        year=year,
        month=month,
        opening_balance=round(opening_balance, 2),
        closing_balance=round(opening_balance + closing_balance, 2),
        transactions=[
            Transaction(
                id=str(t.id),
                date=_fmt_dt(t.date),
                description=t.description,
                amount=t.amount,
                currency=t.currency,
                type=t.type,
                status=t.status,
                category=t.category,
                beneficiary=t.beneficiary,
                reference=t.reference,
            )
            for t in txns
        ],
    )


# ── Activity ──────────────────────────────────────────────────

async def list_activity(user_id: uuid.UUID, limit: int = 20) -> list[ActivityEvent]:
    docs = await repo.get_activities_for_user(user_id, limit)
    if not docs:
        docs = await repo.seed_activity_if_empty(user_id, limit)
    return [
        ActivityEvent(
            id=str(d.id),
            type=d.type,
            description=d.description,
            occurred_at=_fmt_dt(d.occurred_at),
        )
        for d in docs
    ]


# ── Deposits ────────────────────────────────────────────────────

async def create_deposit(user_id: uuid.UUID, data: DepositInput) -> DepositResult:
    account_doc = await repo.get_account_by_id(data.account_id, user_id)
    if not account_doc:
        raise NotFoundError("Account not found")

    new_balance = account_doc.balance + data.amount

    await repo.update_account_balance(data.account_id, user_id, new_balance)

    txn = await repo.create_transaction(
        user_id=user_id,
        account_id=data.account_id,
        amount=data.amount,
        currency=data.currency,
        description=data.description or "Deposit",
        transaction_type="credit",
        category="deposit",
        reference=data.reference,
    )

    await repo.create_activity_event(
        user_id=user_id,
        event_type="deposit",
        description=f"Deposited {data.amount:,.2f} {data.currency} to {account_doc.name}",
    )

    return DepositResult(
        transaction_id=str(txn.id),
        new_balance=new_balance,
        currency=data.currency,
    )


# ── Budgets ───────────────────────────────────────────────────

async def list_budgets(user_id: uuid.UUID) -> list[BudgetEnvelope]:
    docs = await repo.seed_budgets_if_empty(user_id)

    # Compute actual spending from real transactions for the current month
    now = datetime.now(UTC)
    month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
    txns = await repo.get_transactions_for_user(user_id, limit=500)
    current_month_txns = [
        t for t in txns
        if _ensure_tz(t.date) >= month_start and t.type == "debit"
    ]

    category_spent: dict[str, float] = {}
    for t in current_month_txns:
        if t.category:
            cat = t.category.lower()
            category_spent[cat] = category_spent.get(cat, 0) + abs(t.amount)

    return [
        BudgetEnvelope(
            id=str(d.id),
            category=d.category,
            budgeted=d.budgeted,
            spent=round(category_spent.get(d.category.lower(), 0), 2),
            currency=d.currency,
            color=d.color,
        )
        for d in docs
    ]


async def create_budget(
    user_id: uuid.UUID, category: str, budgeted: float, currency: str, color: str | None = None
) -> BudgetEnvelope:
    doc = await repo.create_budget(user_id, category, budgeted, currency, color)
    return BudgetEnvelope(
        id=str(doc.id),
        category=doc.category,
        budgeted=doc.budgeted,
        spent=doc.spent,
        currency=doc.currency,
        color=doc.color,
    )
