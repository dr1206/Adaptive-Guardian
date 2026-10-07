from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.domain.banking.mock_data import (
    generate_accounts,
    generate_activity,
    generate_budgets,
    generate_cards,
    generate_currencies,
    generate_holdings,
    generate_insights,
    generate_loans,
    generate_payments,
    generate_savings_goals,
    generate_transactions,
)
from app.domain.banking.models import (
    ActivityEvent,
    BankAccount,
    BankCard,
    Beneficiary,
    BudgetEnvelope,
    Currency,
    Holding,
    Insight,
    LoanRecord,
    SavingsGoal,
    ScheduledPayment,
    TransactionRecord,
    TransferRecord,
)


def _parse_dt(s: str) -> datetime:
    """Parse ISO timestamp strings from mock_data into UTC-aware datetimes."""
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt


def _drop_id(d: dict) -> dict:
    """Remove string 'id' from mock data so Beanie generates a UUID."""
    d.pop("id", None)
    return d


# ── Beneficiaries ─────────────────────────────────────────────

async def get_beneficiaries_for_user(user_id: uuid.UUID) -> list[Beneficiary]:
    return await Beneficiary.find(Beneficiary.user_id == user_id).sort(-Beneficiary.created_at).to_list()


async def get_beneficiary_by_id(beneficiary_id: str, user_id: uuid.UUID) -> Beneficiary | None:
    try:
        b_uuid = beneficiary_id if isinstance(beneficiary_id, uuid.UUID) else uuid.UUID(str(beneficiary_id))
        return await Beneficiary.find_one(Beneficiary.id == b_uuid, Beneficiary.user_id == user_id)
    except (ValueError, TypeError):
        seeds = generate_beneficiaries(user_id)
        match = next((b for b in seeds if b.get("id") == beneficiary_id), None)
        if match:
            return Beneficiary(user_id=user_id, **_drop_id(match))
        return None


async def create_beneficiary(user_id: uuid.UUID, name: str, iban: str, bank: str, currency: str) -> Beneficiary:
    beneficiary = Beneficiary(user_id=user_id, name=name, iban=iban, bank=bank, currency=currency)
    return await beneficiary.insert()


# ── Transfers ─────────────────────────────────────────────────

async def create_transfer(
    user_id: uuid.UUID,
    from_account_id: str,
    beneficiary_id: str,
    beneficiary_name: str,
    amount: float,
    currency: str,
    reference: str | None = None,
) -> TransferRecord:
    record = TransferRecord(
        user_id=user_id,
        from_account_id=from_account_id,
        beneficiary_id=beneficiary_id,
        beneficiary_name=beneficiary_name,
        amount=amount,
        currency=currency,
        reference=reference,
    )
    return await record.insert()


async def get_transfers_for_user(
    user_id: uuid.UUID, limit: int = 50, offset: int = 0
) -> list[TransferRecord]:
    return (
        await TransferRecord.find(TransferRecord.user_id == user_id)
        .sort(-TransferRecord.created_at)
        .skip(offset)
        .limit(limit)
        .to_list()
    )


# ── Accounts ──────────────────────────────────────────────────

async def seed_accounts_if_empty(user_id: uuid.UUID) -> list[BankAccount]:
    existing = await BankAccount.find(BankAccount.user_id == user_id).count()
    if existing > 0:
        return await BankAccount.find(BankAccount.user_id == user_id).to_list()
    seeds = generate_accounts(user_id)
    docs = [BankAccount(user_id=user_id, **_drop_id(a)) for a in seeds]
    if docs:
        await BankAccount.insert_many(docs)
    return docs


async def get_account_by_id(account_id: str, user_id: uuid.UUID) -> BankAccount | None:
    try:
        acc_uuid = account_id if isinstance(account_id, uuid.UUID) else uuid.UUID(str(account_id))
        return await BankAccount.find_one(BankAccount.id == acc_uuid, BankAccount.user_id == user_id)
    except (ValueError, TypeError):
        seeds = generate_accounts(user_id)
        match = next((a for a in seeds if a.get("id") == account_id), None)
        if match:
            return BankAccount(user_id=user_id, **_drop_id(match))
        return None


async def get_accounts_for_user(user_id: uuid.UUID) -> list[BankAccount]:
    return await BankAccount.find(BankAccount.user_id == user_id).to_list()


async def update_account_balance(
    account_id: str, user_id: uuid.UUID, new_balance: float
) -> BankAccount | None:
    account = await get_account_by_id(account_id, user_id)
    if not account:
        return None
    old_balance = account.balance
    account.balance = round(new_balance, 2)

    # Update spark (7-day balance history)
    spark = account.spark or []
    spark.append(round(new_balance, 2))
    account.spark = spark[-7:]

    # Recalculate delta_pct (change from last transaction's balance)
    if old_balance > 0:
        account.delta_pct = round(((new_balance - old_balance) / old_balance) * 100, 2)

    await account.save()
    return account


# ── Transactions ──────────────────────────────────────────────

async def seed_transactions_if_empty(user_id: uuid.UUID, limit: int = 50) -> list[TransactionRecord]:
    existing = await TransactionRecord.find(TransactionRecord.user_id == user_id).count()
    if existing > 0:
        return await get_transactions_for_user(user_id, limit)
    seeds = generate_transactions(user_id, limit=limit)
    docs = [
        TransactionRecord(
            user_id=user_id,
            account_id=t["account_id"],
            date=_parse_dt(t["date"]),
            description=t["description"],
            amount=t["amount"],
            currency=t["currency"],
            type=t["type"],
            status=t["status"],
            category=t.get("category"),
            beneficiary=t.get("beneficiary"),
            reference=t.get("reference"),
        )
        for t in seeds
    ]
    if docs:
        await TransactionRecord.insert_many(docs)
    return docs


async def get_transactions_for_user(
    user_id: uuid.UUID,
    limit: int = 50,
    account_id: str | None = None,
) -> list[TransactionRecord]:
    q = TransactionRecord.find(TransactionRecord.user_id == user_id)
    if account_id:
        q = q.find(TransactionRecord.account_id == account_id)
    return await q.sort(-TransactionRecord.date).limit(limit).to_list()


async def create_transaction(
    user_id: uuid.UUID,
    account_id: str,
    amount: float,
    currency: str,
    description: str,
    transaction_type: str = "debit",
    category: str | None = None,
    beneficiary: str | None = None,
    reference: str | None = None,
) -> TransactionRecord:
    record = TransactionRecord(
        user_id=user_id,
        account_id=account_id,
        date=datetime.now(UTC),
        description=description,
        amount=amount,
        currency=currency,
        type=transaction_type,
        status="completed",
        category=category,
        beneficiary=beneficiary,
        reference=reference,
    )
    return await record.insert()


async def get_transactions_for_period(
    user_id: uuid.UUID,
    year: int,
    month: int,
    account_id: str | None = None,
) -> list[TransactionRecord]:
    start = datetime(year, month, 1, tzinfo=UTC)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(year, month + 1, 1, tzinfo=UTC)
    q = TransactionRecord.find(
        TransactionRecord.user_id == user_id,
        TransactionRecord.date >= start,
        TransactionRecord.date < end,
    )
    if account_id:
        q = q.find(TransactionRecord.account_id == account_id)
    return await q.sort(TransactionRecord.date).to_list()


async def get_distinct_transaction_months(user_id: uuid.UUID) -> list[dict]:
    txns = await TransactionRecord.find(
        TransactionRecord.user_id == user_id
    ).to_list()
    seen: set[tuple[int, int]] = set()
    result: list[dict] = []
    for t in txns:
        key = (t.date.year, t.date.month)
        if key not in seen:
            seen.add(key)
            result.append({"year": t.date.year, "month": t.date.month})
    result.sort(key=lambda x: (x["year"], x["month"]), reverse=True)
    return result


# ── Cards ─────────────────────────────────────────────────────

async def seed_cards_if_empty(user_id: uuid.UUID) -> list[BankCard]:
    existing = await BankCard.find(BankCard.user_id == user_id).count()
    if existing > 0:
        return await BankCard.find(BankCard.user_id == user_id).to_list()
    seeds = generate_cards(user_id)
    docs = [BankCard(user_id=user_id, **_drop_id(c)) for c in seeds]
    if docs:
        await BankCard.insert_many(docs)
    return docs


async def get_card_by_id(card_id: str, user_id: uuid.UUID) -> BankCard | None:
    return await BankCard.find_one(
        BankCard.id == uuid.UUID(card_id), BankCard.user_id == user_id
    )


async def update_card_frozen(card_id: str, user_id: uuid.UUID, frozen: bool) -> BankCard | None:
    card = await get_card_by_id(card_id, user_id)
    if not card:
        return None
    card.frozen = frozen
    await card.save()
    return card


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
    card = BankCard(
        user_id=user_id,
        label=label,
        kind=kind,
        network=network,
        last4=last4,
        holder=holder,
        exp=exp,
        frozen=False,
        finish=finish,
        limits={"daily": 5000, "monthly": 50000, "atm": 1000, "usedDaily": 0, "usedMonthly": 0, "usedAtm": 0},
        spent_month=0,
    )
    return await card.insert()


# ── Payments ──────────────────────────────────────────────────

async def seed_payments_if_empty(user_id: uuid.UUID) -> list[ScheduledPayment]:
    existing = await ScheduledPayment.find(ScheduledPayment.user_id == user_id).count()
    if existing > 0:
        return await ScheduledPayment.find(ScheduledPayment.user_id == user_id).to_list()
    seeds = generate_payments(user_id)
    docs = [
        ScheduledPayment(
            user_id=user_id,
            description=p["description"],
            amount=p["amount"],
            currency=p["currency"],
            next_date=_parse_dt(p["next_date"] + "T00:00:00Z"),
            frequency=p["frequency"],
            beneficiary=p["beneficiary"],
        )
        for p in seeds
    ]
    if docs:
        await ScheduledPayment.insert_many(docs)
    return docs


async def get_payment_by_id(payment_id: str, user_id: uuid.UUID) -> ScheduledPayment | None:
    return await ScheduledPayment.find_one(
        ScheduledPayment.id == uuid.UUID(payment_id), ScheduledPayment.user_id == user_id
    )


async def create_payment(
    user_id: uuid.UUID,
    description: str,
    amount: float,
    currency: str,
    next_date: datetime,
    frequency: str,
    beneficiary: str,
) -> ScheduledPayment:
    payment = ScheduledPayment(
        user_id=user_id,
        description=description,
        amount=amount,
        currency=currency,
        next_date=next_date,
        frequency=frequency,
        beneficiary=beneficiary,
    )
    return await payment.insert()


async def delete_payment(payment_id: str, user_id: uuid.UUID) -> bool:
    payment = await get_payment_by_id(payment_id, user_id)
    if not payment:
        return False
    await payment.delete()
    return True


# ── Savings Goals ────────────────────────────────────────────

async def list_savings_goals(user_id: uuid.UUID) -> list[SavingsGoal]:
    existing = await SavingsGoal.find(SavingsGoal.user_id == user_id).count()
    if existing == 0:
        seeds = generate_savings_goals(user_id)
        docs = [SavingsGoal(user_id=user_id, **_drop_id(sg)) for sg in seeds]
        if docs:
            await SavingsGoal.insert_many(docs)
    return await SavingsGoal.find(SavingsGoal.user_id == user_id).to_list()


async def get_savings_goal_by_id(goal_id: str, user_id: uuid.UUID) -> SavingsGoal | None:
    return await SavingsGoal.find_one(
        SavingsGoal.id == uuid.UUID(goal_id), SavingsGoal.user_id == user_id
    )


async def create_savings_goal(
    user_id: uuid.UUID,
    name: str,
    target: float,
    currency: str,
    deadline: str,
    image: str | None = None,
) -> SavingsGoal:
    goal = SavingsGoal(
        user_id=user_id,
        name=name,
        target=target,
        current=0,
        currency=currency,
        deadline=deadline,
        image=image,
    )
    return await goal.insert()


async def update_savings_goal(
    goal_id: str, user_id: uuid.UUID, **updates
) -> SavingsGoal | None:
    goal = await get_savings_goal_by_id(goal_id, user_id)
    if not goal:
        return None
    for key, value in updates.items():
        if hasattr(goal, key) and value is not None:
            setattr(goal, key, value)
    await goal.save()
    return goal


async def delete_savings_goal(goal_id: str, user_id: uuid.UUID) -> bool:
    goal = await get_savings_goal_by_id(goal_id, user_id)
    if not goal:
        return False
    await goal.delete()
    return True


# ── Holdings ──────────────────────────────────────────────────

async def seed_holdings_if_empty(user_id: uuid.UUID) -> list[Holding]:
    existing = await Holding.find(Holding.user_id == user_id).count()
    if existing > 0:
        return await Holding.find(Holding.user_id == user_id).to_list()
    seeds = generate_holdings(user_id)
    docs = [Holding(user_id=user_id, **_drop_id(h)) for h in seeds]
    if docs:
        await Holding.insert_many(docs)
    return docs


# ── Loans ─────────────────────────────────────────────────────

async def seed_loans_if_empty(user_id: uuid.UUID) -> list[LoanRecord]:
    existing = await LoanRecord.find(LoanRecord.user_id == user_id).count()
    if existing > 0:
        return await LoanRecord.find(LoanRecord.user_id == user_id).to_list()
    seeds = generate_loans(user_id)
    docs = [LoanRecord(user_id=user_id, **_drop_id(ln)) for ln in seeds]
    if docs:
        await LoanRecord.insert_many(docs)
    return docs


# ── Currencies (global, not per-user) ─────────────────────────

async def seed_currencies_if_empty() -> list[Currency]:
    existing = await Currency.find_all().count()
    if existing > 0:
        return await Currency.find_all().to_list()
    seeds = generate_currencies(uuid.uuid4())  # seed user_id irrelevant for global data
    docs = [Currency(code=c["code"], name=c["name"], rate=c["rate"], symbol=c["symbol"]) for c in seeds]
    if docs:
        await Currency.insert_many(docs)
    return docs


# ── Insights ──────────────────────────────────────────────────

async def seed_insights_if_empty(user_id: uuid.UUID) -> list[Insight]:
    existing = await Insight.find(Insight.user_id == user_id).count()
    if existing > 0:
        return await Insight.find(Insight.user_id == user_id).to_list()
    seeds = generate_insights(user_id)
    docs = [Insight(user_id=user_id, **_drop_id(ins)) for ins in seeds]
    if docs:
        await Insight.insert_many(docs)
    return docs


# ── Activity ──────────────────────────────────────────────────

async def seed_activity_if_empty(user_id: uuid.UUID, limit: int = 20) -> list[ActivityEvent]:
    existing = await ActivityEvent.find(ActivityEvent.user_id == user_id).count()
    if existing > 0:
        return await ActivityEvent.find(ActivityEvent.user_id == user_id).sort(-ActivityEvent.occurred_at).limit(limit).to_list()
    seeds = generate_activity(user_id, limit)
    docs = [
        ActivityEvent(
            user_id=user_id,
            type=a["type"],
            description=a["description"],
            occurred_at=_parse_dt(a["occurred_at"]),
        )
        for a in seeds
    ]
    if docs:
        await ActivityEvent.insert_many(docs)
    return docs


async def create_activity_event(
    user_id: uuid.UUID,
    event_type: str,
    description: str,
) -> ActivityEvent:
    event = ActivityEvent(
        user_id=user_id,
        type=event_type,
        description=description,
        occurred_at=datetime.now(UTC),
    )
    return await event.insert()


async def get_activities_for_user(
    user_id: uuid.UUID, limit: int = 20
) -> list[ActivityEvent]:
    return (
        await ActivityEvent.find(ActivityEvent.user_id == user_id)
        .sort(-ActivityEvent.occurred_at)
        .limit(limit)
        .to_list()
    )


async def get_transaction_count_for_account(account_id: str, user_id: uuid.UUID) -> int:
    return await TransactionRecord.find(
        TransactionRecord.user_id == user_id,
        TransactionRecord.account_id == account_id,
    ).count()


# ── Budgets ───────────────────────────────────────────────────

async def seed_budgets_if_empty(user_id: uuid.UUID) -> list[BudgetEnvelope]:
    existing = await BudgetEnvelope.find(BudgetEnvelope.user_id == user_id).count()
    if existing > 0:
        return await BudgetEnvelope.find(BudgetEnvelope.user_id == user_id).to_list()
    seeds = generate_budgets(user_id)
    docs = [BudgetEnvelope(user_id=user_id, **_drop_id(b)) for b in seeds]
    if docs:
        await BudgetEnvelope.insert_many(docs)
    return docs


async def create_budget(
    user_id: uuid.UUID, category: str, budgeted: float, currency: str, color: str | None = None
) -> BudgetEnvelope:
    budget = BudgetEnvelope(
        user_id=user_id,
        category=category,
        budgeted=budgeted,
        spent=0,
        currency=currency,
        color=color,
    )
    return await budget.insert()
