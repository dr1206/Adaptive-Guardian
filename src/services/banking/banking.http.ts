/**
 * Banking HTTP adapter — calls the real backend and maps responses to the
 * frontend BankingService contract shape.
 */

import { httpRequest } from "../_transport/http";
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

// ---------------------------------------------------------------------------
// Backend wire shapes (camelCase from serialization_alias)
// ---------------------------------------------------------------------------

interface BackendAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  pending: number;
  iban: string;
  deltaPct: number;
  spark: number[];
  status: string;
}

interface BackendTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  category: string | null;
  beneficiary: string | null;
  reference: string | null;
}

interface BackendBeneficiary {
  id: string;
  name: string;
  iban: string;
  bank: string;
  currency: string;
  lastUsed: string | null;
}

interface BackendCard {
  id: string;
  label: string;
  kind: string;
  network: string;
  last4: string;
  holder: string;
  exp: string;
  frozen: boolean;
  finish: string;
  limits: {
    daily: number;
    monthly: number;
    atm: number;
    usedDaily: number;
    usedMonthly: number;
    usedAtm: number;
  };
  spentMonth: number;
}

interface BackendPayment {
  id: string;
  description: string;
  amount: number;
  currency: string;
  nextDate: string;
  frequency: string;
  beneficiary: string;
}

interface BackendSavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  currency: string;
  deadline: string;
  image: string | null;
}

interface BackendHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  deltaPct: number;
}

interface BackendLoan {
  id: string;
  name: string;
  principal: number;
  remaining: number;
  currency: string;
  rate: number;
  nextPayment: string;
}

interface BackendCurrency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

interface BackendInsight {
  id: string;
  tone: string;
  title: string;
  body: string;
  action: string;
}

interface BackendStatementYear {
  year: number;
  months: number[];
}

interface BackendStatementSample {
  month: number;
  year: number;
  openingBalance: number;
  closingBalance: number;
  transactions: BackendTransaction[];
}

interface BackendActivityEvent {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
}

interface BackendBudget {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  currency: string;
  color: string | null;
}

interface BackendTransferResult {
  transactionId: string;
  scheduledFor: string;
  signature?: string;
  status?: string;
  riskScore?: number;
  riskDecision?: string;
  challengeId?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapAccount(a: BackendAccount): Account {
  return {
    id: a.id,
    name: a.name,
    type: a.type as Account["type"],
    currency: a.currency,
    balance: a.balance,
    pending: a.pending,
    iban: a.iban,
    deltaPct: a.deltaPct,
    spark: a.spark,
    status: a.status as Account["status"],
  };
}

function mapTransaction(t: BackendTransaction): Transaction {
  return {
    id: t.id,
    date: t.date,
    time: "",
    merchant: t.beneficiary ?? t.description,
    category: (t.category ?? mapTxTypeToCategory(t.type)) as Transaction["category"],
    amount: t.type === "debit" ? -Math.abs(t.amount) : Math.abs(t.amount),
    currency: t.currency,
    method: "",
    status: (t.status === "completed" ? "settled" : "pending") as Transaction["status"],
    ref: t.reference ?? "",
    account: "",
    confidence: 99.0,
  };
}

function mapTxTypeToCategory(type: string): string {
  switch (type) {
    case "credit":
      return "Income";
    case "debit":
      return "Shopping";
    default:
      return "Transfer";
  }
}

function mapBeneficiary(b: BackendBeneficiary): Beneficiary {
  const last4Digits = b.iban.replace(/\s/g, "").slice(-4);
  return {
    id: b.id,
    name: b.name,
    bank: b.bank,
    iban: b.iban,
    last4: last4Digits,
    lastSent: b.lastUsed ? { amount: 0, date: b.lastUsed } : undefined,
    category: deriveBeneficiaryCategory(b.name),
    initials: b.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    tint: hashStrToTint(b.name),
  };
}

function deriveBeneficiaryCategory(_name: string): Beneficiary["category"] {
  return "Recent";
}

function hashStrToTint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h & 0xff) + ((h >> 8) & 0xff) * 0.4;
}

function mapCard(c: BackendCard): BankCard {
  return {
    id: c.id,
    label: c.label,
    kind: c.kind as BankCard["kind"],
    network: c.network as BankCard["network"],
    last4: c.last4,
    holder: c.holder,
    exp: c.exp,
    frozen: c.frozen,
    finish: c.finish as BankCard["finish"],
    limits: c.limits,
    spentMonth: c.spentMonth,
  };
}

function mapPayment(p: BackendPayment): Payment {
  return {
    id: p.id,
    name: p.beneficiary ? `${p.description} · ${p.beneficiary}` : p.description,
    category: derivePaymentCategory(p.description),
    nextDate: p.nextDate,
    amount: p.amount * -1,
    status: mapPaymentStatus(p.frequency) as Payment["status"],
  };
}

function derivePaymentCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("rent")) return "Housing";
  if (d.includes("netflix") || d.includes("spotify") || d.includes("icloud"))
    return "Entertainment";
  if (d.includes("electric") || d.includes("mobile") || d.includes("vodafone") || d.includes("edp"))
    return "Bills";
  if (d.includes("gym") || d.includes("insurance")) return "Health";
  if (d.includes("loan") || d.includes("emi")) return "Loans";
  return "Subscriptions";
}

function mapPaymentStatus(freq: string): string {
  return freq === "monthly" ? "auto" : "manual";
}

function mapSavingsGoal(g: BackendSavingsGoal): SavingsGoal {
  const remaining = g.target - g.current;
  const monthlyRate = remaining > 0 ? Math.round(remaining / 12) : 0;
  const etaDate =
    monthlyRate > 0
      ? (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + Math.ceil(remaining / monthlyRate));
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        })()
      : "Completed";
  return {
    id: g.id,
    name: g.name,
    icon: mapGoalImage(g.image ?? g.name),
    category: deriveGoalCategory(g.name) as SavingsGoal["category"],
    saved: g.current,
    target: g.target,
    monthly: monthlyRate,
    eta: etaDate,
  };
}

function mapGoalImage(img: string): string {
  const icons: Record<string, string> = {
    beach: "✈",
    car: "🚗",
    home: "🏠",
    education: "🎓",
    emergency: "🛟",
    health: "❤",
    vacation: "✈",
  };
  return icons[img.toLowerCase()] ?? (img.length <= 3 ? img : "💰");
}

function deriveGoalCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("vacation") || n.includes("trip") || n.includes("tokyo")) return "Travel";
  if (n.includes("emergency")) return "Emergency";
  if (n.includes("car") || n.includes("ev")) return "Car";
  if (n.includes("education") || n.includes("tuition")) return "Education";
  if (n.includes("apartment") || n.includes("home") || n.includes("deposit") || n.includes("house"))
    return "Home";
  return "Retirement";
}

function mapHolding(h: BackendHolding): Holding {
  return {
    symbol: h.symbol,
    name: h.name,
    units: h.quantity,
    avg: Math.round(h.price * 0.9 * 100) / 100,
    price: h.price,
    dayPct: h.deltaPct,
    value: Math.round(h.quantity * h.price * 100) / 100,
    weightPct: 10,
  };
}

function mapLoan(l: BackendLoan): LoanRecord {
  const paidPct =
    l.principal > 0 ? Math.round(((l.principal - l.remaining) / l.principal) * 100) : 0;
  return {
    id: l.id,
    name: l.name,
    principal: l.principal,
    remaining: l.remaining,
    ratePct: l.rate,
    nextDate: l.nextPayment,
    nextAmount:
      Math.round(((l.remaining * (l.rate / 100)) / 12) * 100) / 100 +
      Math.round((l.remaining / 36) * 100) / 100,
    paidPct,
  };
}

function mapStatementYear(by: BackendStatementYear): StatementYearGroup {
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const months = by.months.map((m) => ({
    year: by.year,
    month: m,
    label: monthLabels[m - 1] ?? String(m),
  }));
  return {
    year: by.year,
    count: months.length,
    months,
  };
}

function mapActivity(e: BackendActivityEvent): ActivityEvent {
  return {
    id: e.id,
    ts: e.occurredAt,
    type: (e.type === "login"
      ? "auth"
      : e.type === "transfer"
        ? "transfer"
        : e.type === "card_frozen"
          ? "card"
          : "tx") as ActivityEvent["type"],
    title: e.description.split(" ").slice(0, 3).join(" "),
    sub: e.description,
  };
}

function mapBudget(b: BackendBudget): BudgetEnvelope {
  return {
    id: b.id,
    name: b.category,
    spent: b.spent,
    budget: b.budgeted,
    color: b.color ?? "oklch(0.71 0.155 165)",
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const httpBankingService: BankingService = {
  async listAccounts({ signal } = {}) {
    const accounts = await httpRequest<BackendAccount[]>("/accounts", { signal });
    return accounts.map(mapAccount);
  },

  async getAccount(id: string, { signal } = {}) {
    const a = await httpRequest<BackendAccount>(`/accounts/${id}`, { signal });
    return mapAccount(a);
  },

  async listTransactions(query: TransactionQuery, { signal } = {}) {
    const txns = await httpRequest<BackendTransaction[]>("/transactions", {
      params: {
        accountId: query.accountId,
        limit: query.limit,
      },
      signal,
    });
    return txns.map(mapTransaction);
  },

  async listBeneficiaries({ signal } = {}) {
    const beneficiaries = await httpRequest<BackendBeneficiary[]>("/beneficiaries", { signal });
    return beneficiaries.map(mapBeneficiary);
  },

  async listCards({ signal } = {}) {
    const cards = await httpRequest<BackendCard[]>("/cards", { signal });
    return cards.map(mapCard);
  },

  async listPayments({ signal } = {}) {
    const payments = await httpRequest<BackendPayment[]>("/payments", { signal });
    return payments.map(mapPayment);
  },

  async listSavingsGoals({ signal } = {}) {
    const goals = await httpRequest<BackendSavingsGoal[]>("/savings-goals", { signal });
    return goals.map(mapSavingsGoal);
  },

  async listHoldings({ signal } = {}) {
    const holdings = await httpRequest<BackendHolding[]>("/holdings", { signal });
    return holdings.map(mapHolding);
  },

  async listLoans({ signal } = {}) {
    const loans = await httpRequest<BackendLoan[]>("/loans", { signal });
    return loans.map(mapLoan);
  },

  async listCurrencies({ signal } = {}) {
    return httpRequest<Currency[]>("/currencies", { signal });
  },

  async listInsights({ signal } = {}) {
    return httpRequest<Insight[]>("/insights", { signal });
  },

  async listStatementYears({ signal } = {}) {
    const years = await httpRequest<BackendStatementYear[]>("/statements/years", { signal });
    return years.map(mapStatementYear);
  },

  async getStatement(query: StatementQuery, { signal } = {}) {
    const sample = await httpRequest<BackendStatementSample>(
      `/statements/${query.year}/${query.month}`,
      { signal },
    );
    const txns = sample.transactions.map(mapTransaction);
    const credits = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const debits = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = credits - debits;
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
    return {
      year: sample.year,
      month: sample.month,
      accountHolder: "",
      iban: "",
      openingBalance: fmt(sample.openingBalance),
      inflows: fmt(credits),
      outflows: fmt(debits),
      closingBalance: fmt(sample.closingBalance),
      net: fmt(net),
      transactions: txns.length,
      selected: txns.slice(0, 60).map((t) => ({
        id: t.id,
        date: t.date,
        name: t.merchant,
        amount: (t.amount >= 0 ? "+ " : "− ") + fmt(Math.abs(t.amount)),
      })),
    };
  },

  async listActivity({ signal } = {}) {
    const events = await httpRequest<BackendActivityEvent[]>("/activity", { signal });
    return events.map(mapActivity);
  },

  async listBudgets({ signal } = {}) {
    const budgets = await httpRequest<BackendBudget[]>("/budgets", { signal });
    return budgets.map(mapBudget);
  },

  async addBeneficiary(b, { signal } = {}) {
    const res = await httpRequest<BackendBeneficiary>("/beneficiaries", {
      method: "POST",
      body: b,
      signal,
    });
    return mapBeneficiary(res);
  },

  async deleteBeneficiary(id, { signal } = {}) {
    await httpRequest<void>(`/beneficiaries/${id}`, {
      method: "DELETE",
      signal,
    });
  },

  async verifyBeneficiary(id, { signal } = {}) {
    const res = await httpRequest<BackendBeneficiary>(`/beneficiaries/${id}/verify`, {
      method: "POST",
      signal,
    });
    return mapBeneficiary(res);
  },

  async freezeCard(cardId, { signal } = {}) {
    const card = await httpRequest<BackendCard>(`/cards/${cardId}/freeze`, {
      method: "PATCH",
      signal,
    });
    return mapCard(card);
  },

  async unfreezeCard(cardId, { signal } = {}) {
    const card = await httpRequest<BackendCard>(`/cards/${cardId}/unfreeze`, {
      method: "PATCH",
      signal,
    });
    return mapCard(card);
  },

  async updateCardLimits(cardId, limits, { signal } = {}) {
    const card = await httpRequest<BackendCard>(`/cards/${cardId}/limits`, {
      method: "PATCH",
      body: limits,
      signal,
    });
    return mapCard(card);
  },

  async changeCardPin(cardId, pin, { signal } = {}) {
    return httpRequest<{ status: string; message: string }>(`/cards/${cardId}/pin`, {
      method: "POST",
      body: { pin },
      signal,
    });
  },

  async createPayment(payment, { signal } = {}) {
    const res = await httpRequest<BackendPayment>("/payments", {
      method: "POST",
      body: payment,
      signal,
    });
    return mapPayment(res);
  },

  async deletePayment(id, { signal } = {}) {
    await httpRequest<void>(`/payments/${id}`, {
      method: "DELETE",
      signal,
    });
  },

  async pausePayment(id, { signal } = {}) {
    const res = await httpRequest<BackendPayment>(`/payments/${id}/pause`, {
      method: "PATCH",
      signal,
    });
    return mapPayment(res);
  },

  async resumePayment(id, { signal } = {}) {
    const res = await httpRequest<BackendPayment>(`/payments/${id}/resume`, {
      method: "PATCH",
      signal,
    });
    return mapPayment(res);
  },

  async createSavingsGoal(goal, { signal } = {}) {
    const res = await httpRequest<BackendSavingsGoal>("/savings-goals", {
      method: "POST",
      body: goal,
      signal,
    });
    return mapSavingsGoal(res);
  },

  async contributeSavingsGoal(goalId, amount, accountId, { signal } = {}) {
    const res = await httpRequest<BackendSavingsGoal>(`/savings-goals/${goalId}/contribute`, {
      method: "POST",
      body: { amount, accountId },
      signal,
    });
    return mapSavingsGoal(res);
  },

  async withdrawSavingsGoal(goalId, amount, accountId, { signal } = {}) {
    const res = await httpRequest<BackendSavingsGoal>(`/savings-goals/${goalId}/withdraw`, {
      method: "POST",
      body: { amount, accountId },
      signal,
    });
    return mapSavingsGoal(res);
  },

  async deleteSavingsGoal(id, { signal } = {}) {
    await httpRequest<void>(`/savings-goals/${id}`, {
      method: "DELETE",
      signal,
    });
  },

  async executeExchange(input, { signal } = {}) {
    return httpRequest<any>("/exchange/execute", {
      method: "POST",
      body: input,
      signal,
    });
  },

  async exportStatement(year, month, { signal } = {}) {
    const res = await fetch(`/api/v1/statements/${year}/${month}/export`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      signal,
    });
    if (!res.ok) {
      throw new Error(`Failed to export statement (${res.status})`);
    }
    return res.blob();
  },

  async exportStatementCsv(year, month, { signal } = {}) {
    return this.exportStatement(year, month, { signal });
  },

  async createBudget(budget, { signal } = {}) {
    const res = await httpRequest<BackendBudget>("/budgets", {
      method: "POST",
      body: budget,
      signal,
    });
    return mapBudget(res);
  },

  async deleteBudget(id, { signal } = {}) {
    await httpRequest<void>(`/budgets/${id}`, {
      method: "DELETE",
      signal,
    });
  },

  async createDispute(input, { signal } = {}) {
    return httpRequest<any>("/disputes", {
      method: "POST",
      body: input,
      signal,
    });
  },

  async listDisputes({ signal } = {}) {
    return httpRequest<any[]>("/disputes", { signal });
  },

  async initiateTransfer(input: TransferInput, { signal } = {}) {
    const result = await httpRequest<BackendTransferResult>("/transfers", {
      method: "POST",
      body: {
        fromAccountId: input.fromAccountId,
        beneficiaryId: input.beneficiaryId,
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        idempotencyKey: input.idempotencyKey,
        behavioralFeatures: input.behavioralFeatures,
        otpCode: input.otpCode,
        challengeId: input.challengeId,
      },
      signal,
    });
    return {
      transactionId: result.transactionId,
      scheduledFor: result.scheduledFor,
      signature: result.signature,
      status: result.status,
      riskScore: result.riskScore,
      riskDecision: result.riskDecision,
      challengeId: result.challengeId,
      message: result.message,
    };
  },
};
