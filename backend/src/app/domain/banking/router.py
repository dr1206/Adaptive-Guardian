from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from app.api.deps import get_current_user
from app.domain.banking import service
from app.domain.banking.schemas import (
    Account,
    ActivityEvent,
    BankCard,
    BeneficiaryInput,
    BeneficiaryOut,
    BudgetEnvelope,
    BudgetInput,
    CardInput,
    CardLimitsUpdate,
    CardPinChange,
    Currency,
    DepositInput,
    DepositResult,
    DisputeInput,
    DisputeOut,
    ExchangeExecuteInput,
    ExchangeExecuteResult,
    GoalFundAction,
    Holding,
    Insight,
    LoanRecord,
    Payment,
    PaymentInput,
    SavingsGoal,
    SavingsGoalInput,
    SavingsGoalUpdate,
    StatementSample,
    StatementYearGroup,
    Transaction,
    TransferInput,
    TransferResult,
)

router = APIRouter(tags=["banking"])


def _uid(current_user: dict[str, Any]) -> UUID:
    return UUID(current_user["sub"])


# ── Accounts ──────────────────────────────────────────────────


@router.get("/accounts", response_model=list[Account])
async def list_accounts(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_accounts(_uid(current_user))


@router.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str, current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.get_account(_uid(current_user), account_id)


# ── Transactions ──────────────────────────────────────────────


@router.get("/transactions", response_model=list[Transaction])
async def list_transactions(
    account_id: str | None = Query(None, alias="accountId"),
    limit: int = Query(50),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.list_transactions(_uid(current_user), account_id=account_id, limit=limit)


# ── Transfers ─────────────────────────────────────────────────


@router.post("/transfers", response_model=TransferResult, status_code=201)
async def create_transfer(
    data: TransferInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_transfer(
        _uid(current_user),
        data,
        user_email=current_user.get("email"),
    )


# ── Deposits ──────────────────────────────────────────────────

@router.post("/deposits", response_model=DepositResult, status_code=201)
async def create_deposit(
    data: DepositInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_deposit(_uid(current_user), data)


# ── Beneficiaries ─────────────────────────────────────────────


@router.get("/beneficiaries", response_model=list[BeneficiaryOut])
async def list_beneficiaries(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_beneficiaries(_uid(current_user))


@router.post("/beneficiaries", response_model=BeneficiaryOut, status_code=201)
async def add_beneficiary(
    data: BeneficiaryInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.add_beneficiary(_uid(current_user), data)


@router.delete("/beneficiaries/{beneficiary_id}", status_code=204)
async def delete_beneficiary(
    beneficiary_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    await service.delete_beneficiary(_uid(current_user), beneficiary_id)


@router.post("/beneficiaries/{beneficiary_id}/verify", response_model=BeneficiaryOut)
async def verify_beneficiary(
    beneficiary_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.verify_beneficiary(_uid(current_user), beneficiary_id)


# ── Cards ─────────────────────────────────────────────────────


@router.get("/cards", response_model=list[BankCard])
async def list_cards(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_cards(_uid(current_user))


@router.post("/cards", response_model=BankCard, status_code=201)
async def create_card(
    data: CardInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_card(
        _uid(current_user),
        data.label, data.kind, data.network, data.last4,
        data.holder, data.exp, data.finish,
    )


@router.patch("/cards/{card_id}/freeze", response_model=BankCard)
async def freeze_card(
    card_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.freeze_card(_uid(current_user), card_id)


@router.patch("/cards/{card_id}/unfreeze", response_model=BankCard)
async def unfreeze_card(
    card_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.unfreeze_card(_uid(current_user), card_id)


@router.patch("/cards/{card_id}/limits", response_model=BankCard)
async def update_card_limits(
    card_id: str,
    data: CardLimitsUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.update_card_limits(_uid(current_user), card_id, data)


@router.post("/cards/{card_id}/pin")
async def change_card_pin(
    card_id: str,
    data: CardPinChange,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.change_card_pin(_uid(current_user), card_id, data.pin)


# ── Payments ──────────────────────────────────────────────────


@router.get("/payments", response_model=list[Payment])
async def list_payments(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_payments(_uid(current_user))


@router.post("/payments", response_model=Payment, status_code=201)
async def create_payment(
    data: PaymentInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_payment(
        _uid(current_user),
        data.description, data.amount, data.currency,
        data.next_date, data.frequency, data.beneficiary,
    )


@router.delete("/payments/{payment_id}", status_code=204)
async def delete_payment(
    payment_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    await service.delete_payment(_uid(current_user), payment_id)


@router.patch("/payments/{payment_id}/pause", response_model=Payment)
async def pause_payment(
    payment_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.pause_payment(_uid(current_user), payment_id)


@router.patch("/payments/{payment_id}/resume", response_model=Payment)
async def resume_payment(
    payment_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.resume_payment(_uid(current_user), payment_id)


# ── Savings Goals ─────────────────────────────────────────────


@router.get("/savings-goals", response_model=list[SavingsGoal])
async def list_savings_goals(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_savings_goals(_uid(current_user))


@router.post("/savings-goals", response_model=SavingsGoal, status_code=201)
async def create_savings_goal(
    data: SavingsGoalInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_savings_goal(
        _uid(current_user),
        data.name, data.target, data.currency, data.deadline, data.image,
    )


@router.patch("/savings-goals/{goal_id}", response_model=SavingsGoal)
async def update_savings_goal(
    goal_id: str,
    data: SavingsGoalUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.update_savings_goal(
        _uid(current_user), goal_id,
        name=data.name, target=data.target, current=data.current, deadline=data.deadline,
    )


@router.delete("/savings-goals/{goal_id}", status_code=204)
async def delete_savings_goal(
    goal_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    await service.delete_savings_goal(_uid(current_user), goal_id)


@router.post("/savings-goals/{goal_id}/contribute", response_model=SavingsGoal)
async def contribute_savings_goal(
    goal_id: str,
    data: GoalFundAction,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.contribute_savings_goal(
        _uid(current_user), goal_id, data.amount, data.account_id
    )


@router.post("/savings-goals/{goal_id}/withdraw", response_model=SavingsGoal)
async def withdraw_savings_goal(
    goal_id: str,
    data: GoalFundAction,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.withdraw_savings_goal(
        _uid(current_user), goal_id, data.amount, data.account_id
    )


# ── Holdings ──────────────────────────────────────────────────


@router.get("/holdings", response_model=list[Holding])
async def list_holdings(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_holdings(_uid(current_user))


# ── Loans ─────────────────────────────────────────────────────


@router.get("/loans", response_model=list[LoanRecord])
async def list_loans(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_loans(_uid(current_user))


# ── Currencies ────────────────────────────────────────────────


@router.get("/currencies", response_model=list[Currency])
async def list_currencies(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_currencies(_uid(current_user))


@router.post("/exchange/execute", response_model=ExchangeExecuteResult)
async def execute_exchange(
    data: ExchangeExecuteInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.execute_exchange(
        _uid(current_user),
        data.from_currency,
        data.to_currency,
        data.from_amount,
        data.from_account_id,
    )


# ── Insights ──────────────────────────────────────────────────


@router.get("/insights", response_model=list[Insight])
async def list_insights(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_insights(_uid(current_user))


# ── Statements ────────────────────────────────────────────────


@router.get("/statements/years", response_model=list[StatementYearGroup])
async def list_statement_years(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_statement_years(_uid(current_user))


@router.get("/statements/{year}/{month}", response_model=StatementSample)
async def get_statement(
    year: int,
    month: int,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.get_statement(_uid(current_user), year, month)


@router.get("/statements/{year}/{month}/export")
async def export_statement(
    year: int,
    month: int,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    csv_content = await service.export_statement_csv(_uid(current_user), year, month)
    filename = f"statement_{year}_{month:02d}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Activity ──────────────────────────────────────────────────


@router.get("/activity", response_model=list[ActivityEvent])
async def list_activity(
    limit: int = Query(20),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.list_activity(_uid(current_user), limit=limit)


# ── Budgets ───────────────────────────────────────────────────


@router.get("/budgets", response_model=list[BudgetEnvelope])
async def list_budgets(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_budgets(_uid(current_user))


@router.post("/budgets", response_model=BudgetEnvelope, status_code=201)
async def create_budget(
    data: BudgetInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_budget(
        _uid(current_user), data.category, data.budgeted, data.currency, data.color
    )


@router.delete("/budgets/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    await service.delete_budget(_uid(current_user), budget_id)


# ── Disputes ──────────────────────────────────────────────────


@router.post("/disputes", response_model=DisputeOut, status_code=201)
async def create_dispute(
    data: DisputeInput,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    return await service.create_dispute(_uid(current_user), data)


@router.get("/disputes", response_model=list[DisputeOut])
async def list_disputes(current_user: dict[str, Any] = Depends(get_current_user)):
    return await service.list_disputes(_uid(current_user))
