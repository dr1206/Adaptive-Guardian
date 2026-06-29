/**
 * Admin domain contract — cockpit reads.
 * Writes (user actions, role grants) intentionally absent until backend lands.
 */

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  status: "active" | "challenged" | "locked" | "invited";
  riskScore: number;
  lastSeenAt: string;
  tenant: string;
}

export interface AdminSession {
  id: string;
  userId: string;
  startedAt: string;
  device: string;
  ip: string;
  city: string;
  confidence: number;
}

export interface ModelInfo {
  id: string;
  family: "lightgbm" | "ocsvm" | "ensemble";
  version: string;
  promotedAt: string;
  precision: number;
  recall: number;
  status: "live" | "shadow" | "archived";
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  actor: string;
  action: string;
  target: string;
  outcome: "ok" | "denied" | "error";
}

export interface AdminService {
  listUsers(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AdminUser>>;
  listSessions(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AdminSession>>;
  listModels(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<ModelInfo>>;
  listAudit(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<AuditEvent>>;
}
