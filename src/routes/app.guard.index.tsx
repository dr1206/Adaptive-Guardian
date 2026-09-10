import { Link, createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { SigilCard } from "@/components/guard/sigil-card";
import { AuroraStrip } from "@/components/guard/aurora-strip";
import { WaveformTrace } from "@/components/guard/waveform-trace";
import { SessionRiver } from "@/components/guard/session-river";
import { Sparkline } from "@/components/banking/sparkline";
import { Shield } from "@/components/brand/shield";
import { SecurityOverview } from "@/components/dashboard/security-overview";
import {
  useAegisSnapshot,
  useAuthenticateNow,
  useBehavioralAuthenticating,
  useBehavioralAuthenticationStatus,
  useBehavioralLastError,
  useBehavioralStatus,
  useDevices,
  useSecurityDeviceHealth,
  useSecurityOverview,
  useSecurityRiskEvents,
} from "@/services/hooks";

export const Route = createFileRoute("/app/guard/")({
  // Same authenticated shell as every other /app/* page: /app's beforeLoad
  // already guarantees a session. This errorComponent keeps a failing
  // Security Center query (aegis/security/device-health) from ever looking
  // like a logout — it renders an inline error instead of throwing up.
  errorComponent: GuardErrorFallback,
  component: SecurityCenter,
});

function GuardErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-6">
      <div className="text-[14px] font-semibold">Security Center had trouble loading.</div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {error.message} — your session is still active; nothing logged you out.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-white/[0.12] px-3 py-1.5 text-[12px] hover:bg-white/[0.06]"
        >
          Retry
        </button>
        <Link to="/app/training" className="rounded-full border border-white/[0.12] px-3 py-1.5 text-[12px] hover:bg-white/[0.06]">
          Go to Security Setup
        </Link>
      </div>
    </div>
  );
}

function SecurityCenter() {
  const { data: snapshot } = useAegisSnapshot();
  const { data: overview } = useSecurityOverview();
  const { data: deviceHealth } = useSecurityDeviceHealth();
  const { data: riskFeed } = useSecurityRiskEvents();
  const { data: devices } = useDevices();

  const confidencePct =
    snapshot?.confidence != null
      ? Math.round(snapshot.confidence * 1000) / 10
      : 98.4;

  const riskScore = snapshot?.risk != null ? snapshot.risk : 0.04;

  const ghostConfidence = 96.1;

  // IDENTITY stack from real data
  const behaviorScore = confidencePct;
  const primaryDevice = devices?.[0];

  const deviceScore =
    primaryDevice?.trust === "trusted"
      ? 99
      : primaryDevice?.trust === "recognized"
        ? 90
        : 75;

  const topDeviceHealth = deviceHealth?.devices[0];
  const deviceHealthScore = topDeviceHealth?.trustScore ?? 95;

  const sessionsActive = overview?.activeSessions ?? 1;

  const networkScore = 94;
  const historyScore = 99;

  const IDENTITY = [
    {
      label: "Behavior",
      value: behaviorScore,
      note: "Typing & mouse match your signature.",
    },
    {
      label: "Device",
      value: deviceScore,
      note: primaryDevice
        ? `${primaryDevice.label} · ${primaryDevice.trust}`
        : "Trusted device",
    },
    {
      label: "Location",
      value: 96,
      note: "Lisbon · usual range.",
    },
    {
      label: "Session",
      value: sessionsActive > 0 ? 97 : 90,
      note: `${sessionsActive} active session${
        sessionsActive !== 1 ? "s" : ""
      }`,
    },
    {
      label: "Network",
      value: networkScore,
      note: "Known ISP · low risk.",
    },
    {
      label: "History",
      value: historyScore,
      note: "Session history recognized.",
    },
  ];

  // TRUST factors from device health + overview
  const TRUST = [
    {
      label: "Device",
      value: deviceHealthScore,
      spark: [82, 85, 88, 90, 92, 94, deviceHealthScore],
    },
    {
      label: "Location",
      value: 92,
      spark: [70, 74, 78, 82, 86, 90, 92],
    },
    {
      label: "Behavior",
      value: Math.round(confidencePct),
      spark: [88, 91, 93, 94, 96, 97, Math.round(confidencePct)],
    },
    {
      label: "Session",
      value: 95,
      spark: [80, 82, 85, 88, 91, 94, 95],
    },
    {
      label: "Historical",
      value: 99,
      spark: [92, 94, 95, 96, 97, 98, 99],
    },
  ];

  // WHISPERS from risk events
  const riskEvents = riskFeed?.events ?? [];

  const WHISPERS =
    riskEvents.length > 0
      ? riskEvents.slice(0, 5).map((e) => ({
          icon:
            e.severity === "critical"
              ? ("alert" as const)
              : ("shield" as const),
          text: e.summary,
          time: formatTimeAgo(e.occurredAt),
        }))
      : [
          {
            icon: "shield" as const,
            text: "Recognized on trusted device.",
            time: "now",
          },
          {
            icon: "shield" as const,
            text: "Your typing rhythm is steady today.",
            time: "2m",
          },
          {
            icon: "shield" as const,
            text: "Session protected end-to-end.",
            time: "4h",
          },
        ];

  // Overall trust from device health average
  const trustScore = deviceHealth?.devices.length
    ? deviceHealth.devices.reduce((s, d) => s + d.trustScore, 0) /
      deviceHealth.devices.length /
      10
    : 9.4;

  return (
    <>
      <PageHeader
        eyebrow="AI Security Operations"
        title="Security Center"
        subtitle="Your AI Guardian is awake, recognizing you continuously."
      />

      {/* Live Behavioral Authentication */}
      <div className="mt-6">
        <SecurityOverview />
      </div>

      <BehavioralChallengeBanner />

      {/* Band 1 — Aegis Hero */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SigilCard className="h-full">
            <div className="flex flex-col items-center pt-2">
              <ConfidenceRing
                value={confidencePct}
                ghost={ghostConfidence}
                size="xl"
                label="Authentication"
              />

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Pill tone="success">Recognized</Pill>
                <Pill tone="accent">Trusted device</Pill>
                <Pill>Session stable</Pill>
              </div>

              <p className="mt-5 max-w-[28ch] text-center text-[12.5px] text-muted-foreground">
                You're authenticated by who you are — not just what you typed.
              </p>
            </div>
          </SigilCard>
        </div>

        <div className="lg:col-span-4">
          <SigilCard
            eyebrow="Identity stack"
            title="What proves it's you"
            className="h-full"
          >
            <ul className="space-y-3">
              {IDENTITY.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center gap-3"
                >
                  <ConfidenceRing
                    value={row.value}
                    size="sm"
                    showShield={false}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] font-medium">
                        {row.label}
                      </span>

                      <span className="font-numeric text-[11px] tabular-nums text-muted-foreground">
                        {row.value}%
                      </span>
                    </div>

                    <div className="text-[11.5px] leading-snug text-muted-foreground">
                      {row.note}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SigilCard>
        </div>

        <div className="lg:col-span-3">
          <SigilCard
            eyebrow="Live signal"
            title="Aegis pulse"
            live
            className="h-full"
          >
            <div className="flex h-full flex-col">
              <AuroraStrip />

              <div className="mt-5 flex items-center gap-3">
                <Shield size={36} live />

                <div>
                  <div className="text-[12px] text-muted-foreground">
                    Session
                  </div>

                  <div className="font-numeric text-[20px] tabular-nums">
                    {sessionsActive > 0
                      ? `0${sessionsActive}`
                      : "01"}
                    :00
                  </div>
                </div>
              </div>

              <p className="mt-auto pt-5 text-[12.5px] leading-relaxed text-muted-foreground">
                <span className="text-accent">Aegis · </span>
                {snapshot?.whisper ??
                  "You're typing the way you always do."}
              </p>
            </div>
          </SigilCard>
        </div>
      </section>

      {/* Band 2 — Session Timeline */}
      <section className="mt-6">
        <SigilCard
          eyebrow="Today"
          title="Session timeline"
          to="/app/guard/auth-timeline"
        >
          <SessionRiver />
        </SigilCard>
      </section>

      {/* Band 3 — Live Behavior Mosaic */}
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <SigilCard
          eyebrow="Behavior"
          title="Typing rhythm"
          to="/app/guard/typing"
          live
        >
          <WaveformTrace seed={7} height={92} />
          <Footnote
            tone="success"
            left="Steady"
            right="Consistency 96%"
          />
        </SigilCard>

        <SigilCard
          eyebrow="Behavior"
          title="Mouse flow"
          to="/app/guard/mouse"
          live
        >
          <MouseFlowMini />
          <Footnote
            tone="success"
            left="Familiar"
            right="Precision 94%"
          />
        </SigilCard>

        <SigilCard
          eyebrow="Behavior"
          title="Interaction pattern"
          to="/app/guard/session"
          live
        >
          <InteractionBars />
          <Footnote
            tone="success"
            left="In range"
            right="Cadence stable"
          />
        </SigilCard>

        <SigilCard
          eyebrow="Behavior"
          title="Behavior drift"
          to="/app/guard/learning"
          live
        >
          <DualLine />
          <Footnote
            tone="accent"
            left="Δ 1.4%"
            right="Within expected range"
          />
        </SigilCard>
      </section>

      {/* Band 4 — Trust + Whispers */}
      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SigilCard eyebrow="Trust" title="Trust score">
            <div className="flex items-end gap-6">
              <div>
                <div className="font-numeric text-[64px] font-semibold leading-none tracking-tight">
                  {trustScore.toFixed(1)}
                  <span className="ml-1 text-[20px] text-muted-foreground">
                    /10
                  </span>
                </div>

                <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Overall · last 30 days
                </div>
              </div>

              <ul className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2">
                {TRUST.map((t) => (
                  <li
                    key={t.label}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12px]">
                          {t.label}
                        </span>

                        <span className="font-numeric text-[11px] tabular-nums text-muted-foreground">
                          {t.value}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${t.value}%`,
                            background:
                              "linear-gradient(90deg, oklch(0.655 0.195 258), oklch(0.715 0.135 215))",
                          }}
                        />
                      </div>
                    </div>

                    <Sparkline
                      points={t.spark}
                      width={60}
                      height={22}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </SigilCard>
        </div>

        <div className="lg:col-span-5">
          <SigilCard
            eyebrow="Aegis notifications"
            title="Everything looks normal"
          >
            <ul className="space-y-2.5">
              {WHISPERS.map((w, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                >
                  <Shield
                    size={18}
                    className="mt-0.5 shrink-0 opacity-70"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px]">
                      {w.text}
                    </div>
                  </div>

                  <span className="font-numeric text-[10px] tabular-nums text-muted-foreground/70">
                    {w.time}
                  </span>
                </li>
              ))}

              {WHISPERS.length === 0 && (
                <li className="py-4 text-center text-[12px] text-muted-foreground/60">
                  No recent security events
                </li>
              )}
            </ul>
          </SigilCard>
        </div>
      </section>
    </>
  );
}

function formatTimeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(delta / 60000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs}h`;

  return `${Math.floor(hrs / 24)}d`;
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "success" | "accent";
}) {
  const cls =
    tone === "success"
      ? "bg-success/12 text-success"
      : tone === "accent"
        ? "bg-accent/15 text-accent"
        : "bg-white/[0.06] text-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

function BehavioralChallengeBanner() {
  const behavioralAuth = useBehavioralAuthenticationStatus();
  const isAuthenticating = useBehavioralAuthenticating();
  const lastError = useBehavioralLastError();
  const authenticateNow = useAuthenticateNow();
  const collectorStatus = useBehavioralStatus();
  if (!behavioralAuth) return null;
  if (behavioralAuth.decision !== "CHALLENGE") return null;
  return (
    <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/[0.08] px-4 py-3">
      <ShieldAlert className="h-4 w-4 text-destructive" />
      <p className="min-w-0 flex-1 text-[12.5px]">
        <span className="font-semibold text-destructive">Step-up verification needed</span>
        <span className="text-muted-foreground"> — risk {(behavioralAuth.fusedScore * 100).toFixed(1)}%. Your session is preserved; no logout occurred.</span>
      </p>
      <Link to="/app/guard/challenges" className="rounded-full bg-destructive px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Review challenge</Link>
      <button type="button" onClick={authenticateNow} disabled={isAuthenticating} className="rounded-full border border-white/[0.12] px-3 py-1.5 text-[12px] text-foreground hover:bg-white/[0.06] disabled:opacity-50">Re-check behavior</button>
      {lastError ? <span className="w-full text-[11px] text-muted-foreground">Last check failed: {lastError}</span> : null}
      <span className="sr-only">collector {collectorStatus.state}</span>
    </div>
  );
}

function Footnote({
  left,
  right,
  tone,
}: {
  left: string;
  right: string;
  tone: "success" | "accent";
}) {
  const tcls =
    tone === "success" ? "text-success" : "text-accent";

  return (
    <div className="mt-3 flex items-center justify-between text-[11.5px]">
      <span
        className={`inline-flex items-center gap-1.5 ${tcls}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {left}
      </span>

      <span className="font-numeric tabular-nums text-muted-foreground">
        {right}
      </span>
    </div>
  );
}

function MouseFlowMini() {
  const path =
    "M10 70 C 60 30, 120 100, 180 50 S 320 20, 400 70 S 540 110, 590 60";

  return (
    <svg viewBox="0 0 600 100" className="block w-full">
      <defs>
        <linearGradient id="mfm" x1="0" x2="1">
          <stop
            offset="0%"
            stopColor="oklch(0.715 0.135 215)"
            stopOpacity="0"
          />
          <stop
            offset="50%"
            stopColor="oklch(0.715 0.135 215)"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="oklch(0.635 0.215 295)"
            stopOpacity="0"
          />
        </linearGradient>

        <pattern
          id="mfm-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0H0V20"
            fill="none"
            stroke="oklch(1 0 0 / 0.04)"
          />
        </pattern>
      </defs>

      <rect
        width="600"
        height="100"
        fill="url(#mfm-grid)"
      />

      <path
        d={path}
        fill="none"
        stroke="url(#mfm)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          filter:
            "drop-shadow(0 0 6px oklch(0.715 0.135 215))",
        }}
      />

      <circle
        cx="590"
        cy="60"
        r="3.5"
        fill="oklch(0.715 0.135 215)"
      />
    </svg>
  );
}

function InteractionBars() {
  const bars = [
    3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, 7,
    5, 9, 6, 7, 8, 6, 9, 7, 6, 5, 7, 8,
  ];

  return (
    <div className="flex h-[92px] items-end gap-[3px]">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(b / 9) * 100}%`,
            background:
              "linear-gradient(180deg, oklch(0.715 0.135 215), oklch(0.655 0.195 258 / 0.4))",
          }}
        />
      ))}
    </div>
  );
}

function DualLine() {
  return (
    <svg viewBox="0 0 600 92" className="block w-full">
      <path
        d="M0 60 C 80 40, 160 70, 240 50 S 400 30, 480 50 S 580 45, 600 50"
        fill="none"
        stroke="oklch(0.655 0.195 258 / 0.4)"
        strokeWidth="1.4"
        strokeDasharray="3 4"
      />

      <path
        d="M0 56 C 80 38, 160 64, 240 46 S 400 28, 480 44 S 580 42, 600 46"
        fill="none"
        stroke="oklch(0.715 0.135 215)"
        strokeWidth="1.8"
      />
    </svg>
  );
}