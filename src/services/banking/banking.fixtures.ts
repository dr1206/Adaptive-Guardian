// Mock banking data for AdaptiveGuard demo — Indian banking context.
export type AccountType = "primary" | "savings" | "investment" | "credit" | "business" | "fixed";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  pending?: number;
  iban: string;
  accountNumber?: string;
  deltaPct: number;
  spark: number[];
  status: "active" | "frozen";
};

export const ACCOUNTS: Account[] = [
  {
    id: "primary",
    name: "Salary Account",
    type: "primary",
    currency: "INR",
    balance: 84250.75,
    pending: 1200,
    iban: "IN03 0002 1234 5678 9012 3456",
    deltaPct: 2.3,
    spark: [62, 64, 60, 66, 70, 68, 72, 74, 76, 80, 78, 82, 86, 88, 92, 90, 94, 98],
    status: "active",
  },
  {
    id: "savings",
    name: "Savings Account",
    type: "savings",
    currency: "INR",
    balance: 145000.0,
    iban: "IN03 0002 1234 5678 9012 3457",
    deltaPct: 0.12,
    spark: [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 60, 61, 62, 62, 62, 62, 62],
    status: "active",
  },
  {
    id: "savings-fd",
    name: "Fixed Deposit",
    type: "fixed",
    currency: "INR",
    balance: 500000.0,
    iban: "IN03 0002 1234 5678 9012 3458",
    deltaPct: 0.0,
    spark: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    status: "active",
  },
  {
    id: "investment",
    name: "Investment Account",
    type: "investment",
    currency: "INR",
    balance: 280000.0,
    iban: "IN03 0002 1234 5678 9012 3459",
    deltaPct: 1.84,
    spark: [50, 52, 48, 54, 60, 58, 64, 62, 68, 72, 70, 76, 78, 82, 80, 84, 90, 96],
    status: "active",
  },
  {
    id: "credit",
    name: "Credit Card",
    type: "credit",
    currency: "INR",
    balance: -12450.0,
    iban: "IN03 0002 1234 5678 9012 3460",
    deltaPct: -0.4,
    spark: [80, 78, 76, 70, 64, 60, 56, 52, 48, 44, 42, 40, 38, 36, 34, 32, 30, 28],
    status: "active",
  },
  {
    id: "business",
    name: "Current Account",
    type: "business",
    currency: "INR",
    balance: 320000.0,
    iban: "IN03 0002 1234 5678 9012 3461",
    deltaPct: 0.31,
    spark: [60, 62, 58, 64, 66, 64, 68, 70, 72, 74, 72, 76, 78, 80, 82, 84, 86, 88],
    status: "active",
  },
];

export type BankCard = {
  id: string;
  label: string;
  kind: "primary" | "virtual" | "credit" | "travel";
  network: "visa" | "mastercard" | "rupay";
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
    label: "RuPay Platinum",
    kind: "primary",
    network: "rupay",
    last4: "4912",
    holder: "AMAL KAREEM",
    exp: "08/29",
    frozen: false,
    finish: "obsidian",
    limits: {
      daily: 50000,
      monthly: 300000,
      atm: 25000,
      usedDaily: 4500,
      usedMonthly: 28400,
      usedAtm: 3000,
    },
    spentMonth: 28400,
  },
  {
    id: "c-2",
    label: "Virtual UPI",
    kind: "virtual",
    network: "rupay",
    last4: "3340",
    holder: "AMAL KAREEM",
    exp: "12/27",
    frozen: false,
    finish: "iris",
    limits: { daily: 15000, monthly: 100000, atm: 0, usedDaily: 0, usedMonthly: 8200, usedAtm: 0 },
    spentMonth: 8200,
  },
  {
    id: "c-3",
    label: "Visa Signature Credit",
    kind: "credit",
    network: "visa",
    last4: "8721",
    holder: "AMAL KAREEM",
    exp: "03/28",
    frozen: false,
    finish: "graphite",
    limits: {
      daily: 100000,
      monthly: 500000,
      atm: 50000,
      usedDaily: 0,
      usedMonthly: 12450,
      usedAtm: 0,
    },
    spentMonth: 12450,
  },
  {
    id: "c-4",
    label: "Travel Card",
    kind: "travel",
    network: "mastercard",
    last4: "6645",
    holder: "AMAL KAREEM",
    exp: "06/28",
    frozen: true,
    finish: "champagne",
    limits: { daily: 75000, monthly: 200000, atm: 30000, usedDaily: 0, usedMonthly: 0, usedAtm: 0 },
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
  isVerified?: boolean;
  coolingUntil?: string;
  initials: string;
  tint: number;
};

export const BENEFICIARIES: Beneficiary[] = [
  {
    id: "b1",
    name: "Rahul Sharma",
    bank: "HDFC Bank",
    iban: "IN03 0002 1234 5678 9012 1001",
    last4: "1001",
    lastSent: { amount: 5000, date: "25 Jun" },
    category: "Family",
    favorite: true,
    initials: "RS",
    tint: 215,
  },
  {
    id: "b2",
    name: "Priya Patel",
    bank: "ICICI Bank",
    iban: "IN03 0002 1234 5678 9012 1002",
    last4: "1002",
    lastSent: { amount: 2500, date: "20 Jun" },
    category: "Family",
    initials: "PP",
    tint: 295,
  },
  {
    id: "b3",
    name: "BSES Electricity",
    bank: "HDFC Bank",
    iban: "IN03 0002 1234 5678 9012 1003",
    last4: "1003",
    lastSent: { amount: 1840, date: "15 Jun" },
    category: "Utilities",
    initials: "BE",
    tint: 75,
  },
  {
    id: "b4",
    name: "Airtel Mobile",
    bank: "Axis Bank",
    iban: "IN03 0002 1234 5678 9012 1004",
    last4: "1004",
    lastSent: { amount: 699, date: "10 Jun" },
    category: "Utilities",
    initials: "AM",
    tint: 26,
  },
  {
    id: "b5",
    name: "Tech Solutions Pvt Ltd",
    bank: "HDFC Bank",
    iban: "IN03 0002 1234 5678 9012 1005",
    last4: "1005",
    lastSent: { amount: 45000, date: "5 Jun" },
    category: "Business",
    favorite: true,
    initials: "TS",
    tint: 258,
  },
  {
    id: "b6",
    name: "Ananya Krishnan",
    bank: "SBI",
    iban: "IN03 0002 1234 5678 9012 1006",
    last4: "1006",
    lastSent: { amount: 2000, date: "28 May" },
    category: "Family",
    initials: "AK",
    tint: 165,
  },
  {
    id: "b7",
    name: "LIC Mutual Fund",
    bank: "SBI",
    iban: "IN03 0002 1234 5678 9012 1007",
    last4: "1007",
    category: "Savings",
    initials: "LM",
    tint: 215,
  },
  {
    id: "b8",
    name: "Vijay Constructions",
    bank: "ICICI Bank",
    iban: "IN03 0002 1234 5678 9012 1008",
    last4: "1008",
    lastSent: { amount: 15000, date: "1 Jun" },
    category: "Business",
    initials: "VC",
    tint: 295,
  },
  {
    id: "b9",
    name: "Neha Gupta",
    bank: "Kotak Mahindra",
    iban: "IN03 0002 1234 5678 9012 1009",
    last4: "1009",
    lastSent: { amount: 3500, date: "12 Jun" },
    category: "Recent",
    initials: "NG",
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
    merchant: "Swiggy",
    category: "Food",
    amount: -486.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "SWG-9F3K-AAB2",
    account: "primary",
    confidence: 99.4,
  },
  {
    id: "t2",
    date: today,
    time: "10:11",
    merchant: "Uber India",
    category: "Transport",
    amount: -345.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "UBR-44128",
    account: "primary",
    confidence: 99.2,
  },
  {
    id: "t3",
    date: today,
    time: "09:00",
    merchant: "Salary Credit",
    category: "Income",
    amount: 85000.0,
    currency: "₹",
    method: "NEFT",
    status: "settled",
    ref: "SAL-2026-06",
    account: "primary",
    confidence: 99.6,
  },
  {
    id: "t4",
    date: y,
    time: "20:42",
    merchant: "Spotify India",
    category: "Entertainment",
    amount: -119.0,
    currency: "₹",
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
    merchant: "Flipkart",
    category: "Shopping",
    amount: -1849.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Online",
    ref: "FLP-22118",
    account: "primary",
    confidence: 98.9,
  },
  {
    id: "t6",
    date: y,
    time: "13:31",
    merchant: "Zomato",
    category: "Food",
    amount: -672.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "ZMT-9981",
    account: "primary",
    confidence: 99.3,
  },
  {
    id: "t7",
    date: d2,
    time: "22:01",
    merchant: "Ola Cabs",
    category: "Transport",
    amount: -298.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "OLA-66721",
    account: "primary",
    confidence: 99.0,
  },
  {
    id: "t8",
    date: d2,
    time: "12:00",
    merchant: "Rahul Sharma",
    category: "Transfer",
    amount: -5000.0,
    currency: "₹",
    method: "IMPS",
    status: "settled",
    ref: "TRF-22198",
    account: "primary",
    confidence: 99.5,
  },
  {
    id: "t9",
    date: d2,
    time: "09:14",
    merchant: "Cafe Coffee Day",
    category: "Food",
    amount: -350.0,
    currency: "₹",
    method: "UPI",
    status: "settled",
    location: "Mumbai, IN",
    ref: "CCD-44912",
    account: "primary",
    confidence: 99.1,
  },
  {
    id: "t10",
    date: d3,
    time: "19:48",
    merchant: "Amazon Prime",
    category: "Entertainment",
    amount: -1499.0,
    currency: "₹",
    method: "MC ••3340",
    status: "settled",
    ref: "APR-0006",
    account: "primary",
    confidence: 99.0,
  },
  {
    id: "t11",
    date: d3,
    time: "16:22",
    merchant: "MakeMyTrip",
    category: "Travel",
    amount: -12480.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    ref: "MMT-LHR-JFK",
    account: "primary",
    confidence: 99.4,
  },
  {
    id: "t12",
    date: d3,
    time: "08:30",
    merchant: "Electricity Bill",
    category: "Bills",
    amount: -1840.0,
    currency: "₹",
    method: "Auto debit",
    status: "settled",
    ref: "EBILL-06",
    account: "primary",
    confidence: 99.3,
  },
  {
    id: "t13",
    date: "2026-06-24",
    time: "11:11",
    merchant: "Apollo Pharmacy",
    category: "Health",
    amount: -540.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "APL-1144",
    account: "primary",
    confidence: 99.2,
  },
  {
    id: "t14",
    date: "2026-06-23",
    time: "14:02",
    merchant: "Reliance Trends",
    category: "Shopping",
    amount: -3240.0,
    currency: "₹",
    method: "Visa ••8721",
    status: "settled",
    location: "Phoenix Mall, Mumbai",
    ref: "RT-3300",
    account: "credit",
    confidence: 98.8,
  },
  {
    id: "t15",
    date: "2026-06-22",
    time: "07:18",
    merchant: "Freelance Payment",
    category: "Income",
    amount: 15000.0,
    currency: "₹",
    method: "NEFT",
    status: "settled",
    ref: "FRN-002241",
    account: "primary",
    confidence: 99.6,
  },
  {
    id: "t16",
    date: "2026-06-21",
    time: "15:30",
    merchant: "DMart Grocery",
    category: "Shopping",
    amount: -2890.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "DMT-8812",
    account: "primary",
    confidence: 99.3,
  },
  {
    id: "t17",
    date: "2026-06-20",
    time: "09:45",
    merchant: "Mobile Recharge",
    category: "Bills",
    amount: -699.0,
    currency: "₹",
    method: "UPI",
    status: "settled",
    ref: "MRC-8822",
    account: "primary",
    confidence: 99.5,
  },
  {
    id: "t18",
    date: "2026-06-19",
    time: "21:15",
    merchant: "PVR Cinemas",
    category: "Entertainment",
    amount: -480.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "Mumbai, IN",
    ref: "PVR-4419",
    account: "primary",
    confidence: 99.1,
  },
  {
    id: "t19",
    date: "2026-06-18",
    time: "11:00",
    merchant: "ATM Withdrawal",
    category: "Bills",
    amount: -5000.0,
    currency: "₹",
    method: "RuPay ••4912",
    status: "settled",
    location: "SBI ATM, Andheri",
    ref: "ATM-6612",
    account: "primary",
    confidence: 99.4,
  },
  {
    id: "t20",
    date: "2026-06-17",
    time: "14:00",
    merchant: "Amazon India",
    category: "Shopping",
    amount: -12999.0,
    currency: "₹",
    method: "Visa ••8721",
    status: "settled",
    location: "Online",
    ref: "AMZ-7721",
    account: "credit",
    confidence: 99.2,
  },
];

export type BudgetEnvelope = {
  id: string;
  name: string;
  spent: number;
  budget: number;
  color: string;
  category?: string;
  budgeted?: number;
  currency?: string;
};

export const BUDGET_ENVELOPES: BudgetEnvelope[] = [
  { id: "bg1", name: "Food", spent: 4200, budget: 8000, color: "oklch(0.71 0.155 165)" },
  { id: "bg2", name: "Transport", spent: 1800, budget: 3000, color: "oklch(0.7 0.13 250)" },
  { id: "bg3", name: "Shopping", spent: 6500, budget: 10000, color: "oklch(0.72 0.14 30)" },
  { id: "bg4", name: "Bills", spent: 3200, budget: 5000, color: "oklch(0.7 0.12 90)" },
  { id: "bg5", name: "Entertainment", spent: 2100, budget: 4000, color: "oklch(0.7 0.15 300)" },
];

export type Payment = {
  id: string;
  name: string;
  description?: string;
  category: string;
  nextDate: string;
  amount: number;
  status: "auto" | "manual" | "paused" | "active";
  currency?: string;
  beneficiary?: string;
  frequency?: string;
};

export const PAYMENTS: Payment[] = [
  {
    id: "p1",
    name: "Rent · Rahul Sharma",
    category: "Housing",
    nextDate: "2026-07-01",
    amount: 18000,
    status: "auto",
  },
  {
    id: "p2",
    name: "Amazon Prime",
    category: "Entertainment",
    nextDate: "2026-07-04",
    amount: 1499,
    status: "auto",
  },
  {
    id: "p3",
    name: "Spotify Family",
    category: "Entertainment",
    nextDate: "2026-07-06",
    amount: 179,
    status: "auto",
  },
  {
    id: "p4",
    name: "Electricity Bill",
    category: "Bills",
    nextDate: "2026-07-08",
    amount: 1840,
    status: "auto",
  },
  {
    id: "p5",
    name: "Airtel Mobile",
    category: "Bills",
    nextDate: "2026-07-10",
    amount: 699,
    status: "auto",
  },
  {
    id: "p6",
    name: "Gym · Cult.fit",
    category: "Health",
    nextDate: "2026-07-15",
    amount: 1499,
    status: "auto",
  },
  {
    id: "p7",
    name: "iCloud+ 2TB",
    category: "Subscriptions",
    nextDate: "2026-07-18",
    amount: 749,
    status: "auto",
  },
  {
    id: "p8",
    name: "Car Insurance",
    category: "Insurance",
    nextDate: "2026-07-22",
    amount: 8400,
    status: "manual",
  },
  {
    id: "p9",
    name: "Home Loan EMI",
    category: "Loans",
    nextDate: "2026-07-25",
    amount: 28500,
    status: "auto",
  },
];

export type SavingsGoal = {
  id: string;
  name: string;
  icon: string;
  category: "Travel" | "Emergency" | "Car" | "Education" | "Home" | "Retirement" | string;
  saved: number;
  current?: number;
  target: number;
  monthly: number;
  eta: string;
  currency?: string;
  deadline?: string;
  image?: string | null;
};

export const GOALS: SavingsGoal[] = [
  {
    id: "g1",
    name: "Goa Trip",
    icon: "✈",
    category: "Travel",
    saved: 15000,
    target: 50000,
    monthly: 5000,
    eta: "12 Sep 2026",
  },
  {
    id: "g2",
    name: "Emergency Fund",
    icon: "🛟",
    category: "Emergency",
    saved: 45000,
    target: 100000,
    monthly: 8000,
    eta: "04 Jan 2027",
  },
  {
    id: "g3",
    name: "New Scooter",
    icon: "🛵",
    category: "Car",
    saved: 28000,
    target: 120000,
    monthly: 10000,
    eta: "Oct 2027",
  },
  {
    id: "g4",
    name: "Home Down Payment",
    icon: "🏠",
    category: "Home",
    saved: 200000,
    target: 1000000,
    monthly: 50000,
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
    symbol: "NIFTY",
    name: "Nippon India ETF Nifty 50",
    units: 120,
    avg: 192.4,
    price: 218.5,
    dayPct: 0.42,
    value: 26220,
    weightPct: 24,
  },
  {
    symbol: "SBI",
    name: "SBI Bluechip Fund",
    units: 80,
    avg: 45.0,
    price: 52.6,
    dayPct: 0.28,
    value: 4208,
    weightPct: 4.8,
  },
  {
    symbol: "HDFC",
    name: "HDFC Mid-Cap Opportunities",
    units: 200,
    avg: 84.0,
    price: 112.1,
    dayPct: 0.55,
    value: 22420,
    weightPct: 20.2,
  },
  {
    symbol: "GOLD",
    name: "SBI Gold ETF",
    units: 50,
    avg: 5400,
    price: 6100,
    dayPct: 0.18,
    value: 305000,
    weightPct: 34.8,
  },
  {
    symbol: "PPF",
    name: "PPF Account",
    units: 1,
    avg: 120000,
    price: 120000,
    dayPct: 0,
    value: 120000,
    weightPct: 13.7,
  },
  {
    symbol: "CASH",
    name: "Money Market",
    units: 24800,
    avg: 1,
    price: 1,
    dayPct: 0,
    value: 24800,
    weightPct: 2.8,
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
    name: "Home Loan · SBI",
    principal: 3500000,
    remaining: 2850000,
    ratePct: 8.5,
    nextDate: "2026-07-25",
    nextAmount: 28500,
    paidPct: 18.6,
  },
  {
    id: "l2",
    name: "Education Loan · HDFC",
    principal: 800000,
    remaining: 420000,
    ratePct: 10.2,
    nextDate: "2026-07-12",
    nextAmount: 9200,
    paidPct: 47.5,
  },
];

export type Currency = { code: string; flag: string; rate: number };
export const CURRENCIES: Currency[] = [
  { code: "INR", flag: "🇮🇳", rate: 1 },
  { code: "USD", flag: "🇺🇸", rate: 0.012 },
  { code: "EUR", flag: "🇪🇺", rate: 0.011 },
  { code: "GBP", flag: "🇬🇧", rate: 0.0095 },
  { code: "JPY", flag: "🇯🇵", rate: 1.88 },
  { code: "AED", flag: "🇦🇪", rate: 0.044 },
  { code: "SAR", flag: "🇸🇦", rate: 0.045 },
  { code: "SGD", flag: "🇸🇬", rate: 0.016 },
];

export const INSIGHTS = [
  {
    id: "i1",
    tone: "down" as const,
    title: "Food delivery down 18%",
    body: "You spent ₹4,200 vs ₹5,100 last month. Top reduction: weekday lunches.",
    action: "See transactions",
  },
  {
    id: "i2",
    tone: "up" as const,
    title: "Subscription price increased",
    body: "Amazon Prime went from ₹999 to ₹1,499 on 4 Jun.",
    action: "Review",
  },
  {
    id: "i3",
    tone: "calendar" as const,
    title: "Rent is due Wednesday",
    body: "₹18,000 to Rahul Sharma, scheduled. No action needed.",
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
    title: "Goa trip goal ahead of schedule",
    body: "At current pace you'll reach your target 18 days early.",
    action: "Adjust",
  },
  {
    id: "i6",
    tone: "growth" as const,
    title: "Portfolio up 1.84% today",
    body: "Gains led by NIFTY and Gold ETF. Equity weight now 42%.",
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
  iban: "IN03 0002 1234 5678 9012 3456",
  openingBalance: "₹ 63,481.74",
  inflows: "₹ 1,42,300.00",
  outflows: "₹ 91,184.32",
  closingBalance: "₹ 1,14,597.42",
  net: "₹ 51,115.68",
  transactions: 48,
  selected: [
    { date: "28 Jun", name: "Swiggy · Food", amount: "− ₹486.00" },
    { date: "27 Jun", name: "Flipkart · Shopping", amount: "− ₹1,849.00" },
    { date: "26 Jun", name: "Rahul Sharma · Rent", amount: "− ₹5,000.00" },
    { date: "22 Jun", name: "Freelance Payment", amount: "+ ₹15,000.00" },
    { date: "01 Jun", name: "Salary Credit", amount: "+ ₹85,000.00" },
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
    sub: "Confidence 99.4% · MacBook Pro · Mumbai",
  },
  {
    id: "e2",
    ts: "2026-06-28 13:02",
    type: "tx",
    title: "Swiggy · ₹486.00",
    sub: "RuPay ••4912 · Food",
  },
  {
    id: "e3",
    ts: "2026-06-28 09:00",
    type: "tx",
    title: "Salary credit · ₹85,000",
    sub: "NEFT",
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
    title: "Sent ₹5,000 to Rahul Sharma",
    sub: "Verified · 1.1s hold",
  },
  {
    id: "e6",
    ts: "2026-06-25 16:22",
    type: "tx",
    title: "MakeMyTrip · ₹12,480",
    sub: "RuPay ••4912 · Travel",
  },
];
