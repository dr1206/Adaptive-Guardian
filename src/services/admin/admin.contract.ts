/**
 * Admin domain contract — cockpit reads.
 *
 * The service layer surfaces every dataset the AI-SOC routes need.
 * Writes (user actions, role grants, model deploys) intentionally remain
 * absent until the real backend lands; the cockpit is read-only for now.
 */

import type { Signal } from "@/lib/admin-signal";

export type { Signal };

export interface Kpi {
  id: string;
  label: string;
  value: number;
  suffix: string;
  delta: number;
  signal: Signal;
  series: number[];
}

export interface GlobalMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  signal: Signal;
  series: number[];
}

export interface LiveSession {
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
}

export interface AdminUser {
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
}

export interface Incident {
  id: string;
  title: string;
  severity: Signal;
  user?: string;
  source: string;
  age: string;
  status: "open" | "ack" | "resolved";
}

export interface ModelVersion {
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
}

export interface Dataset {
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
}

export interface ApiService {
  name: string;
  status: Signal;
  latency: { p50: number; p95: number; p99: number };
  errorRate: number;
  uptime: number;
  series: number[];
}

export interface ComplianceControl {
  id: string;
  framework: string;
  coverage: number;
  status: Signal;
  evidence: number;
  owner: string;
  next: string;
}

export interface ReportTemplate {
  name: string;
  cadence: string;
  last: string;
  owner: string;
  format: string;
}

export interface AuditEntry {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  hash: string;
  class: string;
}

export interface ChallengeReason {
  reason: string;
  count: number;
  rate: number;
}

export interface ChallengeRecord {
  id: string;
  when: string;
  user: string;
  reason: string;
  confidence: number;
  outcome: "passed" | "failed" | "abandoned";
  duration: string;
  device: string;
}

export interface Role {
  id: string;
  label: string;
  members: number;
  color: string;
}

export interface Permission {
  resource: string;
  actions: ReadonlyArray<string>;
}

export interface NotificationGroup {
  id: string;
  label: string;
  count: number;
  signal: Signal;
}

export interface GeoDot {
  x: number;
  y: number;
  intensity: number;
  anomaly: boolean;
}

export interface AdminAccount {
  id: string;
  holder: string;
  product: "Current" | "Savings" | "Treasury" | "Card" | "FX" | "Loan";
  balance: number;
  currency: string;
  flags: string;
  opened: string;
}

export interface AnomalySignature {
  name: string;
  count: number;
  last: string;
  severity: Signal;
}

export interface InfraSnapshot {
  cpu: { value: number; series: number[] };
  memory: { value: number; series: number[] };
  disk: { value: number; series: number[] };
  gpu: { value: number; series: number[] };
  network: { value: number; series: number[] };
  containers: number;
  workers: number;
  jobsRunning: number;
  jobsQueued: number;
  jobsFailed: number;
  inferenceQueue: number;
}

export interface AdminService {
  listAdminAccounts(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AdminAccount>>;
  listAnomalySignatures(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AnomalySignature>>;
  listKpis(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Kpi>>;

  listGlobalMetrics(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<GlobalMetric>>;
  listLiveSessions(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<LiveSession>>;
  listUsers(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AdminUser>>;
  listIncidents(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Incident>>;
  listModels(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ModelVersion>>;
  listDatasets(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Dataset>>;
  listApiServices(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ApiService>>;
  listControls(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ComplianceControl>>;
  listReportTemplates(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ReportTemplate>>;
  listAudit(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AuditEntry>>;
  listChallengeReasons(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ChallengeReason>>;
  listChallenges(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ChallengeRecord>>;
  listRoles(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Role>>;
  listPermissions(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Permission>>;
  getRolePermissions(opts?: { signal?: AbortSignal }): Promise<Readonly<Record<string, ReadonlyArray<string>>>>;
  listNotificationGroups(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<NotificationGroup>>;
  listGeoDots(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<GeoDot>>;
  getInfraSnapshot(opts?: { signal?: AbortSignal }): Promise<InfraSnapshot>;
}
