/**
 * Banking domain contract.
 *
 * Types are sourced from `banking.fixtures` so the mock and the React-side
 * contract stay perfectly in sync. Components/hooks import from this module;
 * fixtures stay private to the service layer.
 */

import type {
  Account,
  AccountType,
  ActivityEvent,
  ActivityEventType,
  BankCard,
  Beneficiary,
  BudgetEnvelope,
  Currency,
  Holding,
  Payment,
  SavingsGoal,
  StatementSample,
  StatementYearGroup,
  LoanRecord,
  Transaction,
} from "./banking.fixtures";

export type {
  Account,
  AccountType,
  ActivityEvent,
  ActivityEventType,
  BankCard,
  Beneficiary,
  BudgetEnvelope,
  Currency,
  Holding,
  Payment,
  SavingsGoal,
  StatementSample,
  StatementYearGroup,
  LoanRecord,
  Transaction,
};

export interface TransferInput {
  fromAccountId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  reference?: string;
  /** Press-and-hold dwell (ms) — feeds the Aegis behavioral channel later. */
  dwellMs?: number;
}

export interface TransferResult {
  transactionId: string;
  scheduledFor: string;
  signature: string;
}

export interface TransactionQuery {
  accountId?: string;
  limit?: number;
}

export interface StatementQuery {
  year: number;
  month: number;
}

export interface BankingService {
  listAccounts(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Account>>;
  getAccount(id: string, opts?: { signal?: AbortSignal }): Promise<Account>;
  listTransactions(
    query: TransactionQuery,
    opts?: { signal?: AbortSignal },
  ): Promise<ReadonlyArray<Transaction>>;
  listBeneficiaries(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Beneficiary>>;
  listCards(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<BankCard>>;
  listPayments(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Payment>>;
  listSavingsGoals(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<SavingsGoal>>;
  listHoldings(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Holding>>;
  listLoans(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<LoanRecord>>;
  listCurrencies(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Currency>>;
  listInsights(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Insight>>;
  listStatementYears(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<StatementYearGroup>>;
  getStatement(query: StatementQuery, opts?: { signal?: AbortSignal }): Promise<StatementSample>;
  listActivity(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ActivityEvent>>;
  listBudgets(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<BudgetEnvelope>>;
  initiateTransfer(input: TransferInput, opts?: { signal?: AbortSignal }): Promise<TransferResult>;
}

export type InsightTone = "down" | "up" | "calendar" | "shield" | "saving" | "growth";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  action: string;
}
