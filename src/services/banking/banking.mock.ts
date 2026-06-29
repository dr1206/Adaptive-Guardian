import { NotFoundError, ValidationError } from "../../lib/platform/errors";
import { mockReject, mockResolve } from "../_transport/mock";
import type {
  Account,
  BankingService,
  Beneficiary,
  Card,
  Transaction,
  TransferInput,
  TransferResult,
} from "./banking.contract";

const ACCOUNTS: ReadonlyArray<Account> = [
  {
    id: "acc_main",
    name: "Everyday",
    kind: "current",
    currency: "EUR",
    balance: 12_840.55,
    available: 12_720.12,
    iban: "DE89 3704 0044 0532 0130 00",
    trendDelta: 0.024,
  },
  {
    id: "acc_savings",
    name: "Safekeeping",
    kind: "savings",
    currency: "EUR",
    balance: 48_210.0,
    available: 48_210.0,
    iban: "DE89 3704 0044 0532 0130 11",
    trendDelta: 0.018,
  },
  {
    id: "acc_invest",
    name: "Investments",
    kind: "investment",
    currency: "USD",
    balance: 132_980.74,
    available: 96_400.0,
    iban: "DE89 3704 0044 0532 0130 22",
    trendDelta: 0.061,
  },
];

const BENEFICIARIES: ReadonlyArray<Beneficiary> = [
  { id: "ben_001", name: "Helena Vogt", iban: "DE12 1001 0010 0987 6543 21", bank: "N26" },
  { id: "ben_002", name: "Studio Veil", iban: "GB29 NWBK 6016 1331 9268 19", bank: "Monzo" },
  { id: "ben_003", name: "TaxOffice EU", iban: "FR14 2004 1010 0505 0001 3M02 606", bank: "BNP" },
];

const CARDS: ReadonlyArray<Card> = [
  { id: "crd_metal", accountId: "acc_main", network: "visa", last4: "4881", expiry: "11/29", state: "active" },
  { id: "crd_virtual", accountId: "acc_main", network: "mastercard", last4: "0220", expiry: "07/27", state: "active" },
  { id: "crd_travel", accountId: "acc_invest", network: "amex", last4: "1003", expiry: "02/28", state: "frozen" },
];

function makeTransactions(): ReadonlyArray<Transaction> {
  const categories = ["Groceries", "Salary", "Transport", "Subscriptions", "Dining", "Transfer"];
  const counterparties = ["Lidl", "Acme Payroll", "BVG", "Spotify", "Café Kranzler", "Helena Vogt"];
  const out: Transaction[] = [];
  for (let i = 0; i < 40; i++) {
    const isIncome = i % 11 === 0;
    out.push({
      id: `txn_${i.toString().padStart(4, "0")}`,
      accountId: ACCOUNTS[i % ACCOUNTS.length].id,
      occurredAt: new Date(Date.now() - i * 1000 * 60 * 60 * 7).toISOString(),
      amount: isIncome ? 2400 + i * 11 : -(8 + ((i * 17) % 220)),
      currency: "EUR",
      counterparty: counterparties[i % counterparties.length],
      category: categories[i % categories.length],
      status: i % 13 === 0 ? "pending" : "settled",
    });
  }
  return out;
}

const TRANSACTIONS = makeTransactions();

export const mockBankingService: BankingService = {
  async listAccounts({ signal } = {}) {
    return mockResolve(ACCOUNTS, { signal });
  },
  async getAccount(id, { signal } = {}) {
    const found = ACCOUNTS.find((a) => a.id === id);
    if (!found) return mockReject(new NotFoundError("banking.account.not_found"), { signal });
    return mockResolve(found, { signal });
  },
  async listTransactions(query, { signal } = {}) {
    const filtered = query.accountId
      ? TRANSACTIONS.filter((t) => t.accountId === query.accountId)
      : TRANSACTIONS;
    return mockResolve(filtered.slice(0, query.limit ?? 25), { signal });
  },
  async listBeneficiaries({ signal } = {}) {
    return mockResolve(BENEFICIARIES, { signal });
  },
  async listCards({ signal } = {}) {
    return mockResolve(CARDS, { signal });
  },
  async initiateTransfer(input: TransferInput, { signal } = {}) {
    if (input.amount <= 0) {
      return mockReject(new ValidationError("Amount must be greater than zero.", { field: "amount" }), {
        signal,
      });
    }
    const acc = ACCOUNTS.find((a) => a.id === input.fromAccountId);
    if (!acc) return mockReject(new NotFoundError("banking.account.not_found"), { signal });
    if (input.amount > acc.available) {
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
