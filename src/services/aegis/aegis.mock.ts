import { mockResolve } from "../_transport/mock";
import type { AegisService, AegisSnapshot, Decision, Device, RiskEvent } from "./aegis.contract";

const TREND_LEN = 60;
const trend: number[] = Array.from({ length: TREND_LEN }, (_, i) =>
  Math.max(0.86, Math.min(0.995, 0.97 + Math.sin(i / 7) * 0.02 + Math.random() * 0.012)),
);

const WHISPERS = [
  "Session stable.",
  "Cadence matches your baseline.",
  "You feel like you.",
  "Pointer rhythm consistent.",
  "Quiet on the wire.",
];

function snapshot(): AegisSnapshot {
  trend.shift();
  const next = Math.max(0.84, Math.min(0.998, trend[trend.length - 1] + (Math.random() - 0.5) * 0.014));
  trend.push(next);
  return {
    confidence: next,
    risk: Math.max(0, 1 - next - 0.02 * Math.random()),
    whisper: WHISPERS[Math.floor(Math.random() * WHISPERS.length)],
    observedAt: new Date().toISOString(),
    trend: trend.slice(),
  };
}

const DECISIONS: ReadonlyArray<Decision> = Array.from({ length: 12 }, (_, i) => ({
  id: `dec_${i}`,
  occurredAt: new Date(Date.now() - i * 1000 * 60 * 23).toISOString(),
  action: i === 3 ? "challenge" : i === 7 ? "step_up" : "allow",
  reason:
    i === 3
      ? "Pointer entropy below baseline"
      : i === 7
        ? "New IP + unfamiliar device fingerprint"
        : "Behavioral baseline matched",
  topFeatures: [
    { name: "keystroke.dwell.mean", contribution: 0.34 - i * 0.01 },
    { name: "mouse.path.curvature", contribution: 0.21 + i * 0.005 },
    { name: "session.cadence", contribution: 0.17 },
  ],
}));

const DEVICES: ReadonlyArray<Device> = [
  { id: "dev_mac", label: "MacBook Pro 14", os: "macOS 15.2", trust: "trusted", lastSeenAt: new Date().toISOString(), city: "Berlin" },
  { id: "dev_iphone", label: "iPhone 16 Pro", os: "iOS 19.0", trust: "trusted", lastSeenAt: new Date(Date.now() - 9e6).toISOString(), city: "Berlin" },
  { id: "dev_unknown", label: "Chrome on Windows", os: "Windows 11", trust: "new", lastSeenAt: new Date(Date.now() - 36e5).toISOString(), city: "Vilnius" },
];

const RISK: ReadonlyArray<RiskEvent> = [
  { id: "rsk_1", occurredAt: new Date().toISOString(), severity: "info", summary: "Routine login from Berlin." },
  { id: "rsk_2", occurredAt: new Date(Date.now() - 6e6).toISOString(), severity: "warn", summary: "Pointer pattern drift on /transfer." },
  { id: "rsk_3", occurredAt: new Date(Date.now() - 12e6).toISOString(), severity: "critical", summary: "Unrecognized device attempted login." },
];

export const mockAegisService: AegisService = {
  async getSnapshot({ signal } = {}) {
    return mockResolve(snapshot, { signal, latencyMs: [60, 140] });
  },
  subscribeSnapshots(handler) {
    const id = setInterval(() => handler(snapshot()), 1800);
    return () => clearInterval(id);
  },
  async listDecisions({ signal } = {}) {
    return mockResolve(DECISIONS, { signal });
  },
  async listDevices({ signal } = {}) {
    return mockResolve(DEVICES, { signal });
  },
  async listRiskEvents({ signal } = {}) {
    return mockResolve(RISK, { signal });
  },
};
