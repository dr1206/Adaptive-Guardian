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
// Behavioral authentication
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Backend wire shapes
// ---------------------------------------------------------------------------

interface BackendSecurityOverview {
  activeSessions: number;
  trustedDevices: number;
  flaggedEvents24h: number;
  // The backend has returned this as a comma-separated string
  // ("0.10,0.08,..."), a JSON array string, and a plain number[] at
  // different times — accept all three so a mapper crash can never break
  // the Security Center render.
  riskTrend: string | number[] | number | null | undefined;
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

interface BackendBehavioralAuthenticationResponse {
  lightgbmScore?: number;
  ocsvmAnomalyScore?: number;
  fusedScore?: number;
  decision?: string;
  // Accept snake_case too — a wire-format change must never silently
  // blank out the Security Center with undefined scores.
  lightgbm_score?: number;
  ocsvm_anomaly_score?: number;
  fused_score?: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function riskTrendToArray(trend: string | number[] | number | null | undefined): number[] {
  // Keyword form used by some backends.
  if (trend === "improving") return [30, 35, 40, 50, 55, 62, 70];
  if (trend === "stable") return [60, 62, 58, 63, 60, 65, 63];
  if (trend === "degrading") return [70, 68, 62, 55, 48, 40, 35];
  // Native array form.
  if (Array.isArray(trend)) {
    const nums = trend.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    return nums.length > 0 ? nums : [50, 50, 50, 50, 50, 50, 50];
  }
  if (typeof trend === "number" && Number.isFinite(trend)) return [trend];
  if (typeof trend !== "string" || trend.trim() === "") {
    return [50, 50, 50, 50, 50, 50, 50];
  }
  const s = trend.trim();
  // JSON array string, e.g. "[0.10,0.08,...]" — never crash on it.
  try {
    const parsed: unknown = JSON.parse(s);
    if (Array.isArray(parsed)) {
      const nums = parsed.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      if (nums.length > 0) return nums;
    } else if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return [parsed];
    }
  } catch {
    /* not JSON — try comma-separated */
  }
  const nums = s
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((v) => Number.isFinite(v));
  return nums.length > 0 ? nums : [50, 50, 50, 50, 50, 50, 50];
}

function mapSessionTimelineEvent(
  e: BackendSessionTimelineEvent,
): SessionTimelineEvent {
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

function mapReportSummary(
  s: BackendReportSummary,
): ReportSummary {
  return {
    logins: s.totalLogins,
    challenges: s.challengesIssued,
    flagged: s.failedLogins + s.blockedAttempts,
  };
}

function mapReportDevice(
  d: BackendReportDevice,
): ReportDevice {
  return {
    deviceId: d.deviceId,
    label: d.label,
    trust: d.trust,
    lastSeen: d.lastActive,
  };
}

function mapRiskEventItem(
  e: BackendRiskEventItem,
): RiskEventItem {
  return {
    id: e.id,
    occurredAt: e.occurredAt,
    severity: e.severity as RiskEventItem["severity"],
    summary: e.title,
    source: e.category,
    acknowledged: e.dismissed,
  };
}

function mapLocationBucket(
  l: BackendLocationBucket,
): LocationBucket {
  const parts = l.location.split(/,\s*/);

  return {
    city: parts[0] ?? l.location,
    country: parts[1] ?? "",
    count: l.count,
  };
}

function mapHourlyBucket(
  h: BackendHourlyBucket,
): HourlyBucket {
  return {
    hour: h.hour,
    count: h.count,
  };
}

function mapDeviceHealthItem(
  d: BackendDeviceHealthItem,
): DeviceHealthItem {
  return {
    deviceId: d.deviceId,
    label: d.label,
    trustScore: d.trustScore,
    sessions: d.sessionCount,
    lastSeen: d.lastActive,
    anomalies:
      d.recommendation === "revoke"
        ? 3
        : d.recommendation === "review"
          ? 1
          : 0,
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const httpSecurityService: SecurityService & {
  behavioralAuthenticate(
    input: BehavioralAuthenticationInput,
    options?: { signal?: AbortSignal },
  ): Promise<BehavioralAuthenticationResult>;
} = {
  // -------------------------------------------------------------------------
  // Security overview
  // -------------------------------------------------------------------------

  async getOverview({ signal } = {}) {
    const resp =
      await httpRequest<BackendSecurityOverview>(
        "/security/overview",
        { signal },
      );

    return {
      activeSessions: resp.activeSessions,
      trustedDevices: resp.trustedDevices,
      flaggedEvents24h: resp.flaggedEvents24h,
      riskTrend: riskTrendToArray(resp.riskTrend),
      lastAssessmentAt: resp.lastAssessmentAt,
    };
  },

  // -------------------------------------------------------------------------
  // Session timeline
  // -------------------------------------------------------------------------

  async getSessionTimeline({
    limit,
    offset,
    signal,
  } = {}) {
    const resp =
      await httpRequest<BackendSessionTimelineResponse>(
        "/security/session-timeline",
        {
          params: {
            limit,
            offset,
          },
          signal,
        },
      );

    return {
      events: resp.events.map(mapSessionTimelineEvent),
      total: resp.total,
    };
  },

  // -------------------------------------------------------------------------
  // Daily report
  // -------------------------------------------------------------------------

  async getDailyReport(
    date,
    { signal } = {},
  ) {
    const resp =
      await httpRequest<BackendDailySecurityReport>(
        "/security/reports/daily",
        {
          params: date
            ? {
                date,
              }
            : undefined,
          signal,
        },
      );

    return {
      date: resp.date,
      summary: mapReportSummary(resp.summary),
      activeDevices: resp.activeDevices.map(
        mapReportDevice,
      ),
      riskVerdict: resp.riskVerdict,
      generatedAt: resp.generatedAt,
    };
  },

  // -------------------------------------------------------------------------
  // Risk events
  // -------------------------------------------------------------------------

  async getRiskEvents({
    severity,
    limit,
    offset,
    signal,
  } = {}) {
    const resp =
      await httpRequest<BackendRiskEventFeed>(
        "/security/risk-events",
        {
          params: {
            severity,
            limit,
            offset,
          },
          signal,
        },
      );

    return {
      events: resp.events.map(mapRiskEventItem),
      total: resp.total,
      criticalCount: resp.criticalCount,
    };
  },

  // -------------------------------------------------------------------------
  // Login analytics
  // -------------------------------------------------------------------------

  async getLoginAnalytics(
    periodDays = 30,
    { signal } = {},
  ) {
    const resp =
      await httpRequest<BackendLoginAnalytics>(
        "/security/login-analytics",
        {
          params: {
            periodDays,
          },
          signal,
        },
      );

    return {
      totalLogins: resp.totalLogins,
      uniqueDevices: resp.uniqueDevices,
      uniqueLocations: resp.uniqueLocations,
      hourlyDistribution:
        resp.hourlyDistribution.map(
          mapHourlyBucket,
        ),
      byLocation:
        resp.byLocation.map(mapLocationBucket),
      periodDays: resp.periodDays,
    };
  },

  // -------------------------------------------------------------------------
  // Device health
  // -------------------------------------------------------------------------

  async getDeviceHealth({ signal } = {}) {
    const resp =
      await httpRequest<BackendDeviceHealthResponse>(
        "/security/device-health",
        {
          signal,
        },
      );

    return {
      devices: resp.devices.map(
        mapDeviceHealthItem,
      ),
      flagged: resp.flagged,
    };
  },

  // -------------------------------------------------------------------------
// Behavioral authentication
// -------------------------------------------------------------------------

async behavioralAuthenticate(
  input,
  { signal } = {},
) {
  const resp =
    await httpRequest<BackendBehavioralAuthenticationResponse>(
      "/security/behavioral-authenticate",
      {
        method: "POST",
        body: {
          dwell_mean_ms: input.dwellMeanMs,
          dwell_std_ms: input.dwellStdMs,
          flight_mean_ms: input.flightMeanMs,
          flight_std_ms: input.flightStdMs,
          velocity_mean: input.velocityMean,
          acceleration_mean: input.accelerationMean,
          acceleration_std: input.accelerationStd,
          curvature_mean: input.curvatureMean,
          curvature_std: input.curvatureStd,
          click_count: input.clickCount,
          scroll_amount: input.scrollAmount,
          mouse_travel_px: input.mouseTravelPx,
          keys_per_sec: input.keysPerSec,
          velocity_std: input.velocityStd,
        },
        signal,
      },
    );

  // The backend serializes with camelCase aliases; accept snake_case too so
  // a wire-format change can never silently blank the Security Center.
  const lightgbmScore =
    resp.lightgbmScore ?? resp.lightgbm_score ?? 0;
  const ocsvmAnomalyScore =
    resp.ocsvmAnomalyScore ?? resp.ocsvm_anomaly_score ?? 0;
  const fusedScore = resp.fusedScore ?? resp.fused_score ?? 0;

  return {
    lightgbmScore,
    ocsvmAnomalyScore,
    fusedScore,
    decision: resp.decision ?? "WAITING",
  };
},
};