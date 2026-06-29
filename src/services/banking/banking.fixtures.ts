// Mock banking data for AdaptiveGuard demo.
export type AccountType = "primary" | "savings" | "investment" | "credit" | "business" | "fixed";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  pending?: number;
  iban: string;
  deltaPct: number;
  spark: number[];
  status: "active" | "frozen";
};

export const ACCOUNTS: Account[] = [
  {
    id: "primary",
    name: "Primary",
    type: "primary",
    currency: "EUR",
    balance: 248902.14,
    pending: 1820,
    iban: "PT50 0033 0000 4523 9876 3491 5",
    deltaPct: 0.57,
    spark: [62, 64, 60, 66, 70, 68, 72, 74, 76, 80, 78, 82, 86, 88, 92, 90, 94, 98],
    status: "active",
  },
  {
    id: "savings",
    name: "Future Fund",
    type: "savings",
    currency: "EUR",
    balance: 62400.0,
    iban: "PT50 0033 0000 4523 1112 0008 1",
    deltaPct: 0.12,
    spark: [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 60, 61, 62, 62, 62, 62, 62],
    status: "active",
  },
  {
    id: "savings-tokyo",
    name: "Tokyo 2026",
    type: "savings",
    currency: "EUR",
    balance: 3100.0,
    iban: "PT50 0033 0000 4523 2244 0009 2",
    deltaPct: 1.2,
    spark: [10, 12, 14, 18, 22, 28, 34, 42, 48, 55, 60, 64, 68, 72, 78, 84, 88, 92],
    status: "active",
  },
  {
    id: "investment",
    name: "Portfolio",
    type: "investment",
    currency: "EUR",
    balance: 2480000.0,
    iban: "PT50 0033 0000 4523 8821 4400 3",
    deltaPct: 1.84,
    spark: [50, 52, 48, 54, 60, 58, 64, 62, 68, 72, 70, 76, 78, 82, 80, 84, 90, 96],
    status: "active",
  },
  {
    id: "credit",
    name: "Credit Line",
    type: "credit",
    currency: "EUR",
    balance: -2840.5,
    iban: "PT50 0033 0000 4523 9981 1122 4",
    deltaPct: -0.4,
    spark: [80, 78, 76, 70, 64, 60, 56, 52, 48, 44, 42, 40, 38, 36, 34, 32, 30, 28],
    status: "active",
  },
  {
    id: "business",
    name: "AdaptiveLab OÜ",
    type: "business",
    currency: "EUR",
    balance: 184320.0,
    iban: "EE38 2200 2210 2014 5685 0006",
    deltaPct: 0.31,
    spark: [60, 62, 58, 64, 66, 64, 68, 70, 72, 74, 72, 76, 78, 80, 82, 84, 86, 88],
    status: "active",
  },
  {
    id: "fixed-12",
    name: "12-Month Deposit",
    type: "fixed",
    currency: "EUR",
    balance: 50000.0,
    iban: "PT50 0033 0000 4523 5511 8800 0",
    deltaPct: 0.0,
    spark: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    status: "active",
  },
];

export type BankCard = {
  id: string;
  label: string;
  kind: "primary" | "virtual" | "credit" | "travel";
  network: "visa" | "mastercard";
  last4: string;
  holder: string;
  exp: string;
  frozen: boolean;
  finish: "obsidian" | "champagne" | "iris" | "graphite" | "platinum";
  limits: {
    daily: number;
    monthly: number;
    atm: number;
    usedDaily: number;
    usedMonthly: number;
    usedAtm: number;
  };
  spentMonth: number;
};

export const CARDS: BankCard[] = [
  {
    id: "c-1",
    label: "Primary",
    kind: "primary",
    network: "visa",
    last4: "4912",
    holder: "AMAL KAREEM",
    exp: "08/29",
    frozen: false,
    finish: "obsidian",
    limits: {
      daily: 2000,
      monthly: 18000,
      atm: 400,
      usedDaily: 184,
      usedMonthly: 1284,
      usedAtm: 120,
    },
    spentMonth: 1284,
  },
  {
    id: "c-2",
    label: "Virtual · Online",
    kind: "virtual",
    network: "mastercard",
    last4: "3340",
    holder: "AMAL KAREEM",
    exp: "12/27",
    frozen: false,
    finish: "iris",
    limits: { daily: 500, monthly: 4000, atm: 0, usedDaily: 0, usedMonthly: 312, usedAtm: 0 },
    spentMonth: 312,
  },
  {
    id: "c-3",
    label: "Credit",
    kind: "credit",
    network: "visa",
    last4: "8721",
    holder: "AMAL KAREEM",
    exp: "03/28",
    frozen: false,
    finish: "graphite",
    limits: { daily: 5000, monthly: 25000, atm: 1000, usedDaily: 0, usedMonthly: 2840, usedAtm: 0 },
    spentMonth: 2840,
  },
  {
    id: "c-4",
    label: "Travel · JPY",
    kind: "travel",
    network: "mastercard",
    last4: "6645",
    holder: "AMAL KAREEM",
    exp: "06/28",
    frozen: true,
    finish: "champagne",
    limits: { daily: 1500, monthly: 8000, atm: 600, usedDaily: 0, usedMonthly: 0, usedAtm: 0 },
    spentMonth: 0,
  },
];

export type Beneficiary = {
  id: string;
  name: string;
  bank: string;
  iban: string;
  last4: string;
  lastSent?: { amount: number; date: string };
  category: "Family" | "Business" | "Utilities" | "Savings" | "Recent";
  favorite?: boolean;
  initials: string;
  tint: number;
};

export const BENEFICIARIES: Beneficiary[] = [
  {
    id: "b1",
    name: "Marta Silva",
    bank: "BPI",
    iban: "PT50 0010 0000 2238 8821 5",
    last4: "8821",
    lastSent: { amount: 1250, date: "23 Jun" },
    category: "Family",
    favorite: true,
    initials: "MS",
    tint: 215,
  },
  {
    id: "b2",
    name: "Akira Tanaka",
    bank: "MUFG",
    iban: "JP00 0006 5471 1290 4421 1",
    last4: "4421",
    lastSent: { amount: 480, date: "18 Jun" },
    category: "Family",
    initials: "AT",
    tint: 295,
  },
  {
    id: "b3",
    name: "EDP Comercial",
    bank: "BCP",
    iban: "PT50 0033 0000 9901 2244 1",
    last4: "2244",
    lastSent: { amount: 84.5, date: "10 Jun" },
    category: "Utilities",
    initials: "ED",
    tint: 75,
  },
  {
    id: "b4",
    name: "Vodafone Portugal",
    bank: "Santander",
    iban: "PT50 0018 0001 0033 1144 9",
    last4: "1144",
    lastSent: { amount: 39.9, date: "5 Jun" },
    category: "Utilities",
    initials: "VD",
    tint: 26,
  },
  {
    id: "b5",
    name: "Helios Studio Ltd",
    bank: "Revolut",
    iban: "GB00 REVO 0099 7710 4421 8",
    last4: "4421",
    lastSent: { amount: 6200, date: "1 Jun" },
    category: "Business",
    favorite: true,
    initials: "HS",
    tint: 258,
  },
  {
    id: "b6",
    name: "Layla Hassan",
    bank: "ENBD",
    iban: "AE00 0260 0011 4488 3300 2",
    last4: "3300",
    lastSent: { amount: 320, date: "29 May" },
    category: "Family",
    initials: "LH",
    tint: 165,
  },
  {
    id: "b7",
    name: "Aurora Capital",
    bank: "BBVA",
    iban: "ES00 0182 0000 3344 7788 0",
    last4: "7788",
    category: "Savings",
    initials: "AC",
    tint: 215,
  },
  {
    id: "b8",
    name: "Banco Atlântico",
    bank: "Atlântico",
    iban: "PT50 0089 0000 7711 0044 5",
    last4: "0044",
    lastSent: { amount: 6400, date: "1 Jun" },
    category: "Business",
    initials: "BA",
    tint: 295,
  },
  {
    id: "b9",
    name: "Helena Costa",
    bank: "Caixa",
    iban: "PT50 0035 0000 8821 6655 4",
    last4: "6655",
    lastSent: { amount: 220, date: "12 Jun" },
    category: "Recent",
    initials: "HC",
    tint: 165,
  },
];

export type Transaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  time: string;
  merchant: string;
  category:
    | "Food"
    | "Transport"
    | "Shopping"
    | "Bills"
    | "Income"
    | "Transfer"
    | "Travel"
    | "Entertainment"
    | "Health";
  amount: number; // negative = outflow
  currency: string;
  method: string;
  status: "settled" | "pending";
  location?: string;
  ref: string;
  account: string;
  confidence: number;
};

const today = "2026-06-28";
const y = "2026-06-27";
const d2 = "2026-06-26";
const d3 = "2026-06-25";

export const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    date: today,
    time: "13:02",
    merchant: "Wolt",
    category: "Food",
    amount: -18.4,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    location: "Lisbon, PT",
    ref: "WLT-9F3K-AAB2",
    account: "primary",
    confidence: 99.4,
  },
  {
    id: "t2",
    date: today,
    time: "10:11",
    merchant: "EasyPark",
    category: "Transport",
    amount: -4.5,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    location: "Lisbon, PT",
    ref: "EP-44128",
    account: "primary",
    confidence: 99.2,
  },
  {
    id: "t3",
    date: today,
    time: "09:00",
    merchant: "Banco Atlântico",
    category: "Income",
    amount: 6400,
    currency: "€",
    method: "SEPA",
    status: "settled",
    ref: "SAL-2026-06",
    account: "primary",
    confidence: 99.6,
  },
  {
    id: "t4",
    date: y,
    time: "20:42",
    merchant: "Spotify",
    category: "Entertainment",
    amount: -10.99,
    currency: "€",
    method: "MC ••3340",
    status: "settled",
    ref: "SPT-7791",
    account: "primary",
    confidence: 99.1,
  },
  {
    id: "t5",
    date: y,
    time: "18:14",
    merchant: "FNAC",
    category: "Shopping",
    amount: -84.0,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    location: "Colombo, Lisbon",
    ref: "FN-22118",
    account: "primary",
    confidence: 98.9,
  },
  {
    id: "t6",
    date: y,
    time: "13:31",
    merchant: "Time Out Market",
    category: "Food",
    amount: -22.5,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    location: "Lisbon, PT",
    ref: "TOM-9981",
    account: "primary",
    confidence: 99.3,
  },
  {
    id: "t7",
    date: d2,
    time: "22:01",
    merchant: "Uber",
    category: "Transport",
    amount: -8.2,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    location: "Lisbon, PT",
    ref: "UBR-66721",
    account: "primary",
    confidence: 99.0,
  },
  {
    id: "t8",
    date: d2,
    time: "12:00",
    merchant: "Marta Silva",
    category: "Transfer",
    amount: -1250,
    currency: "€",
    method: "SEPA Instant",
    status: "settled",
    ref: "TRF-22198",
    account: "primary",
    confidence: 99.5,
  },
  {
    id: "t9",
    date: d2,
    time: "09:14",
    merchant: "Blue Bottle Coffee",
    category: "Food",
    amount: -4.8,
    currency: "€",
    method: "MC ••3340",
    status: "settled",
    location: "Lisbon, PT",
    ref: "BBC-44912",
    account: "primary",
    confidence: 99.1,
  },
  {
    id: "t10",
    date: d3,
    time: "19:48",
    merchant: "Netflix",
    category: "Entertainment",
    amount: -17.99,
    currency: "€",
    method: "MC ••3340",
    status: "settled",
    ref: "NFX-0006",
    account: "primary",
    confidence: 99.0,
  },
  {
    id: "t11",
    date: d3,
    time: "16:22",
    merchant: "British Airways",
    category: "Travel",
    amount: -1284.0,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    ref: "BA-LHR-JFK",
    account: "primary",
    confidence: 99.4,
  },
  {
    id: "t12",
    date: d3,
    time: "08:30",
    merchant: "Octopus Energy",
    category: "Bills",
    amount: -142.0,
    currency: "€",
    method: "Direct debit",
    status: "settled",
    ref: "OCT-DD-06",
    account: "primary",
    confidence: 99.3,
  },
  {
    id: "t13",
    date: "2026-06-24",
    time: "11:11",
    merchant: "Pharmácia Sant'Ana",
    category: "Health",
    amount: -27.4,
    currency: "€",
    method: "Visa ••4912",
    status: "settled",
    location: "Lisbon, PT",
    ref: "PSA-1144",
    account: "primary",
    confidence: 99.2,
  },
  {
    id: "t14",
    date: "2026-06-23",
    time: "14:02",
    merchant: "Goldsmiths",
    category: "Shopping",
    amount: -612.5,
    currency: "€",
    method: "Visa ••8721",
    status: "settled",
    location: "Bond Street, London",
    ref: "GS-3300",
    account: "credit",
    confidence: 98.8,
  },
  {
    id: "t15",
    date: "2026-06-22",
    time: "07:18",
    merchant: "Inbound · A. Mehta",
    category: "Income",
    amount: 2400,
    currency: "€",
    method: "SEPA",
    status: "settled",
    ref: "INB-002241",
    account: "primary",
    confidence: 99.6,
  },
];

export type Payment = {
  id: string;
  name: string;
  category: string;
  nextDate: string;
  amount: number;
  status: "auto" | "manual" | "paused";
};

export const PAYMENTS: Payment[] = [
  {
    id: "p1",
    name: "Rent · Marta Silva",
    category: "Housing",
    nextDate: "2026-07-01",
    amount: 1250,
    status: "auto",
  },
  {
    id: "p2",
    name: "Netflix",
    category: "Entertainment",
    nextDate: "2026-07-04",
    amount: 17.99,
    status: "auto",
  },
  {
    id: "p3",
    name: "Spotify Family",
    category: "Entertainment",
    nextDate: "2026-07-06",
    amount: 17.99,
    status: "auto",
  },
  {
    id: "p4",
    name: "EDP Electricity",
    category: "Bills",
    nextDate: "2026-07-08",
    amount: 84.5,
    status: "auto",
  },
  {
    id: "p5",
    name: "Vodafone Mobile",
    category: "Bills",
    nextDate: "2026-07-10",
    amount: 39.9,
    status: "auto",
  },
  {
    id: "p6",
    name: "Gym · Holmes Place",
    category: "Health",
    nextDate: "2026-07-15",
    amount: 79,
    status: "auto",
  },
  {
    id: "p7",
    name: "iCloud+ 2TB",
    category: "Subscriptions",
    nextDate: "2026-07-18",
    amount: 9.99,
    status: "auto",
  },
  {
    id: "p8",
    name: "Car Insurance",
    category: "Insurance",
    nextDate: "2026-07-22",
    amount: 64,
    status: "manual",
  },
  {
    id: "p9",
    name: "Home loan EMI",
    category: "Loans",
    nextDate: "2026-07-25",
    amount: 1840,
    status: "auto",
  },
];

export type SavingsGoal = {
  id: string;
  name: string;
  icon: string;
  category: "Travel" | "Emergency" | "Car" | "Education" | "Home" | "Retirement";
  saved: number;
  target: number;
  monthly: number;
  eta: string;
};

export const GOALS: SavingsGoal[] = [
  {
    id: "g1",
    name: "Lisbon → Tokyo",
    icon: "✈",
    category: "Travel",
    saved: 3100,
    target: 5000,
    monthly: 420,
    eta: "12 Sep 2026",
  },
  {
    id: "g2",
    name: "Emergency",
    icon: "🛟",
    category: "Emergency",
    saved: 18400,
    target: 24000,
    monthly: 800,
    eta: "04 Jan 2027",
  },
  {
    id: "g3",
    name: "New EV",
    icon: "🚗",
    category: "Car",
    saved: 9200,
    target: 38000,
    monthly: 1500,
    eta: "Oct 2027",
  },
  {
    id: "g4",
    name: "Apartment deposit",
    icon: "🏠",
    category: "Home",
    saved: 28400,
    target: 80000,
    monthly: 2400,
    eta: "Apr 2028",
  },
];

export type Holding = {
  symbol: string;
  name: string;
  units: number;
  avg: number;
  price: number;
  dayPct: number;
  value: number;
  weightPct: number;
};

export const HOLDINGS: Holding[] = [
  {
    symbol: "VWCE",
    name: "Vanguard FTSE All-World",
    units: 480,
    avg: 102.4,
    price: 124.18,
    dayPct: 0.42,
    value: 59606.4,
    weightPct: 24,
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500",
    units: 120,
    avg: 391.0,
    price: 482.6,
    dayPct: 0.61,
    value: 57912,
    weightPct: 23.3,
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ",
    units: 80,
    avg: 348,
    price: 442.1,
    dayPct: 1.12,
    value: 35368,
    weightPct: 14.2,
  },
  {
    symbol: "VBR",
    name: "Vanguard Small-Cap Value",
    units: 120,
    avg: 154,
    price: 168.4,
    dayPct: -0.21,
    value: 20208,
    weightPct: 8.1,
  },
  {
    symbol: "GLDM",
    name: "SPDR Gold MiniShares",
    units: 540,
    avg: 38.2,
    price: 44.1,
    dayPct: 0.18,
    value: 23814,
    weightPct: 9.6,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    units: 0.32,
    avg: 38000,
    price: 71200,
    dayPct: 2.4,
    value: 22784,
    weightPct: 9.2,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    units: 4.2,
    avg: 1900,
    price: 3680,
    dayPct: 1.8,
    value: 15456,
    weightPct: 6.2,
  },
  {
    symbol: "CASH",
    name: "Money market",
    units: 12852,
    avg: 1,
    price: 1,
    dayPct: 0,
    value: 12852,
    weightPct: 5.4,
  },
];

export type LoanRecord = {
  id: string;
  name: string;
  principal: number;
  remaining: number;
  ratePct: number;
  nextDate: string;
  nextAmount: number;
  paidPct: number;
};

export const LOANS: LoanRecord[] = [
  {
    id: "l1",
    name: "Home loan · Apt Lisbon",
    principal: 280000,
    remaining: 214800,
    ratePct: 3.4,
    nextDate: "2026-07-25",
    nextAmount: 1840,
    paidPct: 23,
  },
  {
    id: "l2",
    name: "Auto loan · Tesla M3",
    principal: 42000,
    remaining: 18200,
    ratePct: 4.2,
    nextDate: "2026-07-12",
    nextAmount: 720,
    paidPct: 57,
  },
];

export type Currency = { code: string; flag: string; rate: number };
export const CURRENCIES: Currency[] = [
  { code: "EUR", flag: "🇪🇺", rate: 1 },
  { code: "USD", flag: "🇺🇸", rate: 1.0781 },
  { code: "GBP", flag: "🇬🇧", rate: 0.8512 },
  { code: "JPY", flag: "🇯🇵", rate: 168.34 },
  { code: "CHF", flag: "🇨🇭", rate: 0.961 },
  { code: "BRL", flag: "🇧🇷", rate: 5.87 },
  { code: "INR", flag: "🇮🇳", rate: 89.42 },
  { code: "AED", flag: "🇦🇪", rate: 3.961 },
];

export const INSIGHTS = [
  {
    id: "i1",
    tone: "down" as const,
    title: "Dining down 18% this month",
    body: "You spent €212 vs €258 last month. Top reduction: weekday lunches.",
    action: "See transactions",
  },
  {
    id: "i2",
    tone: "up" as const,
    title: "A subscription increased",
    body: "Netflix went from €13.99 to €17.99 on 4 Jun.",
    action: "Review",
  },
  {
    id: "i3",
    tone: "calendar" as const,
    title: "Rent is due Wednesday",
    body: "€1,250 to Marta Silva, scheduled. No action needed.",
    action: "View",
  },
  {
    id: "i4",
    tone: "shield" as const,
    title: "Your behavior is stable",
    body: "30 days, 0 anomalies. Aegis confidence average 98.7%.",
    action: "Open Aegis",
  },
  {
    id: "i5",
    tone: "saving" as const,
    title: "Tokyo goal ahead of schedule",
    body: "At current pace you'll arrive 18 days early.",
    action: "Adjust",
  },
  {
    id: "i6",
    tone: "growth" as const,
    title: "Portfolio up 1.84% today",
    body: "Gains led by QQQ and BTC. Tech weight now 42%.",
    action: "Open portfolio",
  },
];

// ----------------------------------------------------------------------------
// Statements
// ----------------------------------------------------------------------------

export type StatementMonth = { year: number; month: number; label: string };
export type StatementYearGroup = {
  year: number;
  count: number;
  months: ReadonlyArray<StatementMonth>;
};

export type StatementLineItem = { date: string; name: string; amount: string };

export type StatementSample = {
  year: number;
  month: number;
  accountHolder: string;
  iban: string;
  openingBalance: string;
  inflows: string;
  outflows: string;
  closingBalance: string;
  net: string;
  transactions: number;
  selected: ReadonlyArray<StatementLineItem>;
};

const MONTH_LABELS = [
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
] as const;

function monthsFor(year: number): ReadonlyArray<StatementMonth> {
  return MONTH_LABELS.map((label, i) => ({ year, month: i, label }));
}

export const STATEMENT_YEARS: ReadonlyArray<StatementYearGroup> = [
  { year: 2026, count: 12, months: monthsFor(2026) },
  { year: 2025, count: 12, months: monthsFor(2025) },
  { year: 2024, count: 12, months: monthsFor(2024) },
];

export const STATEMENT_SAMPLE: StatementSample = {
  year: 2026,
  month: 5,
  accountHolder: "Amal Kareem",
  iban: "PT50 0033 0000 4523 9876 3491 5",
  openingBalance: "€ 243,481.74",
  inflows: "€ 14,230.00",
  outflows: "€ 9,184.32",
  closingBalance: "€ 248,527.42",
  net: "€ 5,045.68",
  transactions: 48,
  selected: [
    { date: "28 Jun", name: "Wolt · Food", amount: "− €18.40" },
    { date: "27 Jun", name: "FNAC · Shopping", amount: "− €84.00" },
    { date: "26 Jun", name: "Marta Silva · Rent", amount: "− €1,250.00" },
    { date: "22 Jun", name: "A. Mehta · Inbound", amount: "+ €2,400.00" },
    { date: "01 Jun", name: "Banco Atlântico · Salary", amount: "+ €6,400.00" },
  ],
};

// ----------------------------------------------------------------------------
// Activity timeline
// ----------------------------------------------------------------------------

export type ActivityEventType = "tx" | "auth" | "card" | "transfer" | "settings" | "invest";

export type ActivityEvent = {
  id: string;
  ts: string;
  type: ActivityEventType;
  title: string;
  sub: string;
};

export const ACTIVITY_EVENTS: ReadonlyArray<ActivityEvent> = [
  {
    id: "e1",
    ts: "2026-06-28 14:32",
    type: "auth",
    title: "Aegis re-verified",
    sub: "Confidence 99.4% · MacBook Pro · Lisbon",
  },
  {
    id: "e2",
    ts: "2026-06-28 13:02",
    type: "tx",
    title: "Wolt · €18.40",
    sub: "Visa ••4912 · Food",
  },
  {
    id: "e3",
    ts: "2026-06-28 09:00",
    type: "tx",
    title: "Salary inbound · €6,400",
    sub: "Banco Atlântico",
  },
  {
    id: "e4",
    ts: "2026-06-27 22:48",
    type: "card",
    title: "Travel card frozen",
    sub: "MC ••6645 · by you",
  },
  {
    id: "e5",
    ts: "2026-06-26 12:00",
    type: "transfer",
    title: "Sent €1,250 to Marta Silva",
    sub: "Verified · 1.1s hold",
  },
  {
    id: "e6",
    ts: "2026-06-25 16:22",
    type: "tx",
    title: "British Airways · €1,284",
    sub: "Visa ••4912 · Travel",
  },
  {
    id: "e7",
    ts: "2026-06-25 09:12",
    type: "settings",
    title: "International payments enabled",
    sub: "MC ••3340",
  },
  {
    id: "e8",
    ts: "2026-06-24 14:18",
    type: "auth",
    title: "New session",
    sub: "Lisbon · Safari 17",
  },
  {
    id: "e9",
    ts: "2026-06-23 11:00",
    type: "invest",
    title: "Bought VWCE × 5",
    sub: "@ €123.40 · €617.00",
  },
];

// ----------------------------------------------------------------------------
// Budget envelopes
// ----------------------------------------------------------------------------

export type BudgetEnvelope = {
  id: string;
  name: string;
  spent: number;
  budget: number;
  color: string;
};

export const BUDGET_ENVELOPES: ReadonlyArray<BudgetEnvelope> = [
  { id: "food", name: "Food", spent: 412, budget: 600, color: "oklch(0.71 0.155 165)" },
  { id: "transport", name: "Transport", spent: 184, budget: 250, color: "oklch(0.715 0.135 215)" },
  {
    id: "subscriptions",
    name: "Subscriptions",
    spent: 102,
    budget: 120,
    color: "oklch(0.635 0.215 295)",
  },
  { id: "shopping", name: "Shopping", spent: 612, budget: 500, color: "oklch(0.78 0.155 75)" },
  { id: "bills", name: "Bills", spent: 226, budget: 400, color: "oklch(0.655 0.195 258)" },
  { id: "health", name: "Health", spent: 27, budget: 200, color: "oklch(0.71 0.155 165)" },
  {
    id: "entertainment",
    name: "Entertainment",
    spent: 88,
    budget: 150,
    color: "oklch(0.635 0.215 295)",
  },
  { id: "travel", name: "Travel", spent: 1284, budget: 1500, color: "oklch(0.715 0.135 215)" },
];
