import { mockResolve } from "../_transport/mock";
import type {
  AdminService,
  AdminSession,
  AdminUser,
  AuditEvent,
  ModelInfo,
} from "./admin.contract";

const USERS: ReadonlyArray<AdminUser> = Array.from({ length: 24 }, (_, i) => ({
  id: `usr_${i.toString().padStart(4, "0")}`,
  email: `user${i}@adaptiveguard.ai`,
  displayName: ["Alex Morgan", "Helena Vogt", "Jonas Reiter", "Mira Okafor", "Yusuf Demir"][i % 5],
  status: i === 3 ? "locked" : i === 7 ? "challenged" : "active",
  riskScore: Math.round((0.04 + (i % 7) * 0.03) * 100) / 100,
  lastSeenAt: new Date(Date.now() - i * 36e5).toISOString(),
  tenant: "adaptiveguard.ai",
}));

const SESSIONS: ReadonlyArray<AdminSession> = Array.from({ length: 16 }, (_, i) => ({
  id: `ses_${i.toString().padStart(4, "0")}`,
  userId: USERS[i % USERS.length].id,
  startedAt: new Date(Date.now() - i * 1.2e6).toISOString(),
  device: i % 3 === 0 ? "MacBook Pro" : i % 3 === 1 ? "iPhone 16" : "Windows Chrome",
  ip: `10.${(i * 7) % 250}.${(i * 13) % 250}.${(i * 31) % 250}`,
  city: ["Berlin", "Lisbon", "Tallinn", "Dublin", "Paris"][i % 5],
  confidence: Math.round((0.86 + Math.sin(i) * 0.06) * 100) / 100,
}));

const MODELS: ReadonlyArray<ModelInfo> = [
  { id: "mdl_lgbm_v7", family: "lightgbm", version: "7.2.1", promotedAt: new Date(Date.now() - 9 * 864e5).toISOString(), precision: 0.974, recall: 0.961, status: "live" },
  { id: "mdl_ocsvm_v3", family: "ocsvm", version: "3.0.0", promotedAt: new Date(Date.now() - 22 * 864e5).toISOString(), precision: 0.92, recall: 0.84, status: "shadow" },
  { id: "mdl_ens_v1", family: "ensemble", version: "1.4.0", promotedAt: new Date(Date.now() - 60 * 864e5).toISOString(), precision: 0.965, recall: 0.95, status: "archived" },
];

const AUDIT: ReadonlyArray<AuditEvent> = Array.from({ length: 20 }, (_, i) => ({
  id: `aud_${i}`,
  occurredAt: new Date(Date.now() - i * 24e5).toISOString(),
  actor: i % 4 === 0 ? "system" : "admin@adaptiveguard.ai",
  action: ["role.grant", "user.lock", "model.promote", "policy.update"][i % 4],
  target: USERS[i % USERS.length].id,
  outcome: i === 5 ? "denied" : "ok",
}));

export const mockAdminService: AdminService = {
  async listUsers({ signal } = {}) {
    return mockResolve(USERS, { signal });
  },
  async listSessions({ signal } = {}) {
    return mockResolve(SESSIONS, { signal });
  },
  async listModels({ signal } = {}) {
    return mockResolve(MODELS, { signal });
  },
  async listAudit({ signal } = {}) {
    return mockResolve(AUDIT, { signal });
  },
};
