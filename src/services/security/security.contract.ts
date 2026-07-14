/**
 * Security domain contract.
 */

export interface SecurityOverview {
  activeSessions: number;
  trustedDevices: number;
  flaggedEvents24h: number;
  riskTrend: number[];
  lastAssessmentAt: string;
}

export interface SessionTimelineEvent {
  sessionId: string;
  event: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  riskScore: number | null;
  riskVerdict: string | null;
  occurredAt: string;
}

export interface SessionTimelineResponse {
  events: SessionTimelineEvent[];
  total: number;
}

export interface ReportDevice {
  deviceId: string;
  label: string;
  trust: string;
  lastSeen: string;
}

export interface ReportSummary {
  logins: number;
  challenges: number;
  flagged: number;
}

export interface DailySecurityReport {
  date: string;
  summary: ReportSummary;
  activeDevices: ReportDevice[];
  riskVerdict: string;
  generatedAt: string;
}

export interface RiskEventItem {
  id: string;
  occurredAt: string;
  severity: "info" | "warn" | "critical";
  summary: string;
  source: string;
  acknowledged: boolean;
}

export interface RiskEventFeed {
  events: RiskEventItem[];
  total: number;
  criticalCount: number;
}

export interface HourlyBucket {
  hour: number;
  count: number;
}

export interface LocationBucket {
  city: string;
  country: string;
  count: number;
}

export interface LoginAnalytics {
  totalLogins: number;
  uniqueDevices: number;
  uniqueLocations: number;
  hourlyDistribution: HourlyBucket[];
  byLocation: LocationBucket[];
  periodDays: number;
}

export interface DeviceHealthItem {
  deviceId: string;
  label: string;
  trustScore: number;
  sessions: number;
  lastSeen: string;
  anomalies: number;
}

export interface DeviceHealthResponse {
  devices: DeviceHealthItem[];
  flagged: number;
}

export interface SecurityService {
  getOverview(opts?: { signal?: AbortSignal }): Promise<SecurityOverview>;
  getSessionTimeline(opts?: {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }): Promise<SessionTimelineResponse>;
  getDailyReport(date?: string, opts?: { signal?: AbortSignal }): Promise<DailySecurityReport>;
  getRiskEvents(opts?: {
    severity?: string;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }): Promise<RiskEventFeed>;
  getLoginAnalytics(periodDays?: number, opts?: { signal?: AbortSignal }): Promise<LoginAnalytics>;
  getDeviceHealth(opts?: { signal?: AbortSignal }): Promise<DeviceHealthResponse>;
}
