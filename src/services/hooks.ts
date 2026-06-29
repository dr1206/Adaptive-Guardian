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

import { services } from "./registry";
import type {
  AegisSnapshot,
  Decision,
  Device,
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
  BankCard,
  Beneficiary,
  Currency,
  Holding,
  Insight,
  LoanRecord,
  Payment,
  SavingsGoal,
  Transaction,
  TransferInput,
  TransferResult,
} from "./banking/banking.contract";
import type {
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
} from "./admin/admin.contract";


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
  aegisSnapshot: ["aegis", "snapshot"] as const,
  aegisDecisions: ["aegis", "decisions"] as const,
  aegisDevices: ["aegis", "devices"] as const,
  aegisRisk: ["aegis", "risk"] as const,
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

};

// ----------------------------------------------------------------------------
// Auth
// ----------------------------------------------------------------------------

export function useSession(opts?: Omit<UseQueryOptions<Session | null>, "queryKey" | "queryFn">) {
  return useQuery<Session | null>({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => services.auth.getSession({ signal }),
    staleTime: 30_000,
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
      qc.setQueryData(queryKeys.session, null);
      qc.invalidateQueries();
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

// ----------------------------------------------------------------------------
// Banking
// ----------------------------------------------------------------------------

export function useAccounts() {
  return useQuery<ReadonlyArray<Account>>({
    queryKey: queryKeys.accounts,
    queryFn: ({ signal }) => services.banking.listAccounts({ signal }),
  });
}

export function useAccount(id: string) {
  return useQuery<Account>({
    queryKey: queryKeys.account(id),
    queryFn: ({ signal }) => services.banking.getAccount(id, { signal }),
    enabled: Boolean(id),
  });
}

export function useTransactions(query: { accountId?: string; limit?: number } = {}) {
  return useQuery<ReadonlyArray<Transaction>>({
    queryKey: queryKeys.transactions(query.accountId),
    queryFn: ({ signal }) => services.banking.listTransactions(query, { signal }),
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
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: ["banking", "transactions"] });
    },
    ...opts,
  });
}

// ----------------------------------------------------------------------------
// Aegis
// ----------------------------------------------------------------------------

export function useAegisSnapshot() {
  return useQuery<AegisSnapshot>({
    queryKey: queryKeys.aegisSnapshot,
    queryFn: ({ signal }) => services.aegis.getSnapshot({ signal }),
    staleTime: 1500,
  });
}

/** Live confidence stream — for the Security Strip and Aegis widget. */
export function useAegisLive(): AegisSnapshot | null {
  const [snap, setSnap] = useState<AegisSnapshot | null>(null);
  useEffect(() => {
    let cancelled = false;
    services.aegis.getSnapshot().then((s) => {
      if (!cancelled) setSnap(s);
    });
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
  });
}

export function useDevices() {
  return useQuery<ReadonlyArray<Device>>({
    queryKey: queryKeys.aegisDevices,
    queryFn: ({ signal }) => services.aegis.listDevices({ signal }),
  });
}

export function useRiskEvents() {
  return useQuery<ReadonlyArray<RiskEvent>>({
    queryKey: queryKeys.aegisRisk,
    queryFn: ({ signal }) => services.aegis.listRiskEvents({ signal }),
  });
}

// ----------------------------------------------------------------------------
// Admin
// ----------------------------------------------------------------------------

export function useAdminUsers() {
  return useQuery<ReadonlyArray<AdminUser>>({
    queryKey: queryKeys.adminUsers,
    queryFn: ({ signal }) => services.admin.listUsers({ signal }),
  });
}
export function useAdminSessions() {
  return useQuery<ReadonlyArray<AdminSession>>({
    queryKey: queryKeys.adminSessions,
    queryFn: ({ signal }) => services.admin.listSessions({ signal }),
  });
}
export function useAdminModels() {
  return useQuery<ReadonlyArray<ModelInfo>>({
    queryKey: queryKeys.adminModels,
    queryFn: ({ signal }) => services.admin.listModels({ signal }),
  });
}
export function useAdminAudit() {
  return useQuery<ReadonlyArray<AuditEvent>>({
    queryKey: queryKeys.adminAudit,
    queryFn: ({ signal }) => services.admin.listAudit({ signal }),
  });
}
