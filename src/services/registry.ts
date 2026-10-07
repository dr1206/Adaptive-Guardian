/**
 * Service registry.
 *
 * Resolves domain services to concrete implementations at module load time.
 *
 * Mocks    → VITE_USE_REAL_API unset or "false" (dev preview, Lovable export).
 * HTTP     → VITE_USE_REAL_API=true (local Claude backend on :8000).
 *
 * The registry is intentionally synchronous — no async init, no DI framework —
 * so components can call `services.banking.listAccounts()` without lifecycle
 * ceremony. Mocks resolve as Promises so the signature matches the HTTP impl.
 */

import { loadClientEnv } from "../lib/platform/env";
import { createLogger } from "../lib/platform/logger";

import type { AuthService } from "./auth/auth.contract";
import type { BankingService } from "./banking/banking.contract";
import type { AegisService } from "./aegis/aegis.contract";
import type { AdminService } from "./admin/admin.contract";
import type { DashboardService } from "./dashboard/dashboard.contract";
import type { BehavioralAuthenticationInput, SecurityService } from "./security/security.contract";
import type { NotificationsService } from "./notifications/notifications.contract";
import type { AuditService } from "./audit/audit.contract";
import type { TrainingService } from "./training/training.contract";

import { mockAuthService } from "./auth/auth.mock";
import { mockBankingService } from "./banking/banking.mock";
import { mockAegisService } from "./aegis/aegis.mock";
import { mockAdminService } from "./admin/admin.mock";

import { httpAuthService } from "./auth/auth.http";
import { httpBankingService } from "./banking/banking.http";
import { httpAegisService } from "./aegis/aegis.http";
import { httpAdminService } from "./admin/admin.http";
import { httpDashboardService } from "./dashboard/dashboard.http";
import { httpSecurityService } from "./security/security.http";
import { httpNotificationsService } from "./notifications/notifications.http";
import { httpAuditService } from "./audit/audit.http";
import { httpTrainingService } from "./training/training.http";
import { mockTrainingService } from "./training/training.mock";

const log = createLogger({ service: "services" });

export type ServiceMode = "mock" | "http";

export interface Services {
  auth: AuthService;
  banking: BankingService;
  aegis: AegisService;
  admin: AdminService;
  dashboard: DashboardService;
  security: SecurityService;
  notifications: NotificationsService;
  audit: AuditService;
  training: TrainingService;
}

function resolveMode(): ServiceMode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (import.meta as any).env ?? {};
  return meta.VITE_USE_REAL_API === "true" ? "http" : "mock";
}

const mode: ServiceMode = resolveMode();
const env = loadClientEnv();

if (mode === "http") {
  log.info(
    {
      event: "services.boot",
      payload: {
        mode,
        env: env.appEnv,
      },
    },
    "Real HTTP services — backend at http://localhost:8000",
  );
} else {
  log.info(
    {
      event: "services.boot",
      payload: {
        mode,
        env: env.appEnv,
      },
    },
    "Mock services — set VITE_USE_REAL_API=true for real backend",
  );
}

// ---------------------------------------------------------------------------
// Mock dashboard / security / notifications / audit
// ---------------------------------------------------------------------------

const mockDashboardService: DashboardService = {
  async getSummary() {
    return {
      totalBalance: {
        value: "$224,694",
        label: "Total Balance",
        delta: 3.2,
        deltaGood: true,
        spark: [50, 55, 52, 60, 58, 63],
      },
      savingsBalance: {
        value: "$138,900",
        label: "Savings",
        delta: 5.8,
        deltaGood: true,
        spark: [40, 42, 45, 47, 50, 52],
      },
      pendingCount: {
        value: "3",
        label: "Pending",
        delta: -1,
        deltaGood: false,
        spark: [1, 2, 3, 4, 3, 3],
      },
      securityScore: {
        value: "92",
        label: "Security Score",
        delta: 4,
        deltaGood: true,
        spark: [85, 87, 88, 90, 91, 92],
      },
      accountsCount: 4,
    };
  },

  async getTrends() {
    return {
      series: [],
      period: "7d",
    };
  },

  async getAnalytics() {
    return {
      totalSpent: 0,
      totalReceived: 0,
      topCategories: [],
      periodDays: 30,
    };
  },

  async getNotifications() {
    return {
      items: [],
      unreadCount: 0,
    };
  },
};

const mockSecurityService: SecurityService = {
  async getOverview() {
    return {
      activeSessions: 1,
      trustedDevices: 1,
      flaggedEvents24h: 0,
      riskTrend: [],
      lastAssessmentAt: new Date().toISOString(),
    };
  },

  async getSessionTimeline() {
    return {
      events: [],
      total: 0,
    };
  },

  async getDailyReport() {
    return {
      date: "",
      summary: {
        logins: 0,
        challenges: 0,
        flagged: 0,
      },
      activeDevices: [],
      riskVerdict: "low",
      generatedAt: "",
    };
  },

  async getRiskEvents() {
    return {
      events: [],
      total: 0,
      criticalCount: 0,
    };
  },

  async getLoginAnalytics() {
    return {
      totalLogins: 0,
      uniqueDevices: 0,
      uniqueLocations: 0,
      hourlyDistribution: [],
      byLocation: [],
      periodDays: 30,
    };
  },

  async getDeviceHealth() {
    return {
      devices: [],
      flagged: 0,
    };
  },

  // Mock implementation used only when VITE_USE_REAL_API=false.
  async behavioralAuthenticate(_input: BehavioralAuthenticationInput) {
    return {
      lightgbmScore: 0.05,
      ocsvmAnomalyScore: 0.05,
      fusedScore: 0.05,
      decision: "ALLOW" as const,
    };
  },
};

const mockNotificationsService: NotificationsService = {
  async getInbox() {
    return {
      items: [],
      total: 0,
      unreadCount: 0,
    };
  },

  async markRead() {},

  async markAllRead() {},

  async getPreferences() {
    return {
      channels: ["push"],
      categories: {},
      quietHoursEnabled: false,
      quietStart: "22:00",
      quietEnd: "07:00",
    };
  },

  async updatePreferences(data) {
    return {
      channels: ["push"],
      categories: {},
      quietHoursEnabled: false,
      quietStart: "22:00",
      quietEnd: "07:00",
      ...data,
    };
  },
};

const mockAuditService: AuditService = {
  async queryEntries() {
    return {
      entries: [],
      total: 0,
    };
  },

  async getSummary() {
    return {
      items: [],
      totalEntries: 0,
      periodHours: 24,
    };
  },
};

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const services: Services =
  mode === "http"
    ? {
        auth: httpAuthService,
        banking: httpBankingService,
        aegis: httpAegisService,
        admin: httpAdminService,
        dashboard: httpDashboardService,
        security: httpSecurityService,
        notifications: httpNotificationsService,
        audit: httpAuditService,
        training: httpTrainingService,
      }
    : {
        auth: mockAuthService,
        banking: mockBankingService,
        aegis: mockAegisService,
        admin: mockAdminService,
        dashboard: mockDashboardService,
        security: mockSecurityService,
        notifications: mockNotificationsService,
        audit: mockAuditService,
        training: mockTrainingService,
      };

export function getServiceMode(): ServiceMode {
  return mode;
}
