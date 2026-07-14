/**
 * Audit HTTP adapter.
 */

import { httpRequest } from "../_transport/http";
import type { AuditService, AuditQueryResponse, AuditSummaryResponse } from "./audit.contract";

export const httpAuditService: AuditService = {
  async queryEntries({ actor, action, resource, outcome, limit, offset, signal } = {}) {
    return httpRequest<AuditQueryResponse>("/audit/entries", {
      params: { actor, action, resource, outcome, limit, offset },
      signal,
    });
  },

  async getSummary(periodHours = 24, { signal } = {}) {
    return httpRequest<AuditSummaryResponse>("/audit/summary", {
      params: { periodHours },
      signal,
    });
  },
};
