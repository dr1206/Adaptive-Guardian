/**
 * Service layer — public surface.
 *
 * Every API interaction in the UI MUST go through `services` exported here.
 * Components and routes are forbidden from importing `*-data.ts` mocks or
 * `fetch()` directly. The UI talks to interfaces; the registry decides
 * whether those interfaces resolve to mocks or the real backend.
 *
 * Swapping backends:
 *   - dev / preview / Lovable export → MockServices (default)
 *   - local Claude backend          → HttpServices (set VITE_USE_REAL_API=true)
 *
 * No UI file needs to change when the switch flips.
 */

export type { Services, ServiceMode } from "./registry";
export { services, getServiceMode } from "./registry";

// Domain contracts — import these types in components, never the impls.
export type {
  AuthService,
  LoginInput,
  RegisterInput,
  VerifyOtpInput,
  Session,
  EnrollmentSample,
  EnrollmentSummary,
} from "./auth/auth.contract";

export type {
  BankingService,
  Account,
  AccountType,
  Transaction,
  Beneficiary,
  TransferInput,
  TransferResult,
  BankCard,
  Currency,
  Holding,
  Insight,
  LoanRecord,
  Payment,
  SavingsGoal,
} from "./banking/banking.contract";

export type {
  AegisService,
  AegisSnapshot,
  Decision,
  Device,
  RiskEvent,
} from "./aegis/aegis.contract";

export type {
  AdminAccount,
  AnomalySignature,
  AdminService,
  AdminUser,
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
  Signal,
} from "./admin/admin.contract";
