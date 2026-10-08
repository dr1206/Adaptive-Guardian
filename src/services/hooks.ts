/**
 * React Query hooks over the service registry.
 *
 * Components must import from `@/services/hooks` (or this file) — never
 * call `services.*` inside render bodies. Hooks own caching, retries,
 * abort propagation, and stale-while-revalidate semantics.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { hasToken } from "./_transport/http";
import { services } from "./registry";
import type {
  AegisSnapshot,
  Decision,
  DecisionReplay,
  Device,
  DeviceProfile,
  RiskEvent,
} from "./aegis/aegis.contract";
import type {
  EnrollmentSample,
  EnrollmentSummary,
  LoginInput,
  RegisterInput,
  Session,
  VerifyOtpInput,
} from "./auth/auth.contract";
import type {
  Account,
  ActivityEvent,
  BankCard,
  Beneficiary,
  BudgetEnvelope,
  Currency,
  Holding,
  Insight,
  LoanRecord,
  Payment,
  SavingsGoal,
  StatementQuery,
  StatementSample,
  StatementYearGroup,
  Transaction,
  TransferInput,
  TransferResult,
} from "./banking/banking.contract";
import type {
  AdminAccount,
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
} from "./admin/admin.contract";
import type {
  AnalyticsResponse,
  DashboardNotification,
  DashboardSummary,
  NotificationFeed,
  TrendResponse,
} from "./dashboard/dashboard.contract";
import type {
  DeviceHealthResponse,
  LoginAnalytics,
  RiskEventFeed,
  SecurityOverview,
  SessionTimelineResponse,
} from "./security/security.contract";
import type {
  NotificationInbox,
  NotificationPreferences,
  PreferenceUpdateRequest,
} from "./notifications/notifications.contract";
import type {
  TrainingBatchRequest,
  TrainingFeatureBatchRequest,
  TrainingProgress,
  TrainingSessionComplete,
  TrainingSessionStart,
} from "./training/training.contract";

/* -------------------------------------------------------------------------- */
/* Behavioral authentication types                                            */
/* -------------------------------------------------------------------------- */

export interface BehavioralAuthenticationInput {
  dwellMeanMs: number;
  dwellStdMs: number;
  flightMeanMs: number;
  flightStdMs: number;
  velocityMean: number;
  accelerationMean: number;
  accelerationStd: number;
  curvatureMean: number;
  curvatureStd: number;
  clickCount: number;
  scrollAmount: number;
  mouseTravelPx: number;
}

export interface BehavioralAuthenticationResult {
  lightgbmScore: number;
  ocsvmAnomalyScore: number;
  fusedScore: number;
  decision: "ALLOW" | "WARN" | "CHALLENGE" | string;
}

export const queryKeys = {
  session: ["auth", "session"] as const,
  accounts: ["banking", "accounts"] as const,
  account: (id: string) => ["banking", "accounts", id] as const,
  transactions: (accountId?: string) => ["banking", "transactions", accountId ?? "all"] as const,
  beneficiaries: ["banking", "beneficiaries"] as const,
  cards: ["banking", "cards"] as const,
  payments: ["banking", "payments"] as const,
  savingsGoals: ["banking", "savings-goals"] as const,
  holdings: ["banking", "holdings"] as const,
  loans: ["banking", "loans"] as const,
  currencies: ["banking", "currencies"] as const,
  insights: ["banking", "insights"] as const,
  statementYears: ["banking", "statements", "years"] as const,
  statement: (q: StatementQuery) => ["banking", "statements", q.year, q.month] as const,
  activity: ["banking", "activity"] as const,
  budgets: ["banking", "budgets"] as const,
  disputes: ["banking", "disputes"] as const,
  aegisSnapshot: ["aegis", "snapshot"] as const,
  aegisDecisions: ["aegis", "decisions"] as const,
  aegisDevices: ["aegis", "devices"] as const,
  aegisRisk: ["aegis", "risk"] as const,
  aegisDeviceProfiles: ["aegis", "device-profiles"] as const,
  aegisDecisionReplays: ["aegis", "decision-replays"] as const,

  adminAccounts: ["admin", "accounts"] as const,
  adminAnomalySignatures: ["admin", "anomaly-signatures"] as const,
  adminKpis: ["admin", "kpis"] as const,
  adminGlobalMetrics: ["admin", "global-metrics"] as const,
  adminLiveSessions: ["admin", "live-sessions"] as const,
  adminUsers: ["admin", "users"] as const,
  adminIncidents: ["admin", "incidents"] as const,
  adminModels: ["admin", "models"] as const,
  adminDatasets: ["admin", "datasets"] as const,
  adminApiServices: ["admin", "api-services"] as const,
  adminControls: ["admin", "controls"] as const,
  adminReportTemplates: ["admin", "report-templates"] as const,
  adminAudit: ["admin", "audit"] as const,
  adminChallengeReasons: ["admin", "challenge-reasons"] as const,
  adminChallenges: ["admin", "challenges"] as const,
  adminRoles: ["admin", "roles"] as const,
  adminPermissions: ["admin", "permissions"] as const,
  adminRolePermissions: ["admin", "role-permissions"] as const,
  adminNotificationGroups: ["admin", "notification-groups"] as const,
  adminGeoDots: ["admin", "geo-dots"] as const,
  adminInfra: ["admin", "infra"] as const,

  // Dashboard
  dashboardSummary: ["dashboard", "summary"] as const,
  dashboardTrends: (period: string) => ["dashboard", "trends", period] as const,
  dashboardAnalytics: ["dashboard", "analytics"] as const,
  dashboardNotifications: ["dashboard", "notifications"] as const,

  // Security
  securityOverview: ["security", "overview"] as const,
  securityRiskEvents: (severity?: string) =>
    ["security", "risk-events", severity ?? "all"] as const,
  securityDeviceHealth: ["security", "device-health"] as const,
  securityLoginAnalytics: (periodDays?: number) =>
    ["security", "login-analytics", periodDays ?? 30] as const,
  securityDailyReport: (date?: string) => ["security", "daily-report", date ?? "latest"] as const,
  securitySessionTimeline: ["security", "session-timeline"] as const,

  // Behavioral authentication
  behavioralAuthentication: ["security", "behavioral-authentication"] as const,

  // Notifications
  notificationsInbox: (unreadOnly?: boolean) =>
    ["notifications", "inbox", unreadOnly ?? false] as const,
  notificationsPreferences: ["notifications", "preferences"] as const,
};

/* ---------------------------------------------------------------------------- */
/* Auth                                                                          */
/* ---------------------------------------------------------------------------- */

export function useSession(opts?: Omit<UseQueryOptions<Session | null>, "queryKey" | "queryFn">) {
  return useQuery<Session | null>({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => services.auth.getSession({ signal }),
    enabled: hasToken(),
    staleTime: 30_000,
    retry: 1,
    ...opts,
  });
}

export function useLogin(opts?: UseMutationOptions<Session, Error, LoginInput>) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => services.auth.login(input),
    onSuccess: (session) => qc.setQueryData(queryKeys.session, session),
    ...opts,
  });
}

export function useRegister(
  opts?: UseMutationOptions<{ challengeId: string }, Error, RegisterInput>,
) {
  return useMutation({
    mutationFn: (input: RegisterInput) => services.auth.register(input),
    ...opts,
  });
}

export function useVerifyOtp(opts?: UseMutationOptions<Session, Error, VerifyOtpInput>) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyOtpInput) => services.auth.verifyOtp(input),
    onSuccess: (session) => qc.setQueryData(queryKeys.session, session),
    ...opts,
  });
}

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => services.auth.logout(),
    onSuccess: () => {
      qc.clear();
      window.location.href = "/auth";
    },
  });
}

export function useSubmitEnrollment(
  opts?: UseMutationOptions<EnrollmentSummary, Error, ReadonlyArray<EnrollmentSample>>,
) {
  return useMutation({
    mutationFn: (samples) => services.auth.submitEnrollment(samples),
    ...opts,
  });
}

/* ---------------------------------------------------------------------------- */
/* Banking                                                                       */
/* ---------------------------------------------------------------------------- */

export function useAccounts() {
  return useQuery<ReadonlyArray<Account>>({
    queryKey: queryKeys.accounts,
    queryFn: ({ signal }) => services.banking.listAccounts({ signal }),
    enabled: hasToken(),
  });
}

export function useAccount(id: string) {
  return useQuery<Account>({
    queryKey: queryKeys.account(id),
    queryFn: ({ signal }) => services.banking.getAccount(id, { signal }),
    enabled: Boolean(id) && hasToken(),
  });
}

export function useTransactions(query: { accountId?: string; limit?: number } = {}) {
  return useQuery<ReadonlyArray<Transaction>>({
    queryKey: queryKeys.transactions(query.accountId),
    queryFn: ({ signal }) => services.banking.listTransactions(query, { signal }),
    enabled: hasToken(),
  });
}

export function useBeneficiaries() {
  return useQuery<ReadonlyArray<Beneficiary>>({
    queryKey: queryKeys.beneficiaries,
    queryFn: ({ signal }) => services.banking.listBeneficiaries({ signal }),
  });
}

export function useCards() {
  return useQuery<ReadonlyArray<BankCard>>({
    queryKey: queryKeys.cards,
    queryFn: ({ signal }) => services.banking.listCards({ signal }),
  });
}

export function usePayments() {
  return useQuery<ReadonlyArray<Payment>>({
    queryKey: queryKeys.payments,
    queryFn: ({ signal }) => services.banking.listPayments({ signal }),
  });
}

export function useSavingsGoals() {
  return useQuery<ReadonlyArray<SavingsGoal>>({
    queryKey: queryKeys.savingsGoals,
    queryFn: ({ signal }) => services.banking.listSavingsGoals({ signal }),
  });
}

export function useHoldings() {
  return useQuery<ReadonlyArray<Holding>>({
    queryKey: queryKeys.holdings,
    queryFn: ({ signal }) => services.banking.listHoldings({ signal }),
  });
}

export function useLoans() {
  return useQuery<ReadonlyArray<LoanRecord>>({
    queryKey: queryKeys.loans,
    queryFn: ({ signal }) => services.banking.listLoans({ signal }),
  });
}

export function useCurrencies() {
  return useQuery<ReadonlyArray<Currency>>({
    queryKey: queryKeys.currencies,
    queryFn: ({ signal }) => services.banking.listCurrencies({ signal }),
    staleTime: 60_000,
  });
}

export function useStatementYears() {
  return useQuery<ReadonlyArray<StatementYearGroup>>({
    queryKey: queryKeys.statementYears,
    queryFn: ({ signal }) => services.banking.listStatementYears({ signal }),
    staleTime: 60_000,
  });
}

export function useStatement(query: StatementQuery) {
  return useQuery<StatementSample>({
    queryKey: queryKeys.statement(query),
    queryFn: ({ signal }) => services.banking.getStatement(query, { signal }),
  });
}

export function useActivity() {
  return useQuery<ReadonlyArray<ActivityEvent>>({
    queryKey: queryKeys.activity,
    queryFn: ({ signal }) => services.banking.listActivity({ signal }),
  });
}

export function useBudgets() {
  return useQuery<ReadonlyArray<BudgetEnvelope>>({
    queryKey: queryKeys.budgets,
    queryFn: ({ signal }) => services.banking.listBudgets({ signal }),
  });
}

export function useInsights() {
  return useQuery<ReadonlyArray<Insight>>({
    queryKey: queryKeys.insights,
    queryFn: ({ signal }) => services.banking.listInsights({ signal }),
  });
}

export function useInitiateTransfer(
  opts?: UseMutationOptions<TransferResult, Error, TransferInput>,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: TransferInput) => services.banking.initiateTransfer(input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.accounts,
      });
      qc.invalidateQueries({
        queryKey: ["banking", "transactions"],
      });
      qc.invalidateQueries({
        queryKey: queryKeys.activity,
      });
    },
    ...opts,
  });
}

export function useFreezeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => services.banking.freezeCard(cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cards });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useUnfreezeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => services.banking.unfreezeCard(cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cards });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useUpdateCardLimits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, limits }: { cardId: string; limits: { daily?: number; monthly?: number; atm?: number } }) =>
      services.banking.updateCardLimits(cardId, limits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cards });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useChangeCardPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, pin }: { cardId: string; pin: string }) =>
      services.banking.changeCardPin(cardId, pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useAddBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (beneficiary: { name: string; iban: string; bank: string; category?: string; currency?: string }) =>
      services.banking.addBeneficiary(beneficiary),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beneficiaries });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.deleteBeneficiary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beneficiaries });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useVerifyBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.verifyBeneficiary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beneficiaries });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payment: { description: string; amount: number; currency: string; nextDate: string; frequency: string; beneficiary: string }) =>
      services.banking.createPayment(payment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function usePausePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.pausePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useResumePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.resumePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payments });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goal: { name: string; target: number; currency: string; deadline: string; image?: string }) =>
      services.banking.createSavingsGoal(goal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useContributeSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount, accountId }: { goalId: string; amount: number; accountId?: string }) =>
      services.banking.contributeSavingsGoal(goalId, amount, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: ["banking", "transactions"] });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useWithdrawSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount, accountId }: { goalId: string; amount: number; accountId?: string }) =>
      services.banking.withdrawSavingsGoal(goalId, amount, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: ["banking", "transactions"] });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.deleteSavingsGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savingsGoals });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (budget: { category: string; budgeted: number; currency: string; color?: string }) =>
      services.banking.createBudget(budget),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.banking.deleteBudget(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useExecuteExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { fromCurrency: string; toCurrency: string; fromAmount: number; fromAccountId?: string }) =>
      services.banking.executeExchange(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: ["banking", "transactions"] });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDisputes() {
  return useQuery({
    queryKey: queryKeys.disputes,
    queryFn: ({ signal }) => services.banking.listDisputes({ signal }),
    enabled: hasToken(),
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { transactionId: string; reason: string; explanation?: string }) =>
      services.banking.createDispute(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.disputes });
      qc.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

/* ---------------------------------------------------------------------------- */
/* Aegis                                                                         */
/* ---------------------------------------------------------------------------- */

export function useAegisSnapshot() {
  return useQuery<AegisSnapshot>({
    queryKey: queryKeys.aegisSnapshot,
    queryFn: ({ signal }) => services.aegis.getSnapshot({ signal }),
    enabled: hasToken(),
    staleTime: 1500,
  });
}

/** Live confidence stream — for the Security Strip and Aegis widget. */
export function useAegisLive(): AegisSnapshot | null {
  const [snap, setSnap] = useState<AegisSnapshot | null>(null);

  useEffect(() => {
    if (!hasToken()) return;
    let cancelled = false;

    services.aegis
      .getSnapshot()
      .then((s) => {
        if (!cancelled) setSnap(s);
      })
      .catch(() => {});

    const off = services.aegis.subscribeSnapshots((s) => {
      if (!cancelled) setSnap(s);
    });

    return () => {
      cancelled = true;
      off();
    };
  }, []);

  return snap;
}

export function useDecisions() {
  return useQuery<ReadonlyArray<Decision>>({
    queryKey: queryKeys.aegisDecisions,
    queryFn: ({ signal }) => services.aegis.listDecisions({ signal }),
    enabled: hasToken(),
  });
}

export function useDevices() {
  return useQuery<ReadonlyArray<Device>>({
    queryKey: queryKeys.aegisDevices,
    queryFn: ({ signal }) => services.aegis.listDevices({ signal }),
    enabled: hasToken(),
  });
}

export function useRiskEvents() {
  return useQuery<ReadonlyArray<RiskEvent>>({
    queryKey: queryKeys.aegisRisk,
    queryFn: ({ signal }) => services.aegis.listRiskEvents({ signal }),
    enabled: hasToken(),
  });
}

/* ---------------------------------------------------------------------------- */
/* Admin                                                                         */
/* ---------------------------------------------------------------------------- */

export function useDeviceProfiles() {
  return useQuery<ReadonlyArray<DeviceProfile>>({
    queryKey: queryKeys.aegisDeviceProfiles,
    queryFn: ({ signal }) => services.aegis.listDeviceProfiles({ signal }),
  });
}

export function useDecisionReplays() {
  return useQuery<ReadonlyArray<DecisionReplay>>({
    queryKey: queryKeys.aegisDecisionReplays,
    queryFn: ({ signal }) => services.aegis.listDecisionReplays({ signal }),
  });
}

export function useAdminKpis() {
  return useQuery<ReadonlyArray<Kpi>>({
    queryKey: queryKeys.adminKpis,
    queryFn: ({ signal }) => services.admin.listKpis({ signal }),
  });
}

export function useAdminGlobalMetrics() {
  return useQuery<ReadonlyArray<GlobalMetric>>({
    queryKey: queryKeys.adminGlobalMetrics,
    queryFn: ({ signal }) => services.admin.listGlobalMetrics({ signal }),
  });
}

export function useAdminLiveSessions() {
  return useQuery<ReadonlyArray<LiveSession>>({
    queryKey: queryKeys.adminLiveSessions,
    queryFn: ({ signal }) => services.admin.listLiveSessions({ signal }),
  });
}

export function useAdminUsers() {
  return useQuery<ReadonlyArray<AdminUser>>({
    queryKey: queryKeys.adminUsers,
    queryFn: ({ signal }) => services.admin.listUsers({ signal }),
  });
}

export function useAdminIncidents() {
  return useQuery<ReadonlyArray<Incident>>({
    queryKey: queryKeys.adminIncidents,
    queryFn: ({ signal }) => services.admin.listIncidents({ signal }),
  });
}

export function useAdminModels() {
  return useQuery<ReadonlyArray<ModelVersion>>({
    queryKey: queryKeys.adminModels,
    queryFn: ({ signal }) => services.admin.listModels({ signal }),
  });
}

export function useAdminDatasets() {
  return useQuery<ReadonlyArray<Dataset>>({
    queryKey: queryKeys.adminDatasets,
    queryFn: ({ signal }) => services.admin.listDatasets({ signal }),
  });
}

export function useAdminApiServices() {
  return useQuery<ReadonlyArray<ApiService>>({
    queryKey: queryKeys.adminApiServices,
    queryFn: ({ signal }) => services.admin.listApiServices({ signal }),
  });
}

export function useAdminControls() {
  return useQuery<ReadonlyArray<ComplianceControl>>({
    queryKey: queryKeys.adminControls,
    queryFn: ({ signal }) => services.admin.listControls({ signal }),
  });
}

export function useAdminReportTemplates() {
  return useQuery<ReadonlyArray<ReportTemplate>>({
    queryKey: queryKeys.adminReportTemplates,
    queryFn: ({ signal }) => services.admin.listReportTemplates({ signal }),
  });
}

export function useAdminAudit() {
  return useQuery<ReadonlyArray<AuditEntry>>({
    queryKey: queryKeys.adminAudit,
    queryFn: ({ signal }) => services.admin.listAudit({ signal }),
  });
}

export function useAdminChallengeReasons() {
  return useQuery<ReadonlyArray<ChallengeReason>>({
    queryKey: queryKeys.adminChallengeReasons,
    queryFn: ({ signal }) => services.admin.listChallengeReasons({ signal }),
  });
}

export function useAdminChallenges() {
  return useQuery<ReadonlyArray<ChallengeRecord>>({
    queryKey: queryKeys.adminChallenges,
    queryFn: ({ signal }) => services.admin.listChallenges({ signal }),
  });
}

export function useAdminRoles() {
  return useQuery<ReadonlyArray<Role>>({
    queryKey: queryKeys.adminRoles,
    queryFn: ({ signal }) => services.admin.listRoles({ signal }),
  });
}

export function useAdminPermissions() {
  return useQuery<ReadonlyArray<Permission>>({
    queryKey: queryKeys.adminPermissions,
    queryFn: ({ signal }) => services.admin.listPermissions({ signal }),
  });
}

export function useAdminRolePermissions() {
  return useQuery<Readonly<Record<string, ReadonlyArray<string>>>>({
    queryKey: queryKeys.adminRolePermissions,
    queryFn: ({ signal }) => services.admin.getRolePermissions({ signal }),
  });
}

export function useAdminNotificationGroups() {
  return useQuery<ReadonlyArray<NotificationGroup>>({
    queryKey: queryKeys.adminNotificationGroups,
    queryFn: ({ signal }) => services.admin.listNotificationGroups({ signal }),
  });
}

export function useAdminGeoDots() {
  return useQuery<ReadonlyArray<GeoDot>>({
    queryKey: queryKeys.adminGeoDots,
    queryFn: ({ signal }) => services.admin.listGeoDots({ signal }),
  });
}

export function useAdminInfra() {
  return useQuery<InfraSnapshot>({
    queryKey: queryKeys.adminInfra,
    queryFn: ({ signal }) => services.admin.getInfraSnapshot({ signal }),
  });
}

export function useAdminAccounts() {
  return useQuery<ReadonlyArray<AdminAccount>>({
    queryKey: queryKeys.adminAccounts,
    queryFn: ({ signal }) => services.admin.listAdminAccounts({ signal }),
  });
}

export function useAdminAnomalySignatures() {
  return useQuery<ReadonlyArray<AnomalySignature>>({
    queryKey: queryKeys.adminAnomalySignatures,
    queryFn: ({ signal }) => services.admin.listAnomalySignatures({ signal }),
  });
}

/* ---------------------------------------------------------------------------- */
/* Dashboard                                                                      */
/* ---------------------------------------------------------------------------- */

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: queryKeys.dashboardSummary,
    queryFn: ({ signal }) => services.dashboard.getSummary({ signal }),
    staleTime: 30_000,
  });
}

export function useDashboardTrends(period: "7d" | "30d" | "90d" = "30d") {
  return useQuery<TrendResponse>({
    queryKey: queryKeys.dashboardTrends(period),
    queryFn: ({ signal }) => services.dashboard.getTrends(period, { signal }),
    staleTime: 30_000,
  });
}

export function useDashboardAnalytics() {
  return useQuery<AnalyticsResponse>({
    queryKey: queryKeys.dashboardAnalytics,
    queryFn: ({ signal }) => services.dashboard.getAnalytics({ signal }),
    staleTime: 30_000,
  });
}

export function useDashboardNotifications() {
  return useQuery<NotificationFeed>({
    queryKey: queryKeys.dashboardNotifications,
    queryFn: ({ signal }) => services.dashboard.getNotifications({ signal }),
    staleTime: 15_000,
  });
}

/* ---------------------------------------------------------------------------- */
/* Security                                                                       */
/* ---------------------------------------------------------------------------- */

export function useSecurityOverview() {
  return useQuery<SecurityOverview>({
    queryKey: queryKeys.securityOverview,
    queryFn: ({ signal }) => services.security.getOverview({ signal }),
    enabled: hasToken(),
    staleTime: 15_000,
  });
}

export function useSecurityRiskEvents(severity?: string) {
  return useQuery<RiskEventFeed>({
    queryKey: queryKeys.securityRiskEvents(severity),
    queryFn: ({ signal }) =>
      services.security.getRiskEvents({
        severity,
        signal,
      }),
    enabled: hasToken(),
    staleTime: 15_000,
  });
}

export function useSecurityDeviceHealth() {
  return useQuery<DeviceHealthResponse>({
    queryKey: queryKeys.securityDeviceHealth,
    queryFn: ({ signal }) => services.security.getDeviceHealth({ signal }),
    enabled: hasToken(),
    staleTime: 60_000,
  });
}

export function useSecurityLoginAnalytics(periodDays?: number) {
  return useQuery<LoginAnalytics>({
    queryKey: queryKeys.securityLoginAnalytics(periodDays),
    queryFn: ({ signal }) =>
      services.security.getLoginAnalytics(periodDays, {
        signal,
      }),
    enabled: hasToken(),
    staleTime: 60_000,
  });
}

export function useSecurityDailyReport(date?: string) {
  return useQuery({
    queryKey: queryKeys.securityDailyReport(date),
    queryFn: ({ signal }) => services.security.getDailyReport(date, { signal }),
    enabled: hasToken(),
    staleTime: 300_000,
  });
}

export function useSecuritySessionTimeline() {
  return useQuery<SessionTimelineResponse>({
    queryKey: queryKeys.securitySessionTimeline,
    queryFn: ({ signal }) => services.security.getSessionTimeline({ signal }),
    enabled: hasToken(),
    staleTime: 15_000,
  });
}

/* ---------------------------------------------------------------------------- */
/* Behavioral Authentication                                                     */
/* ---------------------------------------------------------------------------- */

/**
 * Sends the 12 ML features to the backend behavioral-authentication
 * endpoint.
 *
 * Backend endpoint:
 * POST /api/v1/security/behavioral-authenticate
 *
 * The actual HTTP implementation is provided by services.security.
 */
export function useBehavioralAuthentication(
  opts?: UseMutationOptions<BehavioralAuthenticationResult, Error, BehavioralAuthenticationInput>,
) {
  return useMutation({
    mutationFn: (input) => services.security.behavioralAuthenticate(input),
    ...opts,
  });
}

/* ---------------------------------------------------------------------------- */
/* Notifications                                                                  */
/* ---------------------------------------------------------------------------- */

export function useNotifications(unreadOnly?: boolean, limit?: number, offset?: number) {
  return useQuery<NotificationInbox>({
    queryKey: queryKeys.notificationsInbox(unreadOnly),
    queryFn: ({ signal }) =>
      services.notifications.getInbox({
        unreadOnly,
        limit,
        offset,
        signal,
      }),
    staleTime: 15_000,
  });
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: queryKeys.notificationsPreferences,
    queryFn: ({ signal }) => services.notifications.getPreferences({ signal }),
    staleTime: 300_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services.notifications.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["notifications"],
      });
      qc.invalidateQueries({
        queryKey: ["dashboard", "notifications"],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => services.notifications.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["notifications"],
      });
      qc.invalidateQueries({
        queryKey: ["dashboard", "notifications"],
      });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: PreferenceUpdateRequest) => services.notifications.updatePreferences(data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.notificationsPreferences,
      });
    },
  });
}

/* ---------------------------------------------------------------------------- */
/* Behavioral collector                                                           */
/* ---------------------------------------------------------------------------- */

export {
  useBehavioralStatus,
  useBehavioralAuthenticationStatus,
  useBehavioralAuthenticating,
  useBehavioralLastError,
  useAuthenticateNow,
  useDismissedWarnScore,
  useDismissWarning,
  useChallengeClearedAt,
  useMarkChallengeCleared,
} from "./behavioral/BehavioralCollectorProvider";

/* ---------------------------------------------------------------------------- */
/* Training                                                                      */
/* ---------------------------------------------------------------------------- */

export function useTrainingProgress() {
  return useQuery<TrainingProgress>({
    queryKey: ["training", "progress"],
    queryFn: ({ signal }) => services.training.getProgress(),
    staleTime: 15_000,
  });
}

export function useStartTrainingSession(
  opts?: UseMutationOptions<{ sessionId: string; status: string }, Error, TrainingSessionStart>,
) {
  return useMutation({
    mutationFn: (input) => services.training.startSession(input),
    ...opts,
  });
}

export function useCompleteTrainingSession(
  opts?: UseMutationOptions<
    {
      sessionId: string;
      status: string;
      sampleCount: number;
    },
    Error,
    TrainingSessionComplete
  >,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input) => services.training.completeSession(input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["training", "progress"],
      });
    },
    ...opts,
  });
}

export function useSubmitTrainingBatch(
  opts?: UseMutationOptions<{ accepted: number; status: string }, Error, TrainingBatchRequest>,
) {
  return useMutation({
    mutationFn: (input) => services.training.submitBatch(input),
    ...opts,
  });
}

export function useSubmitTrainingFeatures(
  opts?: UseMutationOptions<
    { accepted: number; status: string },
    Error,
    TrainingFeatureBatchRequest
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => services.training.submitFeatures(input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["training", "progress"],
      });
    },
    ...opts,
  });
}

export function useResetTrainingProfile(
  opts?: UseMutationOptions<{ status: string; message: string }, Error, void>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => services.training.resetProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", "progress"] });
      qc.invalidateQueries({ queryKey: ["security"] });
    },
    ...opts,
  });
}

export function useEnrollTrainingProfile(
  opts?: UseMutationOptions<
    { status: string; message: string; samples_used?: number },
    Error,
    void
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => services.training.enrollProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", "progress"] });
      qc.invalidateQueries({ queryKey: ["security"] });
    },
    ...opts,
  });
}
