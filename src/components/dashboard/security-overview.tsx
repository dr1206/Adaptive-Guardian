import { Link } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  CheckCircle2,
  CircleDot,
  Cpu,
  Fingerprint,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  useAegisSnapshot,
  useSecurityOverview,
  useDevices,
  useBehavioralStatus,
} from "@/services/hooks";
import {
  useAuthenticateNow,
  useBehavioralAuthenticating,
  useBehavioralAuthenticationStatus,
  useBehavioralLastError,
} from "@/services/behavioral/BehavioralCollectorProvider";
import { BehavioralLivePanel, formatPct01 } from "./behavioral-live-panel";

type Decision = "ALLOW" | "WARN" | "CHALLENGE" | "WAITING" | string;

function decisionTone(decision: Decision): "pass" | "warn" | "critical" {
  if (decision === "ALLOW") return "pass";
  if (decision === "WARN") return "warn";
  if (decision === "CHALLENGE") return "critical";
  return "pass";
}

export function SecurityOverview() {
  // Aegis/device queries are best-effort context — they must NEVER gate the
  // live behavioral panel. Only their own cards show loading placeholders.
  const { data: snapshot } = useAegisSnapshot();
  const { data: overview } = useSecurityOverview();
  const { data: devices } = useDevices();

  const behavioralAuth = useBehavioralAuthenticationStatus();
  const isAuthenticating = useBehavioralAuthenticating();
  const lastError = useBehavioralLastError();
  const authenticateNow = useAuthenticateNow();
  const collectorStatus = useBehavioralStatus();

  const confidence =
    snapshot?.confidence != null
      ? `${(snapshot.confidence * 100).toFixed(1)}%`
      : "—";

  const risk =
    overview?.riskTrend != null && overview.riskTrend.length > 0
      ? (overview.riskTrend[overview.riskTrend.length - 1] ?? 0).toFixed(2)
      : "—";

  const trustedDevice = devices?.[0];

  const deviceLabel = trustedDevice
    ? `${trustedDevice.label} · ${trustedDevice.city}`
    : "—";

  const activeSessions = overview?.activeSessions ?? 0;
  const flagged24h = overview?.flaggedEvents24h ?? 0;

  const behavioralDecision: Decision = behavioralAuth?.decision ?? "WAITING";
  const tone = decisionTone(behavioralDecision);
  const isWaiting = !behavioralAuth;

  const behavioralStatus = tone === "pass" ? "pass" : "warn";

  const cards: Array<{
    icon: typeof ShieldCheck;
    title: string;
    metric: string;
    note: string;
    status: "pass" | "warn";
    action: string;
  }> = [
    {
      icon: ShieldCheck,
      title: "Auth confidence",
      metric: confidence,
      note: "Current session",
      status: "pass",
      action: "View",
    },
    {
      icon: Smartphone,
      title: "Trusted device",
      metric: deviceLabel,
      note: trustedDevice ? `Trust: ${trustedDevice.trust}` : "No device",
      status: "pass",
      action: "Manage",
    },
    {
      icon: Fingerprint,
      title: "Active sessions",
      metric: String(activeSessions),
      note: "Recognized sessions",
      status: "pass",
      action: "View",
    },
    {
      icon: Activity,
      title: "Flagged events",
      metric: String(flagged24h),
      note: "Last 24 hours",
      status: flagged24h === 0 ? "pass" : "warn",
      action: "View",
    },
    {
      icon: CircleDot,
      title: "Session integrity",
      metric: "A+",
      note: "End-to-end protected",
      status: "pass",
      action: "Re-verify",
    },
    {
      icon: Brain,
      title: "AI monitoring",
      metric: behavioralDecision,
      note: behavioralAuth
        ? `LightGBM ${formatPct01(behavioralAuth.lightgbmScore)} · OC-SVM ${formatPct01(behavioralAuth.ocsvmAnomalyScore)}`
        : "Waiting for first 30s window",
      status: behavioralStatus,
      action: "View",
    },
    {
      icon: Cpu,
      title: "Risk assessment",
      metric: behavioralAuth ? formatPct01(behavioralAuth.fusedScore) : risk,
      note: behavioralAuth
        ? `Behavioral ML · ${behavioralDecision}`
        : flagged24h === 0
          ? "Low · normal range"
          : "Review recommended",
      status: behavioralAuth
        ? behavioralStatus
        : flagged24h === 0
          ? "pass"
          : "warn",
      action: "View",
    },
  ];

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 backdrop-blur-xl">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight">
            Security overview
          </h3>

          <p className="text-[11px] text-muted-foreground">
            All systems nominal · Aegis last refreshed 4m ago
          </p>
        </div>

        <Link
          to="/app/guard"
          className="text-[11px] text-accent hover:text-foreground"
        >
          Open Security Center →
        </Link>
      </header>

      <BehavioralLivePanel
        behavioralAuth={behavioralAuth}
        behavioralDecision={behavioralDecision}
        tone={tone}
        isWaiting={isWaiting}
        isAuthenticating={isAuthenticating}
        lastError={lastError}
        authenticateNow={authenticateNow}
        collectorStatus={collectorStatus}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;

          const iconBg =
            c.status === "pass"
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning";

          return (
            <div
              key={c.title}
              className="group rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5 transition-colors hover:border-success/30"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${iconBg}`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    c.status === "pass"
                      ? "text-success"
                      : "text-warning"
                  }`}
                />
              </div>

              <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {c.title}
              </div>

              <div className="mt-1 font-numeric text-[15px] font-semibold tracking-tight">
                {c.metric}
              </div>

              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {c.note}
              </div>

              <button className="mt-3 text-[11px] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                {c.action} →
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}