/**
 * Aegis HTTP adapter — calls the real backend and maps responses to the
 * frontend AegisService contract shape.
 */

import { httpRequest } from "../_transport/http";
import type {
  AegisService,
  AegisSnapshot,
  Decision,
  DecisionReplay,
  Device,
  DeviceProfile,
  FeatureWindow,
  RiskEvent,
} from "./aegis.contract";

// ---------------------------------------------------------------------------
// Backend wire shapes
// ---------------------------------------------------------------------------

interface BackendSnapshot {
  confidence: number;
  risk: number;
  whisper: string;
  observedAt: string;
  trend: number[];
}

interface BackendDecision {
  id: string;
  occurredAt: string;
  action: string;
  reason: string;
  topFeatures: Array<{ name: string; contribution: number }>;
}

interface BackendDecisionReplay {
  id: string;
  time: string;
  title: string;
  outcome: string;
  confidence: number;
  petals: Array<{ label: string; weight: number; sentence: string }>;
}

interface BackendAegisDevice {
  id: string;
  label: string;
  os: string;
  trust: string;
  lastSeenAt: string;
  city: string;
}

interface BackendDeviceProfile {
  id: string;
  name: string;
  kind: string;
  os: string;
  browser: string;
  location: string;
  lastActive: string;
  confidence: number;
  trust: number;
  primary?: boolean;
}

interface BackendRiskEvent {
  id: string;
  occurredAt: string;
  severity: string;
  summary: string;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

let snapshotSubscriptions: Array<(s: AegisSnapshot) => void> = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    try {
      const snap = await httpRequest<BackendSnapshot>("/aegis/snapshot");
      const mapped: AegisSnapshot = {
        confidence: snap.confidence,
        risk: snap.risk,
        whisper: snap.whisper,
        observedAt: snap.observedAt,
        trend: snap.trend,
      };
      for (const handler of snapshotSubscriptions) {
        handler(mapped);
      }
    } catch {
      // Polling errors are silent
    }
  }, 2000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export const httpAegisService: AegisService = {
  async getSnapshot({ signal } = {}) {
    const snap = await httpRequest<BackendSnapshot>("/aegis/snapshot", { signal });
    return {
      confidence: typeof snap.confidence === "number" ? snap.confidence : 0,
      risk:
        typeof snap.risk === "number"
          ? snap.risk
          : 1 - (typeof snap.confidence === "number" ? snap.confidence : 0),
      whisper: typeof snap.whisper === "string" ? snap.whisper : "",
      observedAt: typeof snap.observedAt === "string" ? snap.observedAt : new Date().toISOString(),
      trend: Array.isArray(snap.trend)
        ? snap.trend.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
        : [],
    };
  },

  subscribeSnapshots(handler: (s: AegisSnapshot) => void): () => void {
    snapshotSubscriptions.push(handler);
    startPolling();
    return () => {
      snapshotSubscriptions = snapshotSubscriptions.filter((h) => h !== handler);
      if (snapshotSubscriptions.length === 0) stopPolling();
    };
  },

  async listDecisions({ signal } = {}) {
    const decisions = await httpRequest<BackendDecision[]>("/aegis/decisions", { signal });
    return decisions.map((d) => ({
      id: d.id,
      occurredAt: d.occurredAt,
      action: d.action as Decision["action"],
      reason: d.reason,
      topFeatures: d.topFeatures,
    }));
  },

  async listDevices({ signal } = {}) {
    const devices = await httpRequest<BackendAegisDevice[]>("/aegis/devices", { signal });
    return devices.map((d) => ({
      id: d.id,
      label: d.label,
      os: d.os,
      trust: d.trust as Device["trust"],
      lastSeenAt: d.lastSeenAt,
      city: d.city,
    }));
  },

  async listRiskEvents({ signal } = {}) {
    const events = await httpRequest<BackendRiskEvent[]>("/aegis/risk-events", { signal });
    return events.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      severity: e.severity as RiskEvent["severity"],
      summary: e.summary,
    }));
  },

  async listDeviceProfiles({ signal } = {}) {
    const profiles = await httpRequest<BackendDeviceProfile[]>("/aegis/device-profiles", {
      signal,
    });
    return profiles.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind as DeviceProfile["kind"],
      os: p.os,
      browser: p.browser,
      location: p.location,
      lastActive: p.lastActive,
      confidence: p.confidence,
      trust: p.trust,
      primary: p.primary,
    }));
  },

  async listDecisionReplays({ signal } = {}) {
    const replays = await httpRequest<BackendDecisionReplay[]>("/aegis/decisions/replays", {
      signal,
    });
    return replays.map((r) => ({
      id: r.id,
      time: r.time,
      title: r.title,
      outcome: r.outcome as DecisionReplay["outcome"],
      confidence: r.confidence,
      petals: r.petals,
    }));
  },

  async submitBatch(windows, sessionId?: string, deviceId?: string) {
    if (!windows || windows.length === 0 || !sessionId) return;
    try {
      await httpRequest("/events/batch", {
        method: "POST",
        body: { windows, sessionId, deviceId },
      });
    } catch (err) {
      // Backend MongoDB bulk write or deployment blip — log debug without breaking pipeline
      console.debug("[AegisHTTP] Background batch telemetry upload note:", err);
    }
  },
};
