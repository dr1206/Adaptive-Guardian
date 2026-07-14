/**
 * Audit domain contract.
 */

export interface AuditEntryItem {
  id: string;
  time: string;
  actor: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  outcome: "success" | "failure" | "blocked";
  details: Record<string, unknown> | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuditQueryResponse {
  entries: AuditEntryItem[];
  total: number;
}

export interface AuditSummaryItem {
  action: string;
  count: number;
  lastSeen: string;
}

export interface AuditSummaryResponse {
  items: AuditSummaryItem[];
  totalEntries: number;
  periodHours: number;
}

export interface AuditService {
  queryEntries(opts?: {
    actor?: string;
    action?: string;
    resource?: string;
    outcome?: string;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }): Promise<AuditQueryResponse>;
  getSummary(periodHours?: number, opts?: { signal?: AbortSignal }): Promise<AuditSummaryResponse>;
}
