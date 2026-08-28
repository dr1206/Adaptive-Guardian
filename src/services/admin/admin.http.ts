/**
 * Admin HTTP adapter — calls the real backend and maps responses to the
 * frontend AdminService contract shape.
 */

import { httpRequest } from "../_transport/http";
import type {
  AdminAccount,
  AdminService,
  AdminUser,
  AnomalySignature,
  ApiService,
  AuditEntry,
  ChallengeReason,
  ChallengeRecord,
  ComplianceControl,
  Dataset,
  GeoDot,
  GlobalMetric,
  Incident,
  InfraSnapshot,
  Kpi,
  LiveSession,
  ModelVersion,
  NotificationGroup,
  Permission,
  ReportTemplate,
  Role,
} from "./admin.contract";

// ---------------------------------------------------------------------------
// Backend wire shapes
// ---------------------------------------------------------------------------

interface BackendKpiCard {
  label: string;
  value: string;
  delta?: string | null;
  tone: string;
}

interface BackendKpiResponse {
  totalUsers: BackendKpiCard;
  activeSessions: BackendKpiCard;
  riskEventsToday: BackendKpiCard;
  blockedAttempts: BackendKpiCard;
  mfaChallenges: BackendKpiCard;
  avgConfidence: BackendKpiCard;
}

interface BackendGlobalMetricsResponse {
  series: Array<{
    id: string;
    label: string;
    value: string;
    delta: string;
    signal: string;
    series: number[];
  }>;
  period: string;
}

interface BackendAdminSessionItem {
  sessionId: string;
  userEmail: string;
  userName: string;
  ipAddress?: string | null;
  deviceLabel?: string | null;
  riskScore?: number | null;
  riskVerdict?: string | null;
  activeSince: string;
  lastActive: string;
}

interface BackendAdminSessionList {
  sessions: BackendAdminSessionItem[];
  total: number;
}

interface BackendAdminUserItem {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  enrollmentStatus: string;
  lastLogin?: string | null;
  createdAt: string;
  riskLevel: string;
}

interface BackendAdminUserList {
  users: BackendAdminUserItem[];
  total: number;
}

interface BackendAdminIncidentItem {
  id: string;
  title: string;
  severity: string;
  detail: string;
  userEmail?: string | null;
  sessionId?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  status: string;
}

interface BackendAdminIncidentList {
  incidents: BackendAdminIncidentItem[];
  total: number;
  openCount: number;
}

interface BackendModelItem {
  id: string;
  name: string;
  status: string;
  trained: string;
  dataset: string;
  versions: Array<{
    version: string;
    status: string;
    trained: string;
    dataset: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    latencyMs: number;
    memoryMb: number;
  }>;
}

interface BackendDatasetItem {
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
  status: string;
}

interface BackendApiServicesResponse {
  services: Array<{
    name: string;
    status: string;
    latency: { p50: number; p95: number; p99: number };
    errorRate: number;
    uptime: number;
    series: number[];
  }>;
  overall: string;
}

interface BackendControlsResponse {
  controls: Array<{
    id: string;
    framework: string;
    coverage: number;
    status: string;
    evidence: number;
    owner: string;
    next: string;
  }>;
}

interface BackendReportTemplate {
  name: string;
  cadence: string;
  last: string;
  owner: string;
  format: string;
}

interface BackendAuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  detail: string;
  outcome: string;
  ipAddress?: string | null;
  createdAt: string;
}

interface BackendAuditResponse {
  entries: BackendAuditEntry[];
  total: number;
}

interface BackendChallengeReason {
  reason: string;
  count: number;
  rate: number;
}

interface BackendAdminChallengeItem {
  id: string;
  when: string;
  user: string;
  reason: string;
  confidence: number;
  outcome: string;
  duration: string;
  device: string;
}

interface BackendAdminChallengeList {
  challenges: BackendAdminChallengeItem[];
  total: number;
}

interface BackendRoleDefinition {
  id: string;
  label: string;
  members: number;
  color: string;
}

interface BackendAdminRoleList {
  roles: BackendRoleDefinition[];
}

interface BackendPermissionItem {
  resource: string;
  actions: string[];
}

interface BackendPermissionList {
  permissions: BackendPermissionItem[];
}

interface BackendRolePermissionsResponse {
  mappings: Array<{ role: string; permissions: string[] }>;
}

interface BackendNotificationGroup {
  id: string;
  label: string;
  count: number;
  signal: string;
}

interface BackendNotificationGroupList {
  groups: BackendNotificationGroup[];
}

interface BackendGeoDotsResponse {
  dots: Array<{ x: number; y: number; intensity: number; anomaly: boolean }>;
}

interface BackendInfraResponse {
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

interface BackendAdminAccountItem {
  id: string;
  holder: string;
  product: string;
  balance: number;
  currency: string;
  flags: string;
  opened: string;
}

interface BackendAdminAccountList {
  accounts: BackendAdminAccountItem[];
  total: number;
}

interface BackendAnomalySignature {
  name: string;
  count: number;
  last: string;
  severity: string;
}

interface BackendAnomalySignatureList {
  signatures: BackendAnomalySignature[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import type { Signal } from "../../lib/admin-signal";

function toSignal(value: number | string): Signal {
  if (typeof value === "string") return value as Signal;
  if (value >= 80) return "ok";
  if (value >= 50) return "watch";
  if (value >= 30) return "alert";
  return "critical";
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

function parseKpiCard(card: BackendKpiCard): { value: number; delta: number; suffix: string; series: number[] } {
  const value = parseInt(card.value.replace(/[,%]/g, ""), 10) || 0;
  const deltaStr = card.delta ?? "0";
  const delta = parseInt(deltaStr.replace(/[+,%]/g, ""), 10) || 0;
  const suffix = card.value.includes("%") ? "%" : "";
  const series = seedSeries(Math.abs(hashCode(card.label)), 24, 0, Math.max(value * 2, 1), 0.6);
  return { value, delta, suffix, series };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function seedSeries(seed: number, n = 64, min = 0, max = 1, smooth = 0.6): number[] {
  let v = (min + max) / 2;
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    const rng = ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    const target = min + rng * (max - min);
    v = v * smooth + target * (1 - smooth);
    out.push(v);
  }
  return out;
}

function parseAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const httpAdminService: AdminService = {
  async listKpis({ signal } = {}) {
    const resp = await httpRequest<BackendKpiResponse>("/admin/kpis", { signal });
    const totalUsers = parseKpiCard(resp.totalUsers);
    const activeSessions = parseKpiCard(resp.activeSessions);
    const riskEvents = parseKpiCard(resp.riskEventsToday);
    const challenges = parseKpiCard(resp.mfaChallenges);
    return [
      { id: "totalUsers", label: "Total Users", ...totalUsers, signal: toSignal(totalUsers.delta) },
      { id: "activeSessions", label: "Active Sessions", ...activeSessions, signal: toSignal(activeSessions.value) },
      { id: "riskEvents", label: "Risk Events", ...riskEvents, signal: toSignal(riskEvents.delta > 0 ? 0 : 100) },
      { id: "challenges", label: "Challenges", ...challenges, signal: toSignal(challenges.delta > 0 ? 0 : 100) },
    ];
  },

  async listGlobalMetrics({ signal } = {}) {
    const resp = await httpRequest<BackendGlobalMetricsResponse>("/admin/global-metrics", { signal });
    return resp.series.map((m) => ({
      ...m,
      signal: toSignal(m.signal),
    }));
  },

  async listLiveSessions({ signal } = {}) {
    const resp = await httpRequest<BackendAdminSessionList>("/admin/sessions", { signal });
    return resp.sessions.map((s) => ({
      id: s.sessionId,
      user: s.userName,
      initials: initials(s.userName),
      device: s.deviceLabel ?? "Unknown device",
      page: "Dashboard",
      confidence: 0.95 + Math.random() * 0.04,
      risk: s.riskScore ?? 0.1,
      behavior: 0.85 + Math.random() * 0.1,
      duration: parseAge(s.activeSince),
      activity: "Browsing",
      lastEvent: parseAge(s.lastActive),
      signal: toSignal(s.riskScore != null ? Math.max(0, 1 - s.riskScore) * 100 : 90),
    }));
  },

  async listUsers({ signal } = {}) {
    const resp = await httpRequest<BackendAdminUserList>("/admin/users", { signal });
    return resp.users.map((u) => ({
      id: u.id,
      name: u.fullName,
      initials: initials(u.fullName),
      email: u.email,
      status: (u.isActive ? "active" : "locked") as AdminUser["status"],
      tier: (u.roles.includes("admin") ? "Enterprise" : "Personal") as AdminUser["tier"],
      roles: u.roles ?? [],
      devices: 1,
      trust: u.isVerified ? 85 : 30,
      risk: u.riskLevel === "critical" ? 90 : u.riskLevel === "high" ? 65 : u.riskLevel === "medium" ? 35 : 10,
      lastSeen: u.lastLogin ? parseAge(u.lastLogin) : "never",
      country: "Unknown",
      signal: toSignal(u.isVerified ? 90 : 30),
    }));
  },

  async listIncidents({ signal } = {}) {
    const resp = await httpRequest<BackendAdminIncidentList>("/admin/incidents", { signal });
    return resp.incidents.map((i) => ({
      id: i.id,
      title: i.title,
      severity: toSignal(i.severity),
      source: "Aegis Engine",
      age: parseAge(i.createdAt),
      status: (i.status === "investigating" ? "ack" : i.status) as Incident["status"],
    }));
  },

  async listModels({ signal } = {}) {
    const models = await httpRequest<BackendModelItem[]>("/admin/models", { signal });
    return models.flatMap((m) => m.versions.map((v) => ({
      ...v,
      status: v.status as ModelVersion["status"],
    })));
  },

  async listDatasets({ signal } = {}) {
    const datasets = await httpRequest<BackendDatasetItem[]>("/admin/datasets", { signal });
    return datasets.map((d) => ({
      ...d,
      status: d.status as Dataset["status"],
    }));
  },

  async listApiServices({ signal } = {}) {
    const resp = await httpRequest<BackendApiServicesResponse>("/admin/api-services", { signal });
    return resp.services.map((s) => ({ ...s, status: toSignal(s.status) }));
  },

  async listControls({ signal } = {}) {
    const resp = await httpRequest<BackendControlsResponse>("/admin/controls", { signal });
    return resp.controls.map((c) => ({ ...c, status: toSignal(c.coverage) }));
  },

  async listReportTemplates({ signal } = {}) {
    return httpRequest<ReportTemplate[]>("/admin/report-templates", { signal });
  },

  async listAudit({ signal } = {}) {
    const resp = await httpRequest<BackendAuditResponse>("/admin/audit", { signal });
    const clsMap: Record<string, string> = { success: "ok", failure: "warn", blocked: "critical" };
    return resp.entries.map((e) => ({
      id: e.id,
      time: e.createdAt,
      actor: e.actor,
      action: e.action,
      target: e.resource,
      hash: e.id.slice(0, 8),
      class: clsMap[e.outcome] ?? "info",
    }));
  },

  async listChallengeReasons({ signal } = {}) {
    return httpRequest<ChallengeReason[]>("/admin/challenge-reasons", { signal });
  },

  async listChallenges({ signal } = {}) {
    const resp = await httpRequest<BackendAdminChallengeList>("/admin/challenges", { signal });
    return resp.challenges.map((c) => ({
      ...c,
      outcome: c.outcome as ChallengeRecord["outcome"],
    }));
  },

  async listRoles({ signal } = {}) {
    const resp = await httpRequest<BackendAdminRoleList>("/admin/roles", { signal });
    return resp.roles;
  },

  async listPermissions({ signal } = {}) {
    const resp = await httpRequest<BackendPermissionList>("/admin/permissions", { signal });
    return resp.permissions.map((p) => ({
      resource: p.resource,
      actions: p.actions,
    }));
  },

  async getRolePermissions({ signal } = {}) {
    const resp = await httpRequest<BackendRolePermissionsResponse>("/admin/role-permissions", { signal });
    const map: Record<string, ReadonlyArray<string>> = {};
    for (const m of resp.mappings) {
      map[m.role] = m.permissions;
    }
    return map;
  },

  async listNotificationGroups({ signal } = {}) {
    const resp = await httpRequest<BackendNotificationGroupList>("/admin/notification-groups", { signal });
    return resp.groups.map((g) => ({ ...g, signal: toSignal(g.signal) }));
  },

  async listGeoDots({ signal } = {}) {
    const resp = await httpRequest<BackendGeoDotsResponse>("/admin/geo-dots", { signal });
    return resp.dots;
  },

  async getInfraSnapshot({ signal } = {}) {
    return httpRequest<InfraSnapshot>("/admin/infra", { signal });
  },

  async listAdminAccounts({ signal } = {}) {
    const resp = await httpRequest<BackendAdminAccountList>("/admin/accounts", { signal });
    return resp.accounts.map((a) => ({
      ...a,
      product: a.product as AdminAccount["product"],
    }));
  },

  async listAnomalySignatures({ signal } = {}) {
    const resp = await httpRequest<BackendAnomalySignatureList>("/admin/anomaly-signatures", { signal });
    return resp.signatures.map((s) => ({
      ...s,
      severity: toSignal(s.severity),
    }));
  },

  async getUserDetails({ user_id, signal }: { user_id: string; signal?: AbortSignal }) {
    return httpRequest<any>(`/admin/users/${user_id}/details`, { signal });
  },

  async getUserSessions({ user_id, signal }: { user_id: string; signal?: AbortSignal }) {
    return httpRequest<any>(`/admin/users/${user_id}/sessions`, { signal });
  },

  async exportTrainingData({ signal } = {}) {
    const API_BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:8000/api/v1";

    async function downloadExport(path: string, fallbackFilename: string) {
      const token = (() => {
        try {
          return localStorage.getItem("ag_access_token");
        } catch {
          return null;
        }
      })();

      if (!token) {
        throw new Error("Missing authorization header");
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      let resp = await fetch(`${API_BASE}${path}`, {
        headers,
        signal,
        credentials: "include",
      });

      if (resp.status === 401) {
        try {
          const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (refreshResp.ok) {
            const body = (await refreshResp.json()) as { accessToken?: string };
            const newToken = body.accessToken;
            if (newToken) {
              localStorage.setItem("ag_access_token", newToken);
              headers.Authorization = `Bearer ${newToken}`;
              resp = await fetch(`${API_BASE}${path}`, {
                headers,
                signal,
                credentials: "include",
              });
            }
          }
        } catch {
          // refresh failed, fall through to error handling below
        }
      }

      if (!resp.ok) {
        let body: { message?: string } = {};
        try {
          body = await resp.json();
        } catch {
          // ignore non-JSON body
        }
        throw new Error(body.message ?? `Export failed (${resp.status})`);
      }

      // Extract filename from Content-Disposition header (server-side generated)
      const contentDisposition = resp.headers.get("Content-Disposition");
      let filename = fallbackFilename;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    await downloadExport("/admin/training/export", "training_data.csv");
  },

  async exportTrainingDataByUsers({ signal, user_id } = {}) {
    const API_BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:8000/api/v1";

    async function downloadExport(path: string, fallbackFilename: string) {
      const token = (() => {
        try {
          return localStorage.getItem("ag_access_token");
        } catch {
          return null;
        }
      })();

      if (!token) {
        throw new Error("Missing authorization header");
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      let resp = await fetch(`${API_BASE}${path}`, {
        headers,
        signal,
        credentials: "include",
      });

      if (resp.status === 401) {
        try {
          const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (refreshResp.ok) {
            const body = (await refreshResp.json()) as { accessToken?: string };
            const newToken = body.accessToken;
            if (newToken) {
              localStorage.setItem("ag_access_token", newToken);
              headers.Authorization = `Bearer ${newToken}`;
              resp = await fetch(`${API_BASE}${path}`, {
                headers,
                signal,
                credentials: "include",
              });
            }
          }
        } catch {
          // refresh failed, fall through to error handling below
        }
      }

      if (!resp.ok) {
        let body: { message?: string } = {};
        try {
          body = await resp.json();
        } catch {
          // ignore non-JSON body
        }
        throw new Error(body.message ?? `Export failed (${resp.status})`);
      }

      // Extract filename from Content-Disposition header (server-side generated)
      const contentDisposition = resp.headers.get("Content-Disposition");
      let filename = fallbackFilename;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Scope the export to the selected user when one is provided; otherwise it
    // exports all users (existing behavior for the Behavior Analytics page).
    const query = user_id ? `?user_id=${encodeURIComponent(user_id)}` : "";
    const fallbackFilename = user_id ? `user_${user_id}_export.zip` : "training_data_by_users.zip";
    await downloadExport(`/admin/training/export/users${query}`, fallbackFilename);
  },

  async exportSessionBehavioral({ session_id, signal }: { session_id: string; signal?: AbortSignal }) {
    const API_BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:8000/api/v1";

    const token = (() => {
      try {
        return localStorage.getItem("ag_access_token");
      } catch {
        return null;
      }
    })();
    if (!token) throw new Error("Missing authorization header");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    let resp = await fetch(`${API_BASE}/admin/sessions/${encodeURIComponent(session_id)}/behavioral`, {
      headers,
      signal,
      credentials: "include",
    });

    if (resp.status === 401) {
      try {
        const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (refreshResp.ok) {
          const body = (await refreshResp.json()) as { accessToken?: string };
          if (body.accessToken) {
            localStorage.setItem("ag_access_token", body.accessToken);
            headers.Authorization = `Bearer ${body.accessToken}`;
            resp = await fetch(`${API_BASE}/admin/sessions/${encodeURIComponent(session_id)}/behavioral`, {
              headers,
              signal,
              credentials: "include",
            });
          }
        }
      } catch {
        // refresh failed, fall through to error handling below
      }
    }

    if (!resp.ok) {
      let body: { message?: string } = {};
      try {
        body = await resp.json();
      } catch {
        // ignore non-JSON body
      }
      throw new Error(body.message ?? `Export failed (${resp.status})`);
    }

    // Extract filename from Content-Disposition header (server-side generated)
    const contentDisposition = resp.headers.get("Content-Disposition");
    let filename = `session_${session_id}_behavioral.zip`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match) {
        filename = match[1];
      }
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
