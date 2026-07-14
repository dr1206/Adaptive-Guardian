/**
 * Dashboard HTTP adapter — maps backend responses to frontend contract types.
 */

import { httpRequest } from "../_transport/http";
import type {
  AnalyticsResponse,
  CategorySlice,
  DashboardNotification,
  DashboardService,
  DashboardSummary,
  NotificationFeed,
  SummaryCard,
  TrendPoint,
  TrendResponse,
  TrendSeries,
} from "./dashboard.contract";

// ---------------------------------------------------------------------------
// Backend wire shapes (camelCase after serialization_alias)
// ---------------------------------------------------------------------------

interface BackendSummaryCard {
  label: string;
  value: string;
  delta: string | null;
  tone: string; // up, down, neutral, warn
}

interface BackendDashboardSummary {
  totalBalance: BackendSummaryCard;
  savingsBalance: BackendSummaryCard;
  pendingCount: BackendSummaryCard;
  securityScore: BackendSummaryCard;
  accountsCount: number;
}

interface BackendTrendPoint {
  date: string;
  value: number;
  label: string | null;
}

interface BackendTrendSeries {
  key: string;
  label: string;
  color: string;
  points: BackendTrendPoint[];
}

interface BackendTrendResponse {
  series: BackendTrendSeries[];
  period: string;
}

interface BackendCategorySlice {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

interface BackendAnalyticsResponse {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categories: BackendCategorySlice[];
  currency: string;
}

interface BackendDashboardNotification {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  actionLabel: string | null;
  actionPath: string | null;
  createdAt: string;
  read: boolean;
}

interface BackendNotificationFeed {
  notifications: BackendDashboardNotification[];
  unread: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSummaryCard(c: BackendSummaryCard): SummaryCard {
  const delta = c.delta != null ? parseFloat(c.delta) : 0;
  return {
    value: c.value,
    label: c.label,
    delta,
    deltaGood: c.tone === "up" ? delta >= 0 : c.tone === "down" ? delta < 0 : true,
    spark: [],
  };
}

function mapTrendPoint(p: BackendTrendPoint): TrendPoint {
  return { date: p.date, value: p.value };
}

function mapTrendSeries(s: BackendTrendSeries): TrendSeries {
  return {
    id: s.key,
    label: s.label,
    color: s.color,
    points: s.points.map(mapTrendPoint),
  };
}

function mapCategorySlice(c: BackendCategorySlice): CategorySlice {
  return {
    category: c.category,
    amount: c.amount,
    pct: c.percentage,
    color: c.color,
  };
}

function mapDashboardNotification(n: BackendDashboardNotification): DashboardNotification {
  return {
    id: n.id,
    type: n.type as DashboardNotification["type"],
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const httpDashboardService: DashboardService = {
  async getSummary({ signal } = {}) {
    const resp = await httpRequest<BackendDashboardSummary>("/dashboard/summary", { signal });
    return {
      totalBalance: mapSummaryCard(resp.totalBalance),
      savingsBalance: mapSummaryCard(resp.savingsBalance),
      pendingCount: mapSummaryCard(resp.pendingCount),
      securityScore: mapSummaryCard(resp.securityScore),
      accountsCount: resp.accountsCount,
    };
  },

  async getTrends(period, { signal } = {}) {
    const resp = await httpRequest<BackendTrendResponse>("/dashboard/trends", {
      params: { period },
      signal,
    });
    return {
      series: resp.series.map(mapTrendSeries),
      period: resp.period,
    };
  },

  async getAnalytics({ signal } = {}) {
    const resp = await httpRequest<BackendAnalyticsResponse>("/dashboard/analytics", { signal });
    return {
      totalSpent: resp.totalExpenses,
      totalReceived: resp.totalIncome,
      topCategories: resp.categories.map(mapCategorySlice),
      periodDays: 30,
    };
  },

  async getNotifications({ signal } = {}) {
    const resp = await httpRequest<BackendNotificationFeed>("/dashboard/notifications", { signal });
    return {
      items: resp.notifications.map(mapDashboardNotification),
      unreadCount: resp.unread,
    };
  },
};
