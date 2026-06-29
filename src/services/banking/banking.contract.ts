/**
 * Banking domain contract — read-only models plus a transfer command.
 * Aligns with `src/lib/banking-data.ts` shapes so existing UI keeps rendering.
 */

export interface Account {
  id: string;
  name: string;
  kind: "current" | "savings" | "investment" | "credit";
  currency: "EUR" | "USD" | "GBP";
  balance: number;
  available: number;
  iban: string;
  trendDelta: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  occurredAt: string;
  amount: number;
  currency: Account["currency"];
  counterparty: string;
  category: string;
  status: "settled" | "pending" | "failed";
  note?: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  iban: string;
  bank: string;
  lastSentAt?: string;
}

export interface Card {
  id: string;
  accountId: string;
  network: "visa" | "mastercard" | "amex";
  last4: string;
  expiry: string;
  state: "active" | "frozen" | "shipping";
}

export interface TransferInput {
  fromAccountId: string;
  beneficiaryId: string;
  amount: number;
  currency: Account["currency"];
  reference?: string;
  /** Press-and-hold dwell (ms) — feeds the Aegis behavioral channel later. */
  dwellMs?: number;
}

export interface TransferResult {
  transactionId: string;
  scheduledFor: string;
  signature: string;
}

export interface BankingService {
  listAccounts(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Account>>;
  getAccount(id: string, opts?: { signal?: AbortSignal }): Promise<Account>;
  listTransactions(
    query: { accountId?: string; limit?: number },
    opts?: { signal?: AbortSignal },
  ): Promise<ReadonlyArray<Transaction>>;
  listBeneficiaries(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Beneficiary>>;
  listCards(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Card>>;
  initiateTransfer(input: TransferInput, opts?: { signal?: AbortSignal }): Promise<TransferResult>;
}
