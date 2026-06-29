/**
 * Phase 4D — AI-SOC Cockpit mock data fixtures.
 * Deterministic seeding so charts / tables look "live" but stay stable across renders.
 *
 * Consumed by `admin.mock.ts` only — components reach this data through
 * React Query hooks in `src/services/hooks.ts`.
 */

import { seedSeries, type Signal } from "@/lib/admin-signal";

// Deterministic PRNG ----------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// KPIs ------------------------------------------------------------------------
export const kpis = [
  {
    id: "active",
    label: "Active users",
    value: 12847,
    suffix: "",
    delta: +4.2,
    signal: "ok" as Signal,
    series: seedSeries(11, 32, 0.3, 0.9),
  },
  {
    id: "sessions",
    label: "Online sessions",
    value: 3210,
    suffix: "",
    delta: +2.1,
    signal: "ok" as Signal,
    series: seedSeries(12, 32, 0.4, 0.9),
  },
  {
    id: "confidence",
    label: "Avg confidence",
    value: 98.6,
    suffix: "%",
    delta: -0.3,
    signal: "watch" as Signal,
    series: seedSeries(13, 32, 0.6, 1.0),
  },
  {
    id: "trust",
    label: "Trust score",
    value: 0.94,
    suffix: "",
    delta: +0.02,
    signal: "ok" as Signal,
    series: seedSeries(14, 32, 0.5, 1.0),
  },
  {
    id: "otp",
    label: "OTP challenges",
    value: 47,
    suffix: "",
    delta: -12,
    signal: "ok" as Signal,
    series: seedSeries(15, 32, 0.1, 0.6),
  },
  {
    id: "anom",
    label: "Detected anomalies",
    value: 3,
    suffix: "",
    delta: +1,
    signal: "alert" as Signal,
    series: seedSeries(16, 32, 0.05, 0.5),
  },
  {
    id: "model",
    label: "Model accuracy",
    value: 99.2,
    suffix: "%",
    delta: +0.1,
    signal: "ok" as Signal,
    series: seedSeries(17, 32, 0.7, 1.0),
  },
  {
    id: "system",
    label: "System health",
    value: 99.97,
    suffix: "%",
    delta: 0,
    signal: "ok" as Signal,
    series: seedSeries(18, 32, 0.8, 1.0),
  },
];

export const globalMetrics = [
  {
    id: "users",
    label: "Current users",
    value: "12,847",
    delta: "+4.2%",
    signal: "ok" as Signal,
    series: seedSeries(21),
  },
  {
    id: "tx",
    label: "Today's transactions",
    value: "84,201",
    delta: "+8.6%",
    signal: "ok" as Signal,
    series: seedSeries(22),
  },
  {
    id: "active",
    label: "Active sessions",
    value: "3,210",
    delta: "+2.1%",
    signal: "ok" as Signal,
    series: seedSeries(23),
  },
  {
    id: "devices",
    label: "Trusted devices",
    value: "28,914",
    delta: "+1.3%",
    signal: "ok" as Signal,
    series: seedSeries(24),
  },
  {
    id: "challenge",
    label: "Challenge rate",
    value: "1.46%",
    delta: "-0.3pp",
    signal: "ok" as Signal,
    series: seedSeries(25),
  },
  {
    id: "authsucc",
    label: "Authentication success",
    value: "99.6%",
    delta: "+0.1pp",
    signal: "ok" as Signal,
    series: seedSeries(26),
  },
  {
    id: "stab",
    label: "Behavior stability",
    value: "0.987",
    delta: "+0.004",
    signal: "ok" as Signal,
    series: seedSeries(27),
  },
  {
    id: "conf",
    label: "Average confidence",
    value: "98.6%",
    delta: "-0.3pp",
    signal: "watch" as Signal,
    series: seedSeries(28),
  },
  {
    id: "acc",
    label: "AI accuracy",
    value: "99.2%",
    delta: "+0.1pp",
    signal: "ok" as Signal,
    series: seedSeries(29),
  },
  {
    id: "fraud",
    label: "Fraud prevented",
    value: "$214k",
    delta: "+12%",
    signal: "ok" as Signal,
    series: seedSeries(30),
  },
];

// Live sessions ---------------------------------------------------------------
const firstNames = [
  "Aria",
  "Bashir",
  "Camille",
  "Diego",
  "Esme",
  "Farah",
  "Gus",
  "Hana",
  "Ilya",
  "June",
  "Kenji",
  "Lia",
  "Mateo",
  "Nora",
  "Omar",
  "Petra",
  "Quinn",
  "Rin",
  "Sana",
  "Tomás",
  "Uma",
  "Vince",
  "Wren",
  "Xiu",
  "Yuki",
  "Zain",
];
const lastNames = [
  "Reyes",
  "Khan",
  "Lopez",
  "Singh",
  "Müller",
  "Nakamura",
  "Park",
  "Eze",
  "Costa",
  "Halsey",
  "Vaziri",
  "Okafor",
  "Lindqvist",
  "Rashid",
  "Bauer",
  "Iqbal",
  "Sato",
  "Bianchi",
  "Volkov",
  "Berg",
];
const pages = [
  "/app",
  "/app/transfer",
  "/app/cards",
  "/app/exchange",
  "/app/investments",
  "/app/accounts",
  "/app/transactions",
  "/app/loans",
  "/app/payments",
];
const devices = [
  "MacBook Pro · Safari",
  "iPhone 15 · Safari",
  "ThinkPad · Chrome",
  "Pixel 8 · Chrome",
  "iPad · Safari",
  "Surface · Edge",
];
const activities = [
  "Browsing",
  "Typing amount",
  "Selecting beneficiary",
  "Hold-to-send",
  "Reviewing FX",
  "Reading statement",
  "Editing budget",
  "Idle",
];

export type LiveSession = {
  id: string;
  user: string;
  initials: string;
  device: string;
  page: string;
  confidence: number;
  risk: number;
  behavior: number;
  duration: string;
  activity: string;
  lastEvent: string;
  signal: Signal;
};

export const liveSessions: LiveSession[] = Array.from({ length: 24 }, (_, i) => {
  const rng = mulberry32(100 + i);
  const fn = firstNames[Math.floor(rng() * firstNames.length)];
  const ln = lastNames[Math.floor(rng() * lastNames.length)];
  const confidence = 0.7 + rng() * 0.3;
  const risk = rng() * (confidence < 0.85 ? 0.9 : 0.4);
  const minutes = Math.floor(rng() * 90) + 1;
  const lastSec = Math.floor(rng() * 60);
  const signal: Signal =
    risk > 0.7 ? "critical" : risk > 0.5 ? "alert" : confidence < 0.9 ? "watch" : "ok";
  return {
    id: `S-${(20480 + i).toString(16).toUpperCase()}`,
    user: `${fn} ${ln}`,
    initials: `${fn[0]}${ln[0]}`,
    device: devices[Math.floor(rng() * devices.length)],
    page: pages[Math.floor(rng() * pages.length)],
    confidence,
    risk,
    behavior: 0.6 + rng() * 0.4,
    duration: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
    activity: activities[Math.floor(rng() * activities.length)],
    lastEvent: lastSec < 10 ? "just now" : `${lastSec}s ago`,
    signal,
  };
});

// Users -----------------------------------------------------------------------
export type AdminUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  status: "active" | "locked" | "enrolling" | "dormant";
  tier: "Personal" | "Premium" | "Business" | "Enterprise";
  devices: number;
  trust: number;
  risk: number;
  lastSeen: string;
  country: string;
  signal: Signal;
};

const countries = [
  "US",
  "GB",
  "DE",
  "FR",
  "NG",
  "JP",
  "BR",
  "IN",
  "SG",
  "AE",
  "CA",
  "AU",
  "ES",
  "MX",
  "SE",
];
const tiers: AdminUser["tier"][] = ["Personal", "Premium", "Business", "Enterprise"];
const statuses: AdminUser["status"][] = [
  "active",
  "active",
  "active",
  "active",
  "enrolling",
  "locked",
  "dormant",
];

export const adminUsers: AdminUser[] = Array.from({ length: 48 }, (_, i) => {
  const rng = mulberry32(200 + i);
  const fn = firstNames[Math.floor(rng() * firstNames.length)];
  const ln = lastNames[Math.floor(rng() * lastNames.length)];
  const trust = 0.5 + rng() * 0.5;
  const risk = 1 - trust + (rng() - 0.5) * 0.2;
  const signal: Signal =
    risk > 0.6 ? "critical" : risk > 0.4 ? "alert" : risk > 0.25 ? "watch" : "ok";
  return {
    id: `U-${(40960 + i).toString(16).toUpperCase()}`,
    name: `${fn} ${ln}`,
    initials: `${fn[0]}${ln[0]}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${rng() > 0.5 ? "corp.example" : "mail.example"}`,
    status: statuses[Math.floor(rng() * statuses.length)],
    tier: tiers[Math.floor(rng() * tiers.length)],
    devices: Math.floor(rng() * 5) + 1,
    trust,
    risk: Math.max(0, Math.min(1, risk)),
    lastSeen: ["just now", "2m ago", "11m ago", "1h ago", "3h ago", "yesterday"][
      Math.floor(rng() * 6)
    ],
    country: countries[Math.floor(rng() * countries.length)],
    signal,
  };
});

// Incidents -------------------------------------------------------------------
export type Incident = {
  id: string;
  title: string;
  severity: Signal;
  user?: string;
  source: string;
  age: string;
  status: "open" | "ack" | "resolved";
};

export const incidents: Incident[] = [
  {
    id: "INC-2841",
    title: "Behavior drift exceeds 3σ in PROD region eu-west",
    severity: "critical",
    source: "Aegis · drift",
    age: "8m",
    status: "open",
  },
  {
    id: "INC-2840",
    title: "Surge of OTP challenges from device family Android-14",
    severity: "alert",
    source: "Challenge engine",
    age: "21m",
    status: "ack",
  },
  {
    id: "INC-2839",
    title: "Model v2.4.1 p99 latency above SLO (38ms > 30ms)",
    severity: "alert",
    source: "ML monitor",
    age: "34m",
    status: "open",
  },
  {
    id: "INC-2838",
    title: "Unfamiliar geo cluster: Lagos → Kyiv within 12 min",
    severity: "critical",
    user: "Camille Lopez",
    source: "Risk engine",
    age: "47m",
    status: "open",
  },
  {
    id: "INC-2837",
    title: "Dataset v17 coverage gap on feature mouse.curvature",
    severity: "watch",
    source: "Data quality",
    age: "1h 12m",
    status: "ack",
  },
  {
    id: "INC-2836",
    title: "Auth API error rate 0.42% (threshold 0.30%)",
    severity: "watch",
    source: "API gateway",
    age: "1h 40m",
    status: "open",
  },
  {
    id: "INC-2835",
    title: "Maintenance window completed: Redis cluster failover",
    severity: "ok",
    source: "Infra",
    age: "3h",
    status: "resolved",
  },
];

// Models ----------------------------------------------------------------------
export type ModelVersion = {
  version: string;
  status: "active" | "candidate" | "archived";
  trained: string;
  dataset: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  latencyMs: number;
  memoryMb: number;
};

export const models: ModelVersion[] = [
  {
    version: "v2.4.1",
    status: "active",
    trained: "2026-06-21",
    dataset: "ds-2026.06-A",
    accuracy: 0.992,
    precision: 0.988,
    recall: 0.985,
    f1: 0.986,
    latencyMs: 12,
    memoryMb: 184,
  },
  {
    version: "v2.4.2-rc",
    status: "candidate",
    trained: "2026-06-27",
    dataset: "ds-2026.06-B",
    accuracy: 0.994,
    precision: 0.991,
    recall: 0.987,
    f1: 0.989,
    latencyMs: 11,
    memoryMb: 188,
  },
  {
    version: "v2.4.0",
    status: "archived",
    trained: "2026-06-12",
    dataset: "ds-2026.05-D",
    accuracy: 0.989,
    precision: 0.985,
    recall: 0.981,
    f1: 0.983,
    latencyMs: 13,
    memoryMb: 181,
  },
  {
    version: "v2.3.5",
    status: "archived",
    trained: "2026-05-29",
    dataset: "ds-2026.05-A",
    accuracy: 0.984,
    precision: 0.98,
    recall: 0.976,
    f1: 0.978,
    latencyMs: 14,
    memoryMb: 176,
  },
];

// Datasets --------------------------------------------------------------------
export type Dataset = {
  id: string;
  version: string;
  samples: number;
  users: number;
  sessions: number;
  features: number;
  quality: number;
  duplicates: number;
  coverage: number;
  created: string;
  status: "production" | "staging" | "draft";
};

export const datasets: Dataset[] = [
  {
    id: "ds-2026.06-B",
    version: "17",
    samples: 14_280_421,
    users: 124_891,
    sessions: 2_481_204,
    features: 188,
    quality: 0.984,
    duplicates: 0.002,
    coverage: 0.987,
    created: "2026-06-27",
    status: "staging",
  },
  {
    id: "ds-2026.06-A",
    version: "16",
    samples: 12_104_882,
    users: 118_204,
    sessions: 2_180_119,
    features: 184,
    quality: 0.981,
    duplicates: 0.003,
    coverage: 0.982,
    created: "2026-06-21",
    status: "production",
  },
  {
    id: "ds-2026.05-D",
    version: "15",
    samples: 11_882_001,
    users: 116_001,
    sessions: 2_088_402,
    features: 182,
    quality: 0.978,
    duplicates: 0.004,
    coverage: 0.978,
    created: "2026-06-12",
    status: "production",
  },
  {
    id: "ds-2026.05-A",
    version: "14",
    samples: 10_204_881,
    users: 109_881,
    sessions: 1_889_001,
    features: 178,
    quality: 0.972,
    duplicates: 0.005,
    coverage: 0.974,
    created: "2026-05-29",
    status: "production",
  },
];

// Services / API --------------------------------------------------------------
export type Service = {
  name: string;
  status: Signal;
  latency: { p50: number; p95: number; p99: number };
  errorRate: number;
  uptime: number;
  series: number[];
};

export const services: Service[] = [
  {
    name: "Authentication API",
    status: "ok",
    latency: { p50: 22, p95: 84, p99: 142 },
    errorRate: 0.0011,
    uptime: 99.99,
    series: seedSeries(301),
  },
  {
    name: "ML Inference API",
    status: "watch",
    latency: { p50: 12, p95: 31, p99: 38 },
    errorRate: 0.0008,
    uptime: 99.96,
    series: seedSeries(302),
  },
  {
    name: "PostgreSQL · primary",
    status: "ok",
    latency: { p50: 3, p95: 11, p99: 22 },
    errorRate: 0.0,
    uptime: 99.999,
    series: seedSeries(303),
  },
  {
    name: "Redis · sessions",
    status: "ok",
    latency: { p50: 1, p95: 3, p99: 8 },
    errorRate: 0.0,
    uptime: 100,
    series: seedSeries(304),
  },
  {
    name: "Object storage",
    status: "ok",
    latency: { p50: 18, p95: 64, p99: 121 },
    errorRate: 0.0002,
    uptime: 99.98,
    series: seedSeries(305),
  },
  {
    name: "Notification bus",
    status: "ok",
    latency: { p50: 6, p95: 22, p99: 41 },
    errorRate: 0.0004,
    uptime: 99.97,
    series: seedSeries(306),
  },
  {
    name: "Email delivery",
    status: "watch",
    latency: { p50: 240, p95: 720, p99: 1180 },
    errorRate: 0.0042,
    uptime: 99.82,
    series: seedSeries(307),
  },
  {
    name: "Metrics ingest",
    status: "ok",
    latency: { p50: 8, p95: 24, p99: 51 },
    errorRate: 0.0001,
    uptime: 99.99,
    series: seedSeries(308),
  },
];

// Compliance ------------------------------------------------------------------
export const controls = [
  {
    id: "SOC 2",
    framework: "AICPA",
    coverage: 96,
    status: "ok" as Signal,
    evidence: 184,
    owner: "Lina Halsey",
    next: "2026-09-12",
  },
  {
    id: "ISO 27001",
    framework: "ISO/IEC",
    coverage: 92,
    status: "ok" as Signal,
    evidence: 211,
    owner: "Omar Rashid",
    next: "2026-11-02",
  },
  {
    id: "GDPR",
    framework: "EU",
    coverage: 98,
    status: "ok" as Signal,
    evidence: 94,
    owner: "Petra Bauer",
    next: "rolling",
  },
  {
    id: "PCI DSS",
    framework: "PCI SSC",
    coverage: 88,
    status: "watch" as Signal,
    evidence: 162,
    owner: "Diego Costa",
    next: "2026-08-30",
  },
  {
    id: "DORA",
    framework: "EU",
    coverage: 81,
    status: "watch" as Signal,
    evidence: 47,
    owner: "Aria Reyes",
    next: "2027-01-15",
  },
  {
    id: "NIST CSF",
    framework: "NIST",
    coverage: 90,
    status: "ok" as Signal,
    evidence: 138,
    owner: "Kenji Sato",
    next: "rolling",
  },
];

// Reports ---------------------------------------------------------------------
export const reportTemplates = [
  {
    name: "Daily Security Brief",
    cadence: "Daily",
    last: "today, 06:00",
    owner: "Security",
    format: "PDF · Email",
  },
  {
    name: "Weekly Auth Posture",
    cadence: "Weekly",
    last: "Mon, 08:00",
    owner: "Identity",
    format: "PDF · Slack",
  },
  {
    name: "Monthly Risk Review",
    cadence: "Monthly",
    last: "Jun 1, 09:00",
    owner: "Risk",
    format: "PDF · Print",
  },
  {
    name: "Quarterly Compliance",
    cadence: "Quarterly",
    last: "Apr 1, 10:00",
    owner: "Legal",
    format: "PDF · Excel",
  },
  {
    name: "Annual SOC 2 Package",
    cadence: "Annual",
    last: "Jan 5",
    owner: "Audit",
    format: "PDF · Excel · CSV",
  },
  {
    name: "Behavior Drift Bulletin",
    cadence: "Weekly",
    last: "Mon, 08:00",
    owner: "AI",
    format: "PDF",
  },
  {
    name: "Model Health Snapshot",
    cadence: "Weekly",
    last: "Mon, 08:00",
    owner: "AI",
    format: "PDF · Excel",
  },
  {
    name: "Device Inventory",
    cadence: "Monthly",
    last: "Jun 1",
    owner: "Identity",
    format: "Excel · CSV",
  },
];

// Audit log -------------------------------------------------------------------
const actors = [
  "lina.halsey@adaptiveguard",
  "aegis.system",
  "omar.rashid@adaptiveguard",
  "diego.costa@adaptiveguard",
  "petra.bauer@adaptiveguard",
  "challenge.engine",
  "model.monitor",
];
const actions = [
  "force re-authentication",
  "lock account",
  "unlock account",
  "deploy model v2.4.1",
  "rollback model v2.4.0",
  "approve dataset ds-2026.06-A",
  "edit role: Risk Analyst",
  "export report: Monthly Risk",
  "issue OTP challenge",
  "resolve incident INC-2835",
  "ack incident INC-2838",
  "rotate API key authn.api",
  "update retention policy: logs 90d",
  "grant role admin to omar.rashid",
  "suspend webhook prod-payments",
];

export const auditLog = Array.from({ length: 36 }, (_, i) => {
  const rng = mulberry32(400 + i);
  const action = actions[Math.floor(rng() * actions.length)];
  const actor = actors[Math.floor(rng() * actors.length)];
  const minsAgo = i * 7 + Math.floor(rng() * 5);
  return {
    id: `AL-${(70000 + i).toString(16).toUpperCase()}`,
    time: minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ${minsAgo % 60}m ago`,
    actor,
    action,
    target: [
      "user:U-A012",
      "model:v2.4.1",
      "role:risk-analyst",
      "incident:INC-2838",
      "dataset:ds-2026.06-A",
    ][Math.floor(rng() * 5)],
    hash: Math.floor(rng() * 0xffffff)
      .toString(16)
      .padStart(6, "0"),
    class: ["admin", "ai", "auth", "policy", "data"][Math.floor(rng() * 5)],
  };
});

// Challenges ------------------------------------------------------------------
export const challengeReasons = [
  { reason: "Behavior drift", count: 412, rate: 0.41 },
  { reason: "New device", count: 286, rate: 0.28 },
  { reason: "Velocity / geo", count: 134, rate: 0.13 },
  { reason: "Model uncertainty", count: 98, rate: 0.1 },
  { reason: "Manual operator", count: 48, rate: 0.05 },
  { reason: "Policy step-up", count: 32, rate: 0.03 },
];

export const challenges = Array.from({ length: 24 }, (_, i) => {
  const rng = mulberry32(500 + i);
  const ok = rng() > 0.18;
  return {
    id: `CH-${(80000 + i).toString(16).toUpperCase()}`,
    when: ["2m", "6m", "14m", "27m", "41m", "58m", "1h 10m", "1h 32m", "2h", "3h"][i % 10] + " ago",
    user: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    reason: challengeReasons[Math.floor(rng() * challengeReasons.length)].reason,
    confidence: 0.6 + rng() * 0.35,
    outcome: ok ? "passed" : rng() > 0.5 ? "failed" : "abandoned",
    duration: `${Math.floor(rng() * 40) + 5}s`,
    device: devices[Math.floor(rng() * devices.length)],
  };
});

// Roles -----------------------------------------------------------------------
export const roles = [
  { id: "admin", label: "Administrator", members: 4, color: "from-blue-500/30 to-cyan-500/30" },
  { id: "risk", label: "Risk Analyst", members: 7, color: "from-rose-500/30 to-amber-500/30" },
  { id: "fraud", label: "Fraud Analyst", members: 5, color: "from-fuchsia-500/30 to-rose-500/30" },
  { id: "support", label: "Support", members: 18, color: "from-emerald-500/30 to-teal-500/30" },
  { id: "auditor", label: "Auditor", members: 3, color: "from-amber-500/30 to-yellow-500/30" },
  { id: "ai", label: "AI Engineer", members: 6, color: "from-purple-500/30 to-blue-500/30" },
];

export const permissions = [
  { resource: "Users", actions: ["view", "edit", "lock", "reset"] },
  { resource: "Sessions", actions: ["view", "terminate", "export"] },
  { resource: "Models", actions: ["view", "deploy", "rollback", "retrain"] },
  { resource: "Datasets", actions: ["view", "upload", "approve"] },
  { resource: "Risk policies", actions: ["view", "edit", "approve"] },
  { resource: "Reports", actions: ["view", "export", "schedule"] },
  { resource: "Audit logs", actions: ["view", "export"] },
  { resource: "Roles", actions: ["view", "edit", "grant"] },
  { resource: "Settings", actions: ["view", "edit"] },
];

export const rolePermissions: Record<string, string[]> = {
  admin: [
    "Users:view",
    "Users:edit",
    "Users:lock",
    "Users:reset",
    "Sessions:view",
    "Sessions:terminate",
    "Sessions:export",
    "Models:view",
    "Models:deploy",
    "Models:rollback",
    "Models:retrain",
    "Datasets:view",
    "Datasets:upload",
    "Datasets:approve",
    "Risk policies:view",
    "Risk policies:edit",
    "Risk policies:approve",
    "Reports:view",
    "Reports:export",
    "Reports:schedule",
    "Audit logs:view",
    "Audit logs:export",
    "Roles:view",
    "Roles:edit",
    "Roles:grant",
    "Settings:view",
    "Settings:edit",
  ],
  risk: [
    "Users:view",
    "Sessions:view",
    "Sessions:export",
    "Risk policies:view",
    "Risk policies:edit",
    "Reports:view",
    "Reports:export",
    "Audit logs:view",
  ],
  fraud: [
    "Users:view",
    "Users:lock",
    "Sessions:view",
    "Sessions:terminate",
    "Risk policies:view",
    "Reports:view",
    "Audit logs:view",
  ],
  support: ["Users:view", "Users:reset", "Sessions:view", "Reports:view"],
  auditor: [
    "Users:view",
    "Sessions:view",
    "Sessions:export",
    "Reports:view",
    "Reports:export",
    "Audit logs:view",
    "Audit logs:export",
    "Settings:view",
  ],
  ai: [
    "Models:view",
    "Models:deploy",
    "Models:retrain",
    "Datasets:view",
    "Datasets:upload",
    "Datasets:approve",
    "Reports:view",
    "Audit logs:view",
  ],
};

// Notifications ---------------------------------------------------------------
export const notifGroups = [
  { id: "security", label: "Security", count: 5, signal: "alert" as Signal },
  { id: "ai", label: "AI", count: 3, signal: "watch" as Signal },
  { id: "infra", label: "Infrastructure", count: 2, signal: "watch" as Signal },
  { id: "users", label: "Users", count: 12, signal: "ok" as Signal },
  { id: "reports", label: "Reports", count: 4, signal: "ok" as Signal },
  { id: "deploy", label: "Deployments", count: 1, signal: "ok" as Signal },
  { id: "maint", label: "Maintenance", count: 0, signal: "ok" as Signal },
];

// Geo distribution ------------------------------------------------------------
export const geoDots = Array.from({ length: 80 }, (_, i) => {
  const rng = mulberry32(600 + i);
  return {
    x: rng() * 100,
    y: 15 + rng() * 70,
    intensity: rng(),
    anomaly: rng() > 0.92,
  };
});

// Infrastructure --------------------------------------------------------------
export const infra = {
  cpu: { value: 38, series: seedSeries(701, 48, 20, 70) },
  memory: { value: 62, series: seedSeries(702, 48, 40, 80) },
  disk: { value: 41, series: seedSeries(703, 48, 30, 55) },
  gpu: { value: 71, series: seedSeries(704, 48, 50, 90) },
  network: { value: 28, series: seedSeries(705, 48, 10, 50) },
  containers: 184,
  workers: 42,
  jobsRunning: 18,
  jobsQueued: 4,
  jobsFailed: 1,
  inferenceQueue: 7,
};

// Admin-side institutional accounts (was inline in admin.accounts.tsx) ---------
export const adminAccounts = Array.from({ length: 20 }, (_, i) => {
  const rng = mulberry32(800 + i);
  const products = ["Current", "Savings", "Treasury", "Card", "FX", "Loan"] as const;
  const holders = [
    "Aurora Mfg LLC",
    "Helios Capital",
    "Northwind GmbH",
    "Atlas Trust",
    "Vega Holdings",
    "Solstice LP",
    "Halcyon Inc",
  ];
  const currencies = ["USD", "EUR", "GBP", "SGD"];
  const flags = i % 5 === 0 ? "AML review" : i % 7 === 0 ? "frozen" : "—";
  return {
    id: `ACC-${(90000 + i).toString(16).toUpperCase()}`,
    holder: holders[i % holders.length],
    product: products[i % products.length],
    balance: 12_000 + Math.floor(rng() * 8_000_000),
    currency: currencies[i % currencies.length],
    flags,
    opened: ["2021", "2022", "2023", "2024", "2025"][i % 5],
  };
});

// Anomaly signatures (was inline in admin.anomalies.tsx) ----------------------
export const anomalySignatures = [
  { name: "Behavior drift > 3σ", count: 12, last: "8m ago", severity: "alert" as Signal },
  { name: "New device burst (>5/min)", count: 6, last: "21m ago", severity: "watch" as Signal },
  { name: "Impossible travel", count: 3, last: "47m ago", severity: "critical" as Signal },
  { name: "Velocity check failed", count: 18, last: "1h ago", severity: "watch" as Signal },
  { name: "Model uncertainty spike", count: 2, last: "34m ago", severity: "alert" as Signal },
];
