import { NotFoundError, ValidationError } from "../../lib/platform/errors";
import { mockReject, mockResolve } from "../_transport/mock";
import type {
  Account,
  ActivityEvent,
  BankCard,
  BankingService,
  Beneficiary,
  BudgetEnvelope,
  Currency,
  Holding,
  Insight,
  LoanRecord,
  Payment,
  SavingsGoal,
  StatementQuery,
  StatementSample,
  StatementYearGroup,
  Transaction,
  TransactionQuery,
  TransferInput,
  TransferResult,
} from "./banking.contract";
import {
  ACCOUNTS,
  ACTIVITY_EVENTS,
  BENEFICIARIES,
  BUDGET_ENVELOPES,
  CARDS,
  CURRENCIES,
  GOALS,
  HOLDINGS,
  INSIGHTS,
  LOANS,
  PAYMENTS,
  STATEMENT_SAMPLE,
  STATEMENT_YEARS,
  TRANSACTIONS,
} from "./banking.fixtures";

export const mockBankingService: BankingService = {
  async listAccounts({ signal } = {}) {
    return mockResolve<ReadonlyArray<Account>>(ACCOUNTS, { signal });
  },
  async getAccount(id, { signal } = {}) {
    const found = ACCOUNTS.find((a) => a.id === id);
    if (!found) return mockReject(new NotFoundError("banking.account.not_found"), { signal });
    return mockResolve<Account>(found, { signal });
  },
  async listTransactions(query: TransactionQuery, { signal } = {}) {
    const filtered = query.accountId
      ? TRANSACTIONS.filter((t) => t.account === query.accountId)
      : TRANSACTIONS;
    const sliced = query.limit ? filtered.slice(0, query.limit) : filtered;
    return mockResolve<ReadonlyArray<Transaction>>(sliced, { signal });
  },
  async listBeneficiaries({ signal } = {}) {
    return mockResolve<ReadonlyArray<Beneficiary>>(BENEFICIARIES, { signal });
  },
  async listCards({ signal } = {}) {
    return mockResolve<ReadonlyArray<BankCard>>(CARDS, { signal });
  },
  async listPayments({ signal } = {}) {
    return mockResolve<ReadonlyArray<Payment>>(PAYMENTS, { signal });
  },
  async listSavingsGoals({ signal } = {}) {
    return mockResolve<ReadonlyArray<SavingsGoal>>(GOALS, { signal });
  },
  async listHoldings({ signal } = {}) {
    return mockResolve<ReadonlyArray<Holding>>(HOLDINGS, { signal });
  },
  async listLoans({ signal } = {}) {
    return mockResolve<ReadonlyArray<LoanRecord>>(LOANS, { signal });
  },
  async listCurrencies({ signal } = {}) {
    return mockResolve<ReadonlyArray<Currency>>(CURRENCIES, { signal });
  },
  async listInsights({ signal } = {}) {
    return mockResolve<ReadonlyArray<Insight>>(INSIGHTS, { signal });
  },
  async listStatementYears({ signal } = {}) {
    return mockResolve<ReadonlyArray<StatementYearGroup>>(STATEMENT_YEARS, { signal });
  },
  async getStatement(_query: StatementQuery, { signal } = {}) {
    // Demo data: same sample regardless of year/month — preserves layout
    // for archive browsing without inventing fake historical numbers.
    return mockResolve<StatementSample>(STATEMENT_SAMPLE, { signal });
  },
  async listActivity({ signal } = {}) {
    return mockResolve<ReadonlyArray<ActivityEvent>>(ACTIVITY_EVENTS, { signal });
  },
  async listBudgets({ signal } = {}) {
    return mockResolve<ReadonlyArray<BudgetEnvelope>>(BUDGET_ENVELOPES, { signal });
  },
  async addBeneficiary(b, { signal } = {}) {
    const newB: Beneficiary = {
      id: `b-${Date.now()}`,
      name: b.name,
      bank: b.bank,
      iban: b.iban,
      last4: b.iban.slice(-4),
      category: (b.category as Beneficiary["category"]) || "Recent",
      initials: b.name.slice(0, 2).toUpperCase(),
      tint: 1,
    };
    return mockResolve<Beneficiary>(newB, { signal });
  },
  async deleteBeneficiary(_id, { signal } = {}) {
    return mockResolve<void>(undefined, { signal });
  },
  async verifyBeneficiary(id, { signal } = {}) {
    const found = BENEFICIARIES.find((b) => b.id === id) || BENEFICIARIES[0];
    return mockResolve<Beneficiary>(found, { signal });
  },
  async freezeCard(cardId, { signal } = {}) {
    const card = CARDS.find((c) => c.id === cardId) || { ...CARDS[0], id: cardId };
    return mockResolve<BankCard>({ ...card, frozen: true }, { signal });
  },
  async unfreezeCard(cardId, { signal } = {}) {
    const card = CARDS.find((c) => c.id === cardId) || { ...CARDS[0], id: cardId };
    return mockResolve<BankCard>({ ...card, frozen: false }, { signal });
  },
  async updateCardLimits(cardId, limits, { signal } = {}) {
    const card = CARDS.find((c) => c.id === cardId) || { ...CARDS[0], id: cardId };
    return mockResolve<BankCard>(
      {
        ...card,
        limits: { ...card.limits, ...limits },
      },
      { signal },
    );
  },
  async changeCardPin(_cardId, _pin, { signal } = {}) {
    return mockResolve({ status: "success", message: "Card PIN updated" }, { signal });
  },
  async createPayment(p, { signal } = {}) {
    const newP: Payment = {
      id: `pay-${Date.now()}`,
      name: p.description,
      description: p.description,
      category: "Bills",
      nextDate: p.nextDate,
      amount: p.amount,
      status: "auto",
      currency: p.currency,
      frequency: p.frequency,
      beneficiary: p.beneficiary,
    };
    return mockResolve<Payment>(newP, { signal });
  },
  async deletePayment(_id, { signal } = {}) {
    return mockResolve<void>(undefined, { signal });
  },
  async pausePayment(id, { signal } = {}) {
    const found = PAYMENTS.find((p) => p.id === id) || PAYMENTS[0];
    return mockResolve<Payment>({ ...found, status: "paused" }, { signal });
  },
  async resumePayment(id, { signal } = {}) {
    const found = PAYMENTS.find((p) => p.id === id) || PAYMENTS[0];
    return mockResolve<Payment>({ ...found, status: "active" }, { signal });
  },
  async createSavingsGoal(g, { signal } = {}) {
    const newG: SavingsGoal = {
      id: `sg-${Date.now()}`,
      name: g.name,
      icon: "🎯",
      category: g.category || "Travel",
      saved: 0,
      current: 0,
      target: g.target,
      monthly: g.monthly || Math.round(g.target / 12),
      eta: "1 Year",
      currency: g.currency,
      deadline: g.deadline,
      image: g.image,
    };
    return mockResolve<SavingsGoal>(newG, { signal });
  },
  async contributeSavingsGoal(id, amount, _acc, { signal } = {}) {
    const found = GOALS.find((g) => g.id === id) || GOALS[0];
    const newSaved = (found.saved ?? found.current ?? 0) + amount;
    return mockResolve<SavingsGoal>({ ...found, saved: newSaved, current: newSaved }, { signal });
  },
  async withdrawSavingsGoal(id, amount, _acc, { signal } = {}) {
    const found = GOALS.find((g) => g.id === id) || GOALS[0];
    const newSaved = Math.max(0, (found.saved ?? found.current ?? 0) - amount);
    return mockResolve<SavingsGoal>({ ...found, saved: newSaved, current: newSaved }, { signal });
  },
  async deleteSavingsGoal(_id, { signal } = {}) {
    return mockResolve<void>(undefined, { signal });
  },
  async executeExchange(input, { signal } = {}) {
    return mockResolve(
      {
        transactionId: `fx-${Date.now()}`,
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        fromAmount: input.fromAmount,
        toAmount: input.fromAmount * 86.5,
        rate: 86.5,
        fee: input.fromAmount * 0.002,
        executedAt: new Date().toISOString(),
      },
      { signal },
    );
  },
  async exportStatement(_year, _month, { signal } = {}) {
    const blob = new Blob(["Date,Amount,Description\n"], { type: "text/csv" });
    return mockResolve(blob, { signal });
  },
  async exportStatementCsv(year, month, { signal } = {}) {
    return this.exportStatement(year, month, { signal });
  },
  async createBudget(b, { signal } = {}) {
    const newB: BudgetEnvelope = {
      id: `bg-${Date.now()}`,
      name: b.category,
      category: b.category,
      budget: b.budgeted,
      budgeted: b.budgeted,
      spent: 0,
      currency: b.currency,
      color: b.color || "emerald",
    };
    return mockResolve<BudgetEnvelope>(newB, { signal });
  },
  async deleteBudget(_id, { signal } = {}) {
    return mockResolve<void>(undefined, { signal });
  },
  async createDispute(input, { signal } = {}) {
    return mockResolve(
      {
        id: `dsp-${Date.now()}`,
        transactionId: input.transactionId,
        reason: input.reason,
        status: "under_review",
      },
      { signal },
    );
  },
  async listDisputes({ signal } = {}) {
    return mockResolve([], { signal });
  },
  async initiateTransfer(input: TransferInput, { signal } = {}) {
    if (input.amount <= 0) {
      return mockReject(
        new ValidationError("Amount must be greater than zero.", { field: "amount" }),
        { signal },
      );
    }
    const acc = ACCOUNTS.find((a) => a.id === input.fromAccountId);
    if (!acc) return mockReject(new NotFoundError("banking.account.not_found"), { signal });
    if (input.amount > acc.balance) {
      return mockReject(
        new ValidationError("Insufficient available balance.", { field: "amount" }),
        { signal },
      );
    }
    const result: TransferResult = {
      transactionId: `txn_${Date.now().toString(36)}`,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
      signature: `sig_${Math.random().toString(36).slice(2, 10)}`,
      status: "COMPLETED",
      riskScore: 0.12,
      riskDecision: "ALLOW",
      message: "Transfer completed successfully",
    };
    return mockResolve(result, { signal, latencyMs: [420, 720] });
  },
};
