/**
 * Aegis domain contract — continuous behavioral authentication signals.
 *
 * UI surfaces (Aegis widget, security strip, guard pages) read snapshots,
 * decision history, and device trust state through this interface.
 */

export interface AegisSnapshot {
  /** 0..1 confidence the current session is the enrolled human. */
  confidence: number;
  /** 0..1 risk score (1 - confidence with hysteresis). */
  risk: number;
  /** Short, human Aegis whisper for the security strip. */
  whisper: string;
  /** Wall clock for the snapshot. */
  observedAt: string;
  /** Last 60 confidence samples for sparkline rendering. */
  trend: ReadonlyArray<number>;
}

export interface Decision {
  id: string;
  occurredAt: string;
  action: "allow" | "challenge" | "step_up" | "deny";
  reason: string;
  topFeatures: ReadonlyArray<{ name: string; contribution: number }>;
}

export interface Device {
  id: string;
  label: string;
  os: string;
  trust: "trusted" | "recognized" | "new";
  lastSeenAt: string;
  city: string;
}

export interface RiskEvent {
  id: string;
  occurredAt: string;
  severity: "info" | "warn" | "critical";
  summary: string;
}

/** Rich trusted-device profile (Guard / Devices presentation surface). */
export interface DeviceProfile {
  id: string;
  name: string;
  kind: "laptop" | "phone" | "tablet" | "desktop";
  os: string;
  browser: string;
  location: string;
  lastActive: string;
  /** 0..100 Aegis confidence for this device. */
  confidence: number;
  /** 0..10 trust score derived from history. */
  trust: number;
  primary?: boolean;
}

/** Weighted contribution for a single decision factor. */
export interface DecisionPetal {
  label: string;
  /** Signed weight (-100..100). Negative values pulled the decision down. */
  weight: number;
  sentence: string;
}

/** Decision replay with human-language explanation (Guard / Decisions). */
export interface DecisionReplay {
  id: string;
  time: string;
  title: string;
  outcome: "Allowed silently" | "Step-up OTP" | "Trusted";
  confidence: number;
  petals: ReadonlyArray<DecisionPetal>;
}

export interface FeatureWindow {
  windowStart: number;
  windowEnd: number;
  dwellMeanMs: number;
  dwellStdMs: number;
  flightMeanMs: number;
  flightStdMs: number;
  keysPerSec: number;
  velocityMean: number;
  velocityStd: number;
  accelerationMean: number;
  accelerationStd: number;
  curvatureMean: number;
  curvatureStd: number;
  clickCount: number;
  scrollAmount: number;
  mouseTravelPx: number;
  deviceInfo: {
    userAgent: string;
    viewport: string;
    platform: string;
    timezone: string;
  };
}

export interface AegisService {
  getSnapshot(opts?: { signal?: AbortSignal }): Promise<AegisSnapshot>;
  /** Subscribe to live confidence updates. Returns unsubscribe. */
  subscribeSnapshots(handler: (s: AegisSnapshot) => void): () => void;
  listDecisions(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Decision>>;
  listDevices(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Device>>;
  listRiskEvents(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<RiskEvent>>;
  listDeviceProfiles(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<DeviceProfile>>;
  listDecisionReplays(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<DecisionReplay>>;
  /** Submit behavioral feature windows for continuous authentication. */
  submitBatch?(
    windows: ReadonlyArray<FeatureWindow>,
    sessionId?: string,
    deviceId?: string,
  ): Promise<void>;
}
