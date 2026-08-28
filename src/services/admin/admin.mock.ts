/**
 * Admin service — mock implementation.
 *
 * Pulls deterministic fixtures from `admin.fixtures.ts` and surfaces them
 * through the contract. No business logic, no writes (Phase 5 read-only cockpit).
 */

import { mockResolve } from "../_transport/mock";
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
import {
  adminAccounts,
  adminUsers,
  anomalySignatures,
  auditLog,
  challengeReasons,
  challenges,
  controls,
  datasets,
  geoDots,
  globalMetrics,
  incidents,
  infra,
  kpis,
  liveSessions,
  models,
  notifGroups,
  permissions,
  reportTemplates,
  rolePermissions,
  roles,
  services as apiServices,
} from "./admin.fixtures";

export const mockAdminService: AdminService = {
  listAdminAccounts: ({ signal } = {}) =>
    mockResolve(adminAccounts as ReadonlyArray<AdminAccount>, { signal }),
  listAnomalySignatures: ({ signal } = {}) =>
    mockResolve(anomalySignatures as ReadonlyArray<AnomalySignature>, { signal }),
  listKpis: ({ signal } = {}) => mockResolve(kpis as ReadonlyArray<Kpi>, { signal }),
  listGlobalMetrics: ({ signal } = {}) =>
    mockResolve(globalMetrics as ReadonlyArray<GlobalMetric>, { signal }),
  listLiveSessions: ({ signal } = {}) =>
    mockResolve(liveSessions as ReadonlyArray<LiveSession>, { signal }),
  listUsers: ({ signal } = {}) => mockResolve(adminUsers as ReadonlyArray<AdminUser>, { signal }),
  listIncidents: ({ signal } = {}) => mockResolve(incidents as ReadonlyArray<Incident>, { signal }),
  listModels: ({ signal } = {}) => mockResolve(models as ReadonlyArray<ModelVersion>, { signal }),
  listDatasets: ({ signal } = {}) => mockResolve(datasets as ReadonlyArray<Dataset>, { signal }),
  listApiServices: ({ signal } = {}) =>
    mockResolve(apiServices as ReadonlyArray<ApiService>, { signal }),
  listControls: ({ signal } = {}) =>
    mockResolve(controls as ReadonlyArray<ComplianceControl>, { signal }),
  listReportTemplates: ({ signal } = {}) =>
    mockResolve(reportTemplates as ReadonlyArray<ReportTemplate>, { signal }),
  listAudit: ({ signal } = {}) => mockResolve(auditLog as ReadonlyArray<AuditEntry>, { signal }),
  listChallengeReasons: ({ signal } = {}) =>
    mockResolve(challengeReasons as ReadonlyArray<ChallengeReason>, { signal }),
  listChallenges: ({ signal } = {}) =>
    mockResolve(challenges as ReadonlyArray<ChallengeRecord>, { signal }),
  listRoles: ({ signal } = {}) => mockResolve(roles as ReadonlyArray<Role>, { signal }),
  listPermissions: ({ signal } = {}) =>
    mockResolve(permissions as ReadonlyArray<Permission>, { signal }),
  getRolePermissions: ({ signal } = {}) =>
    mockResolve(rolePermissions as Readonly<Record<string, ReadonlyArray<string>>>, { signal }),
  listNotificationGroups: ({ signal } = {}) =>
    mockResolve(notifGroups as ReadonlyArray<NotificationGroup>, { signal }),
  listGeoDots: ({ signal } = {}) => mockResolve(geoDots as ReadonlyArray<GeoDot>, { signal }),
  getInfraSnapshot: ({ signal } = {}) => mockResolve(infra as InfraSnapshot, { signal }),
  getUserDetails: ({ signal, user_id: _userId }: { user_id?: string; signal?: AbortSignal } = {}) =>
    mockResolve(
      {
        user: null,
        auth_sessions: [],
        training_sessions: [],
        training_events: [],
        training_features: [],
        behavioral_events: [],
        behavior_windows: [],
        device_profiles: [],
      },
      { signal },
    ),
  getUserSessions: ({ signal, user_id: _userId }: { user_id?: string; signal?: AbortSignal } = {}) =>
    mockResolve({ user: null, auth_sessions: [] }, { signal }),
  exportTrainingData: ({ signal } = {}) =>
    mockResolve(void 0 as unknown as void, { signal }),
  exportTrainingDataByUsers: ({ signal } = {}) =>
    mockResolve(void 0 as unknown as void, { signal }),
  exportSessionBehavioral: ({ signal, session_id: _sessionId }: { session_id?: string; signal?: AbortSignal } = {}) =>
    mockResolve(void 0 as unknown as void, { signal }),
};
