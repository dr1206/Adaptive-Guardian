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

export interface AegisService {
  getSnapshot(opts?: { signal?: AbortSignal }): Promise<AegisSnapshot>;
  /** Subscribe to live confidence updates. Returns unsubscribe. */
  subscribeSnapshots(handler: (s: AegisSnapshot) => void): () => void;
  listDecisions(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Decision>>;
  listDevices(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<Device>>;
  listRiskEvents(opts?: { signal?: AbortSignal }): Promise<ReadonlyArray<RiskEvent>>;
}
