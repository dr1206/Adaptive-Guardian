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
  dwellMs?: number;
  idempotencyKey?: string;
  behavioralFeatures?: Record<string, number>;
  otpCode?: string;
  challengeId?: string;
}

export interface TransferResult {
  transactionId: string;
  scheduledFor: string;
  signature?: string;
  status?: string;
  riskScore?: number;
  riskDecision?: string;
  challengeId?: string;
  message?: string;
}

export interface TransactionQuery {
  accountId?: string;
  limit?: number;
}

export interface StatementQuery {
  year: number;
  month: number;
}

export interface ExchangeInput {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  fromAccountId?: string;
}

export interface ExchangeResult {
  transactionId: string;
  exchangeId?: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  executedAt: string;
}

export interface DisputeInput {
  transactionId: string;
  reason: string;
  explanation?: string;
}

export interface DisputeResult {
  id: string;
  transactionId: string;
  reason: string;
  explanation?: string;
  status: string;
  createdAt?: string;
}

export interface BankingService {
  listAccounts(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Account>>;
  getAccount(id: string, opts?: { signal?: AbortSignal }): Promise<Account>;
  listTransactions(
    query: TransactionQuery,
    opts?: { signal?: AbortSignal },
  ): Promise<ReadonlyArray<Transaction>>;
  listBeneficiaries(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Beneficiary>>;
  addBeneficiary(
    beneficiary: { name: string; iban: string; bank: string; category?: string; currency?: string },
    opts?: { signal?: AbortSignal },
  ): Promise<Beneficiary>;
  deleteBeneficiary(beneficiaryId: string, opts?: { signal?: AbortSignal }): Promise<void>;
  verifyBeneficiary(beneficiaryId: string, opts?: { signal?: AbortSignal }): Promise<Beneficiary>;

  listCards(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<BankCard>>;
  freezeCard(cardId: string, opts?: { signal?: AbortSignal }): Promise<BankCard>;
  unfreezeCard(cardId: string, opts?: { signal?: AbortSignal }): Promise<BankCard>;
  updateCardLimits(
    cardId: string,
    limits: { daily?: number; monthly?: number; atm?: number },
    opts?: { signal?: AbortSignal },
  ): Promise<BankCard>;
  changeCardPin(cardId: string, pin: string, opts?: { signal?: AbortSignal }): Promise<{ status: string; message: string }>;

  listPayments(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Payment>>;
  createPayment(
    payment: { description: string; amount: number; currency: string; nextDate: string; frequency: string; beneficiary: string },
    opts?: { signal?: AbortSignal },
  ): Promise<Payment>;
  deletePayment(paymentId: string, opts?: { signal?: AbortSignal }): Promise<void>;
  pausePayment(paymentId: string, opts?: { signal?: AbortSignal }): Promise<Payment>;
  resumePayment(paymentId: string, opts?: { signal?: AbortSignal }): Promise<Payment>;

  listSavingsGoals(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<SavingsGoal>>;
  createSavingsGoal(
    goal: { name: string; target: number; currency: string; deadline: string; image?: string; category?: string; monthly?: number },
    opts?: { signal?: AbortSignal },
  ): Promise<SavingsGoal>;
  contributeSavingsGoal(goalId: string, amount: number, accountId?: string, opts?: { signal?: AbortSignal }): Promise<SavingsGoal>;
  withdrawSavingsGoal(goalId: string, amount: number, accountId?: string, opts?: { signal?: AbortSignal }): Promise<SavingsGoal>;
  deleteSavingsGoal(goalId: string, opts?: { signal?: AbortSignal }): Promise<void>;

  listHoldings(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Holding>>;
  listLoans(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<LoanRecord>>;
  listCurrencies(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Currency>>;
  executeExchange(input: ExchangeInput, opts?: { signal?: AbortSignal }): Promise<ExchangeResult>;

  listInsights(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Insight>>;
  listStatementYears(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<StatementYearGroup>>;
  getStatement(query: StatementQuery, opts?: { signal?: AbortSignal }): Promise<StatementSample>;
  exportStatement(year: number, month: number, opts?: { signal?: AbortSignal }): Promise<Blob>;
  exportStatementCsv(year: number, month: number, opts?: { signal?: AbortSignal }): Promise<Blob>;

  listActivity(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ActivityEvent>>;
  listBudgets(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<BudgetEnvelope>>;
  createBudget(
    budget: { category: string; budgeted: number; currency: string; color?: string },
    opts?: { signal?: AbortSignal },
  ): Promise<BudgetEnvelope>;
  deleteBudget(budgetId: string, opts?: { signal?: AbortSignal }): Promise<void>;

  createDispute(input: DisputeInput, opts?: { signal?: AbortSignal }): Promise<DisputeResult>;
  listDisputes(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<DisputeResult>>;

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
