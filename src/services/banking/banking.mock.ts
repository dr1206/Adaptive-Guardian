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
    };
    return mockResolve(result, { signal, latencyMs: [420, 720] });
  },
};
