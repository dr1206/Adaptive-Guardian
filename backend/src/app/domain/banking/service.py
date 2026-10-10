import csv
import io
import json
import logging
import uuid
from datetime import UTC, datetime

from app.domain.auth import repository as auth_repo
from app.domain.auth.service import generate_otp_code, redis_delete_otp, redis_get_otp, redis_set_otp
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
    CardLimitsUpdate,
    Currency,
    DepositInput,
    DepositResult,
    DisputeInput,
    DisputeOut,
    ExchangeExecuteResult,
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
from app.domain.security.ml_service import behavioral_ml_service
from app.shared.errors import ConflictError, NotFoundError, ValidationError
from app.shared.money import from_paise, to_paise

logger = logging.getLogger(__name__)


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

async def create_transfer(
    user_id: uuid.UUID,
    data: TransferInput,
    user_email: str | None = None,
) -> TransferResult:
    # 1. Idempotency Check
    if data.idempotency_key:
        existing = await repo.check_idempotency(user_id, data.idempotency_key)
        if existing:
            if existing.status == "completed" and existing.response_payload:
                return TransferResult(**existing.response_payload)
            if existing.status == "pending":
                raise ConflictError("Transfer with this idempotency key is already in progress")
        await repo.start_idempotency(user_id, data.idempotency_key, "transfer", data.model_dump())

    account_doc = await repo.get_account_by_id(data.from_account_id, user_id)
    if not account_doc:
        raise NotFoundError("Source account not found")

    beneficiary = await repo.get_beneficiary_by_id(data.beneficiary_id, user_id)
    if not beneficiary:
        raise NotFoundError("Beneficiary not found")

    if data.currency != account_doc.currency:
        raise ValidationError("Currency mismatch with source account")

    # 2. Precise Paise Calculation & Balance Check
    amount_paise = to_paise(data.amount)
    if not account_doc.balance_paise and account_doc.balance:
        account_doc.balance_paise = to_paise(account_doc.balance)

    if amount_paise > (account_doc.balance_paise or 0):
        raise ValidationError("Insufficient funds")

    # 3. Beneficiary Cooling Period Check
    if beneficiary.cooling_until and datetime.now(UTC) < _ensure_tz(beneficiary.cooling_until):
        cooling_limit = beneficiary.cooling_limit_paise or 5_000_000  # Default ₹50,000 cooling limit
        if amount_paise > cooling_limit:
            cooling_str = beneficiary.cooling_until.strftime("%d %b %Y, %H:%M UTC")
            raise ValidationError(
                f"Beneficiary is in cooling period until {cooling_str}. Maximum allowed per transaction is ₹{from_paise(cooling_limit):,.2f}."
            )

    # 4. Behavioral Risk Evaluation
    risk_score = 0.12
    risk_decision = "ALLOW"

    # A. Check if caller already supplied verified challenge OTP
    if data.challenge_id and data.otp_code:
        stored = await redis_get_otp(str(data.challenge_id))
        if not stored:
            raise ValidationError("OTP challenge has expired or is invalid. Please request a new one.")
        payload = json.loads(stored)
        if payload.get("code") != data.otp_code:
            raise ValidationError("Invalid OTP code. Authentication failed.")
        await redis_delete_otp(str(data.challenge_id))
        risk_decision = "STEP_UP_VERIFIED"
        risk_score = 0.20
    else:
        # B. Behavioral feature resolution: use direct request features or recent session window
        features_to_eval = data.behavioral_features
        if not features_to_eval:
            try:
                from app.domain.aegis.models import BehaviorWindow
                latest_win = (
                    await BehaviorWindow.find(BehaviorWindow.user_id == user_id)
                    .sort("-created_at")
                    .first_or_none()
                )
                if latest_win and latest_win.features:
                    features_to_eval = latest_win.features
            except Exception as win_err:
                logger.debug("Recent behavioral window lookup note: %s", win_err)

        if features_to_eval:
            try:
                target_identity = user_email or str(user_id)
                pred = behavioral_ml_service.predict(
                    user_id=target_identity,
                    features=features_to_eval,
                )
                risk_score = float(pred.get("fused_score", 0.12))
                raw_decision = str(pred.get("decision", "ALLOW")).upper()
                if raw_decision == "DENY" or risk_score > 0.85:
                    risk_decision = "DENY"
                elif raw_decision == "CHALLENGE" or risk_score >= 0.65:
                    risk_decision = "CHALLENGE"
                elif raw_decision == "WARN" or risk_score >= 0.45:
                    risk_decision = "WARN"
                else:
                    risk_decision = "ALLOW"
            except Exception as e:
                logger.error("ML evaluation error during transfer for user %s: %s", user_id, e)
                # Fail-safe security policy: flag anomaly as warning rather than silently zeroing risk
                risk_decision = "WARN"
                risk_score = 0.50

        if risk_decision == "DENY":
            await repo.create_activity_event(
                user_id=user_id,
                event_type="transfer_blocked",
                description=f"Transfer of {data.amount:,.2f} {data.currency} blocked by behavioral fraud prevention engine (Risk score: {risk_score:.2f}).",
            )
            raise ValidationError("Transaction blocked by adaptive fraud risk engine due to critical behavioral anomaly.")

        if risk_decision == "CHALLENGE":
            # Issue step-up OTP challenge
            otp = generate_otp_code()
            chal = await auth_repo.create_otp_challenge(user_id=user_id, purpose="transfer_step_up")
            await redis_set_otp(
                str(chal.challenge_id),
                json.dumps({"code": otp, "pending": {"transfer": data.model_dump()}}),
                ttl=300,
            )
            logger.info("Transfer step-up OTP issued: challenge_id=%s (OTP: %s)", chal.challenge_id, otp)
            return TransferResult(
                transaction_id="",
                scheduled_for=_fmt_dt(datetime.now(UTC)),
                signature="",
                status="CHALLENGED",
                risk_score=risk_score,
                risk_decision="CHALLENGE",
                challenge_id=str(chal.challenge_id),
                message="Step-up OTP authentication required due to risk anomaly.",
            )

    # 5. Balance Deduction
    new_balance_paise = account_doc.balance_paise - amount_paise
    new_balance = from_paise(new_balance_paise)
    account_doc.balance_paise = new_balance_paise
    account_doc.balance = new_balance
    await account_doc.save()

    transfer_ref = f"TRF-{uuid.uuid4().hex[:12].upper()}"

    # 6. Immutable Double-Entry Ledger Movement
    await repo.record_ledger_movement(
        user_id=user_id,
        transaction_ref=transfer_ref,
        transaction_type="transfer",
        amount_paise=amount_paise,
        currency=data.currency,
        source_account_id=data.from_account_id,
        destination_account_id=str(beneficiary.id),
        reference=data.reference or transfer_ref,
        risk_score=risk_score,
        risk_decision=risk_decision,
    )

    # 7. Create Transfer Record
    record = await repo.create_transfer(
        user_id=user_id,
        from_account_id=data.from_account_id,
        beneficiary_id=data.beneficiary_id,
        beneficiary_name=beneficiary.name,
        amount=data.amount,
        currency=data.currency,
        reference=data.reference or transfer_ref,
        amount_paise=amount_paise,
        risk_score=risk_score,
        risk_decision=risk_decision,
    )

    # 8. Transaction & Activity Records
    await repo.create_transaction(
        user_id=user_id,
        account_id=data.from_account_id,
        amount=data.amount,
        currency=data.currency,
        description=f"Transfer to {beneficiary.name}",
        transaction_type="debit",
        category="transfer",
        beneficiary=beneficiary.name,
        reference=data.reference or transfer_ref,
    )

    if risk_decision == "WARN":
        await repo.create_activity_event(
            user_id=user_id,
            event_type="transfer_warned",
            description=f"Transfer of {data.amount:,.2f} {data.currency} to {beneficiary.name} flagged with behavioral divergence warning (Risk score: {risk_score:.2f}).",
        )
    else:
        await repo.create_activity_event(
            user_id=user_id,
            event_type="transfer",
            description=f"Transferred {data.amount:,.2f} {data.currency} to {beneficiary.name}",
        )

    # 9. Beneficiary Update
    beneficiary.last_used = datetime.now(UTC)
    await beneficiary.save()

    message_text = (
        "Transfer completed under behavioral anomaly warning"
        if risk_decision == "WARN"
        else "Transfer completed successfully"
    )

    result = TransferResult(
        transaction_id=str(record.id),
        scheduled_for=_fmt_dt(record.scheduled_for),
        signature=record.signature,
        status="COMPLETED",
        risk_score=risk_score,
        risk_decision=risk_decision,
        message=message_text,
    )

    if data.idempotency_key:
        await repo.finish_idempotency(user_id, data.idempotency_key, result.model_dump())

    return result


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
            category=getattr(b, "category", "General"),
            is_verified=getattr(b, "is_verified", True),
            cooling_until=_fmt_dt(b.cooling_until) if getattr(b, "cooling_until", None) else None,
            cooling_limit=from_paise(getattr(b, "cooling_limit_paise", 5000000)) if getattr(b, "cooling_limit_paise", None) else None,
            last_used=_fmt_dt(b.last_used) if b.last_used else None,
        )
        for b in results
    ]


async def add_beneficiary(user_id: uuid.UUID, data: BeneficiaryInput) -> BeneficiaryOut:
    existing = await repo.get_beneficiaries_for_user(user_id)
    for b in existing:
        if b.iban == data.iban:
            raise ConflictError("Beneficiary with this account/IBAN already exists")

    beneficiary = await repo.create_beneficiary(
        user_id=user_id,
        name=data.name,
        iban=data.iban,
        bank=data.bank,
        currency=data.currency,
        category=data.category,
    )

    await repo.create_activity_event(
        user_id=user_id,
        event_type="beneficiary_added",
        description=f"Added beneficiary {data.name} ({data.bank})",
    )

    return BeneficiaryOut(
        id=str(beneficiary.id),
        name=beneficiary.name,
        iban=beneficiary.iban,
        bank=beneficiary.bank,
        currency=beneficiary.currency,
        category=beneficiary.category,
        is_verified=beneficiary.is_verified,
        cooling_until=_fmt_dt(beneficiary.cooling_until) if beneficiary.cooling_until else None,
        cooling_limit=from_paise(beneficiary.cooling_limit_paise) if beneficiary.cooling_limit_paise else None,
        last_used=None,
    )


async def delete_beneficiary(user_id: uuid.UUID, beneficiary_id: str) -> None:
    deleted = await repo.delete_beneficiary(beneficiary_id, user_id)
    if not deleted:
        raise NotFoundError("Beneficiary not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="beneficiary_deleted",
        description="Removed beneficiary",
    )


async def verify_beneficiary(user_id: uuid.UUID, beneficiary_id: str) -> BeneficiaryOut:
    doc = await repo.verify_beneficiary(beneficiary_id, user_id)
    if not doc:
        raise NotFoundError("Beneficiary not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="beneficiary_verified",
        description=f"Verified beneficiary {doc.name}",
    )
    return BeneficiaryOut(
        id=str(doc.id),
        name=doc.name,
        iban=doc.iban,
        bank=doc.bank,
        currency=doc.currency,
        category=doc.category,
        is_verified=doc.is_verified,
        cooling_until=None,
        cooling_limit=None,
        last_used=_fmt_dt(doc.last_used) if doc.last_used else None,
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


async def update_card_limits(
    user_id: uuid.UUID, card_id: str, data: CardLimitsUpdate
) -> BankCard:
    limits_dict = data.model_dump(exclude_unset=True)
    card = await repo.update_card_limits(card_id, user_id, limits_dict)
    if not card:
        raise NotFoundError("Card not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="card_limits_updated",
        description=f"Updated spending limits for {card.label}",
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


async def change_card_pin(
    user_id: uuid.UUID, card_id: str, new_pin: str
) -> dict[str, str]:
    if len(new_pin) != 4 or not new_pin.isdigit():
        raise ValidationError("PIN must be exactly 4 digits")
    card = await repo.get_card_by_id(card_id, user_id)
    if not card:
        raise NotFoundError("Card not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="card_pin_changed",
        description=f"Changed security PIN for card ending in {card.last4}",
    )
    return {"status": "success", "message": "Card PIN updated successfully"}


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
            status=getattr(d, "status", "active"),
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
        status=getattr(doc, "status", "active"),
    )


async def delete_payment(user_id: uuid.UUID, payment_id: str) -> None:
    deleted = await repo.delete_payment(payment_id, user_id)
    if not deleted:
        raise NotFoundError("Payment not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="payment_cancelled",
        description="Cancelled scheduled recurring payment",
    )


async def pause_payment(user_id: uuid.UUID, payment_id: str) -> Payment:
    doc = await repo.update_payment_status(payment_id, user_id, "paused")
    if not doc:
        raise NotFoundError("Payment not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="payment_paused",
        description=f"Paused recurring payment for {doc.description}",
    )
    return Payment(
        id=str(doc.id),
        description=doc.description,
        amount=doc.amount,
        currency=doc.currency,
        next_date=doc.next_date.strftime("%Y-%m-%d"),
        frequency=doc.frequency,
        beneficiary=doc.beneficiary,
        status=doc.status,
    )


async def resume_payment(user_id: uuid.UUID, payment_id: str) -> Payment:
    doc = await repo.update_payment_status(payment_id, user_id, "active")
    if not doc:
        raise NotFoundError("Payment not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="payment_resumed",
        description=f"Resumed recurring payment for {doc.description}",
    )
    return Payment(
        id=str(doc.id),
        description=doc.description,
        amount=doc.amount,
        currency=doc.currency,
        next_date=doc.next_date.strftime("%Y-%m-%d"),
        frequency=doc.frequency,
        beneficiary=doc.beneficiary,
        status=doc.status,
    )


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
    await repo.create_activity_event(
        user_id=user_id,
        event_type="goal_created",
        description=f"Created savings goal: {name} (Target: ₹{target:,.2f})",
    )
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
    await repo.create_activity_event(
        user_id=user_id,
        event_type="goal_deleted",
        description="Removed savings goal",
    )


async def contribute_savings_goal(
    user_id: uuid.UUID,
    goal_id: str,
    amount: float,
    from_account_id: str | None = None,
) -> SavingsGoal:
    if amount <= 0:
        raise ValidationError("Contribution amount must be greater than zero")

    goal = await repo.get_savings_goal_by_id(goal_id, user_id)
    if not goal:
        raise NotFoundError("Savings goal not found")

    if from_account_id:
        acc = await repo.get_account_by_id(from_account_id, user_id)
        if not acc:
            raise NotFoundError("Source account not found")
        amt_paise = to_paise(amount)
        if acc.balance_paise is None:
            acc.balance_paise = to_paise(acc.balance)
        if amt_paise > acc.balance_paise:
            raise ValidationError("Insufficient funds in selected account")
        acc.balance_paise -= amt_paise
        acc.balance = from_paise(acc.balance_paise)
        await acc.save()

        await repo.create_transaction(
            user_id=user_id,
            account_id=from_account_id,
            amount=amount,
            currency=acc.currency,
            description=f"Contribution to savings goal: {goal.name}",
            transaction_type="debit",
            category="savings",
            beneficiary=goal.name,
            reference=f"SAV-{uuid.uuid4().hex[:8].upper()}",
        )

    goal.current = round(goal.current + amount, 2)
    await goal.save()

    await repo.create_activity_event(
        user_id=user_id,
        event_type="goal_funded",
        description=f"Contributed ₹{amount:,.2f} to {goal.name}",
    )
    return SavingsGoal(
        id=str(goal.id),
        name=goal.name,
        target=goal.target,
        current=goal.current,
        currency=goal.currency,
        deadline=goal.deadline,
        image=goal.image,
    )


async def withdraw_savings_goal(
    user_id: uuid.UUID,
    goal_id: str,
    amount: float,
    to_account_id: str | None = None,
) -> SavingsGoal:
    if amount <= 0:
        raise ValidationError("Withdrawal amount must be greater than zero")

    goal = await repo.get_savings_goal_by_id(goal_id, user_id)
    if not goal:
        raise NotFoundError("Savings goal not found")

    if amount > goal.current:
        raise ValidationError("Withdrawal amount exceeds current goal savings")

    if to_account_id:
        acc = await repo.get_account_by_id(to_account_id, user_id)
        if not acc:
            raise NotFoundError("Destination account not found")
        amt_paise = to_paise(amount)
        if acc.balance_paise is None:
            acc.balance_paise = to_paise(acc.balance)
        acc.balance_paise += amt_paise
        acc.balance = from_paise(acc.balance_paise)
        await acc.save()

        await repo.create_transaction(
            user_id=user_id,
            account_id=to_account_id,
            amount=amount,
            currency=acc.currency,
            description=f"Withdrawal from savings goal: {goal.name}",
            transaction_type="credit",
            category="savings",
            beneficiary="Self",
            reference=f"WDG-{uuid.uuid4().hex[:8].upper()}",
        )

    goal.current = round(goal.current - amount, 2)
    await goal.save()

    await repo.create_activity_event(
        user_id=user_id,
        event_type="goal_withdrawal",
        description=f"Withdrew ₹{amount:,.2f} from {goal.name}",
    )
    return SavingsGoal(
        id=str(goal.id),
        name=goal.name,
        target=goal.target,
        current=goal.current,
        currency=goal.currency,
        deadline=goal.deadline,
        image=goal.image,
    )


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


async def execute_exchange(
    user_id: uuid.UUID,
    from_currency: str,
    to_currency: str,
    from_amount: float,
    from_account_id: str | None = None,
) -> ExchangeExecuteResult:
    if from_amount <= 0:
        raise ValidationError("Exchange amount must be greater than zero")

    currencies = await list_currencies(user_id)
    rate_map = {c.code.upper(): c.rate for c in currencies}

    from_curr = from_currency.upper()
    to_curr = to_currency.upper()

    rate_from = rate_map.get(from_curr, 1.0)
    rate_to = rate_map.get(to_curr, 1.0)

    effective_rate = round(rate_to / rate_from, 4) if rate_from > 0 else 1.0
    to_amount = round(from_amount * effective_rate, 2)
    fee = round(from_amount * 0.002, 2)

    if from_account_id:
        acc = await repo.get_account_by_id(from_account_id, user_id)
        if acc:
            total_debit = from_amount + fee
            total_debit_paise = to_paise(total_debit)
            if acc.balance_paise is None:
                acc.balance_paise = to_paise(acc.balance)
            if total_debit_paise > acc.balance_paise:
                raise ValidationError("Insufficient funds for currency exchange")
            acc.balance_paise -= total_debit_paise
            acc.balance = from_paise(acc.balance_paise)
            await acc.save()

            await repo.create_transaction(
                user_id=user_id,
                account_id=from_account_id,
                amount=total_debit,
                currency=acc.currency,
                description=f"FX Exchange: {from_curr} to {to_curr} @ {effective_rate}",
                transaction_type="debit",
                category="exchange",
                beneficiary="FX Treasury",
                reference=f"FX-{uuid.uuid4().hex[:8].upper()}",
            )

    tx_id = f"FX-{uuid.uuid4().hex[:10].upper()}"
    await repo.create_activity_event(
        user_id=user_id,
        event_type="exchange_executed",
        description=f"Exchanged {from_amount:,.2f} {from_curr} to {to_amount:,.2f} {to_curr}",
    )

    return ExchangeExecuteResult(
        transaction_id=tx_id,
        from_currency=from_curr,
        to_currency=to_curr,
        from_amount=from_amount,
        to_amount=to_amount,
        rate=effective_rate,
        fee=fee,
        executed_at=_fmt_dt(datetime.now(UTC)),
    )


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


async def export_statement_csv(user_id: uuid.UUID, year: int, month: int) -> str:
    txns = await repo.get_transactions_for_period(user_id, year, month)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Reference", "Description", "Category", "Type", "Amount", "Currency", "Status"])
    for t in txns:
        writer.writerow([
            _fmt_dt(t.date),
            t.reference or "",
            t.description,
            t.category or "General",
            t.type,
            f"{t.amount:.2f}",
            t.currency,
            t.status,
        ])
    return output.getvalue()


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
    if data.idempotency_key:
        existing = await repo.check_idempotency(user_id, data.idempotency_key)
        if existing:
            if existing.status == "completed" and existing.response_payload:
                return DepositResult(**existing.response_payload)
            if existing.status == "pending":
                raise ConflictError("Deposit is already processing")
        await repo.start_idempotency(user_id, data.idempotency_key, "deposit", data.model_dump())

    account_doc = await repo.get_account_by_id(data.account_id, user_id)
    if not account_doc:
        raise NotFoundError("Account not found")

    amount_paise = to_paise(data.amount)
    if account_doc.balance_paise is None:
        account_doc.balance_paise = to_paise(account_doc.balance)

    new_balance_paise = account_doc.balance_paise + amount_paise
    new_balance = from_paise(new_balance_paise)
    account_doc.balance_paise = new_balance_paise
    account_doc.balance = new_balance
    await account_doc.save()

    deposit_ref = data.reference or f"DEP-{uuid.uuid4().hex[:10].upper()}"

    await repo.record_ledger_movement(
        user_id=user_id,
        transaction_ref=deposit_ref,
        transaction_type="deposit",
        amount_paise=amount_paise,
        currency=data.currency,
        source_account_id=None,
        destination_account_id=data.account_id,
        reference=deposit_ref,
        risk_score=0.01,
        risk_decision="ALLOW",
    )

    txn = await repo.create_transaction(
        user_id=user_id,
        account_id=data.account_id,
        amount=data.amount,
        currency=data.currency,
        description=data.description or "Account Deposit",
        transaction_type="credit",
        category="deposit",
        reference=deposit_ref,
    )

    await repo.create_activity_event(
        user_id=user_id,
        event_type="deposit",
        description=f"Deposited {data.amount:,.2f} {data.currency} to {account_doc.name}",
    )

    res = DepositResult(
        transaction_id=str(txn.id),
        new_balance=new_balance,
        currency=data.currency,
    )

    if data.idempotency_key:
        await repo.finish_idempotency(user_id, data.idempotency_key, res.model_dump())

    return res


# ── Budgets ───────────────────────────────────────────────────

async def list_budgets(user_id: uuid.UUID) -> list[BudgetEnvelope]:
    docs = await repo.seed_budgets_if_empty(user_id)

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
    await repo.create_activity_event(
        user_id=user_id,
        event_type="budget_created",
        description=f"Created budget envelope for {category} ({budgeted:,.2f} {currency})",
    )
    return BudgetEnvelope(
        id=str(doc.id),
        category=doc.category,
        budgeted=doc.budgeted,
        spent=doc.spent,
        currency=doc.currency,
        color=doc.color,
    )


async def delete_budget(user_id: uuid.UUID, budget_id: str) -> None:
    deleted = await repo.delete_budget(budget_id, user_id)
    if not deleted:
        raise NotFoundError("Budget envelope not found")
    await repo.create_activity_event(
        user_id=user_id,
        event_type="budget_deleted",
        description="Removed budget envelope",
    )


# ── Disputes ──────────────────────────────────────────────────

async def create_dispute(user_id: uuid.UUID, data: DisputeInput) -> DisputeOut:
    dispute = await repo.create_dispute(
        user_id=user_id,
        transaction_id=data.transaction_id,
        reason=data.reason,
        explanation=data.explanation,
    )
    await repo.create_activity_event(
        user_id=user_id,
        event_type="dispute_filed",
        description=f"Filed dispute for transaction {data.transaction_id[:8]}",
    )
    return DisputeOut(
        id=str(dispute.id),
        transaction_id=dispute.transaction_id,
        reason=dispute.reason,
        explanation=dispute.explanation,
        status=dispute.status,
        created_at=_fmt_dt(dispute.created_at),
    )


async def list_disputes(user_id: uuid.UUID) -> list[DisputeOut]:
    disputes = await repo.get_disputes_for_user(user_id)
    return [
        DisputeOut(
            id=str(d.id),
            transaction_id=d.transaction_id,
            reason=d.reason,
            explanation=d.explanation,
            status=d.status,
            created_at=_fmt_dt(d.created_at),
        )
        for d in disputes
    ]
