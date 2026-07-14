/**
 * Dashboard domain contract.
 */

export interface SummaryCard {
  value: string;
  label: string;
  delta: number;
  deltaGood: boolean;
  spark: number[];
}

export interface DashboardSummary {
  totalBalance: SummaryCard;
  savingsBalance: SummaryCard;
  pendingCount: SummaryCard;
  securityScore: SummaryCard;
  accountsCount: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendSeries {
  id: string;
  label: string;
  color: string;
  points: TrendPoint[];
}

export interface TrendResponse {
  series: TrendSeries[];
  period: string;
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
  color: string;
}

export interface AnalyticsResponse {
  totalSpent: number;
  totalReceived: number;
  topCategories: CategorySlice[];
  periodDays: number;
}

export interface DashboardNotification {
  id: string;
  type: "security" | "insight" | "banking" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationFeed {
  items: DashboardNotification[];
  unreadCount: number;
}

export interface DashboardService {
  getSummary(opts?: { signal?: AbortSignal }): Promise<DashboardSummary>;
  getTrends(period: "7d" | "30d" | "90d", opts?: { signal?: AbortSignal }): Promise<TrendResponse>;
  getAnalytics(opts?: { signal?: AbortSignal }): Promise<AnalyticsResponse>;
  getNotifications(opts?: { signal?: AbortSignal }): Promise<NotificationFeed>;
}
