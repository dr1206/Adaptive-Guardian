/**
 * Security HTTP adapter — maps backend responses to frontend contract types.
 */

import { httpRequest } from "../_transport/http";
import type {
  DailySecurityReport,
  DeviceHealthItem,
  DeviceHealthResponse,
  HourlyBucket,
  LocationBucket,
  LoginAnalytics,
  ReportDevice,
  ReportSummary,
  RiskEventFeed,
  RiskEventItem,
  SecurityOverview,
  SecurityService,
  SessionTimelineEvent,
  SessionTimelineResponse,
} from "./security.contract";

// ---------------------------------------------------------------------------
// Backend wire shapes (camelCase after serialization_alias)
// ---------------------------------------------------------------------------

interface BackendSecurityOverview {
  activeSessions: number;
  trustedDevices: number;
  flaggedEvents24h: number;
  riskTrend: string; // improving, stable, degrading
  lastAssessmentAt: string;
}

interface BackendSessionTimelineEvent {
  sessionId: string;
  event: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  riskScore: number | null;
  riskVerdict: string | null;
  occurredAt: string;
}

interface BackendSessionTimelineResponse {
  events: BackendSessionTimelineEvent[];
  total: number;
}

interface BackendReportSummary {
  totalLogins: number;
  failedLogins: number;
  newDevices: number;
  challengesIssued: number;
  blockedAttempts: number;
}

interface BackendReportDevice {
  deviceId: string;
  label: string;
  trust: string;
  lastActive: string;
}

interface BackendDailySecurityReport {
  date: string;
  summary: BackendReportSummary;
  activeDevices: BackendReportDevice[];
  riskVerdict: string;
  generatedAt: string;
}

interface BackendRiskEventItem {
  id: string;
  severity: string;
  category: string;
  title: string;
  detail: string;
  sessionId: string | null;
  deviceId: string | null;
  occurredAt: string;
  dismissed: boolean;
}

interface BackendRiskEventFeed {
  events: BackendRiskEventItem[];
  total: number;
  criticalCount: number;
}

interface BackendHourlyBucket {
  hour: number;
  count: number;
}

interface BackendLocationBucket {
  location: string;
  count: number;
  risk: string;
}

interface BackendLoginAnalytics {
  totalLogins: number;
  uniqueDevices: number;
  uniqueLocations: number;
  hourlyDistribution: BackendHourlyBucket[];
  byLocation: BackendLocationBucket[];
  periodDays: number;
}

interface BackendDeviceHealthItem {
  deviceId: string;
  label: string;
  trustScore: number;
  sessionCount: number;
  lastActive: string;
  recommendation: string;
}

interface BackendDeviceHealthResponse {
  devices: BackendDeviceHealthItem[];
  flagged: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function riskTrendToArray(trend: string): number[] {
  switch (trend) {
    case "improving": return [30, 35, 40, 50, 55, 62, 70];
    case "stable": return [60, 62, 58, 63, 60, 65, 63];
    case "degrading": return [70, 68, 62, 55, 48, 40, 35];
    default: return [50, 50, 50, 50, 50, 50, 50];
  }
}

function mapSessionTimelineEvent(e: BackendSessionTimelineEvent): SessionTimelineEvent {
  return {
    sessionId: e.sessionId,
    event: e.event,
    ipAddress: e.ipAddress,
    deviceLabel: e.deviceLabel,
    location: e.location,
    riskScore: e.riskScore,
    riskVerdict: e.riskVerdict,
    occurredAt: e.occurredAt,
  };
}

function mapReportSummary(s: BackendReportSummary): ReportSummary {
  return {
    logins: s.totalLogins,
    challenges: s.challengesIssued,
    flagged: s.failedLogins + s.blockedAttempts,
  };
}

function mapReportDevice(d: BackendReportDevice): ReportDevice {
  return {
    deviceId: d.deviceId,
    label: d.label,
    trust: d.trust,
    lastSeen: d.lastActive,
  };
}

function mapRiskEventItem(e: BackendRiskEventItem): RiskEventItem {
  return {
    id: e.id,
    occurredAt: e.occurredAt,
    severity: e.severity as RiskEventItem["severity"],
    summary: e.title,
    source: e.category,
    acknowledged: e.dismissed,
  };
}

function mapLocationBucket(l: BackendLocationBucket): LocationBucket {
  const parts = l.location.split(/,\s*/);
  return {
    city: parts[0] ?? l.location,
    country: parts[1] ?? "",
    count: l.count,
  };
}

function mapHourlyBucket(h: BackendHourlyBucket): HourlyBucket {
  return { hour: h.hour, count: h.count };
}

function mapDeviceHealthItem(d: BackendDeviceHealthItem): DeviceHealthItem {
  return {
    deviceId: d.deviceId,
    label: d.label,
    trustScore: d.trustScore,
    sessions: d.sessionCount,
    lastSeen: d.lastActive,
    anomalies: d.recommendation === "revoke" ? 3 : d.recommendation === "review" ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const httpSecurityService: SecurityService = {
  async getOverview({ signal } = {}) {
    const resp = await httpRequest<BackendSecurityOverview>("/security/overview", { signal });
    return {
      activeSessions: resp.activeSessions,
      trustedDevices: resp.trustedDevices,
      flaggedEvents24h: resp.flaggedEvents24h,
      riskTrend: riskTrendToArray(resp.riskTrend),
      lastAssessmentAt: resp.lastAssessmentAt,
    };
  },

  async getSessionTimeline({ limit, offset, signal } = {}) {
    const resp = await httpRequest<BackendSessionTimelineResponse>("/security/session-timeline", {
      params: { limit, offset },
      signal,
    });
    return {
      events: resp.events.map(mapSessionTimelineEvent),
      total: resp.total,
    };
  },

  async getDailyReport(date, { signal } = {}) {
    const resp = await httpRequest<BackendDailySecurityReport>("/security/reports/daily", {
      params: date ? { date } : undefined,
      signal,
    });
    return {
      date: resp.date,
      summary: mapReportSummary(resp.summary),
      activeDevices: resp.activeDevices.map(mapReportDevice),
      riskVerdict: resp.riskVerdict,
      generatedAt: resp.generatedAt,
    };
  },

  async getRiskEvents({ severity, limit, offset, signal } = {}) {
    const resp = await httpRequest<BackendRiskEventFeed>("/security/risk-events", {
      params: { severity, limit, offset },
      signal,
    });
    return {
      events: resp.events.map(mapRiskEventItem),
      total: resp.total,
      criticalCount: resp.criticalCount,
    };
  },

  async getLoginAnalytics(periodDays = 30, { signal } = {}) {
    const resp = await httpRequest<BackendLoginAnalytics>("/security/login-analytics", {
      params: { periodDays },
      signal,
    });
    return {
      totalLogins: resp.totalLogins,
      uniqueDevices: resp.uniqueDevices,
      uniqueLocations: resp.uniqueLocations,
      hourlyDistribution: resp.hourlyDistribution.map(mapHourlyBucket),
      byLocation: resp.byLocation.map(mapLocationBucket),
      periodDays: resp.periodDays,
    };
  },

  async getDeviceHealth({ signal } = {}) {
    const resp = await httpRequest<BackendDeviceHealthResponse>("/security/device-health", { signal });
    return {
      devices: resp.devices.map(mapDeviceHealthItem),
      flagged: resp.flagged,
    };
  },
};
