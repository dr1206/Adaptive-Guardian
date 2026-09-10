import { Link } from "@tanstack/react-router";
import { AlertTriangle, Fingerprint, Loader2, RefreshCw, ShieldAlert } from "lucide-react";

export type BehavioralTone = "pass" | "warn" | "critical";
export interface BehavioralAuthSnapshot {
  lightgbmScore: number; ocsvmAnomalyScore: number; fusedScore: number;
  decision: string; authenticatedAt: string;
}
export function formatPct01(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString(); }
  catch { return ""; }
}
export interface BehavioralLivePanelProps {
  behavioralAuth: BehavioralAuthSnapshot | null;
  behavioralDecision: string;
  tone: BehavioralTone;
  isWaiting: boolean;
  isAuthenticating: boolean;
  lastError: string | null;
  authenticateNow: () => void;
  collectorStatus: { state: string; keystrokesCaptured: number; mouseEventsCaptured: number };
}
export function BehavioralLivePanel(p: BehavioralLivePanelProps) {
  const { behavioralAuth, behavioralDecision, tone, isWaiting, isAuthenticating, lastError, authenticateNow, collectorStatus } = p;
  const frame = tone === "critical"
    ? "mb-4 rounded-xl border border-destructive/40 bg-destructive/[0.07] p-4"
    : tone === "warn"
      ? "mb-4 rounded-xl border border-warning/40 bg-warning/[0.06] p-4"
      : "mb-4 rounded-xl border border-success/25 bg-success/[0.05] p-4";
  const iconBox = tone === "critical"
    ? "grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive"
    : tone === "warn"
      ? "grid h-10 w-10 place-items-center rounded-xl bg-warning/15 text-warning"
      : "grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success";
  const decCls = tone === "critical"
    ? "font-numeric text-[18px] font-bold tracking-tight text-destructive"
    : tone === "warn"
      ? "font-numeric text-[18px] font-bold tracking-tight text-warning"
      : "font-numeric text-[18px] font-bold tracking-tight text-success";
  return (
    <section aria-live="polite" aria-label="Behavioral authentication" data-testid="behavioral-auth-panel" className={frame}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={iconBox}>
            {tone === "critical" ? <ShieldAlert className="h-5 w-5" /> : tone === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Fingerprint className="h-5 w-5" />}
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Behavioral authentication · live</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span data-testid="behavioral-decision" className={decCls}>
                {isAuthenticating && isWaiting ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />CHECKING…</span>) : (behavioralDecision)}
              </span>
              {isAuthenticating && !isWaiting && (<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />)}
            </div>
          </div>
        </div>
        <button type="button" onClick={authenticateNow} disabled={isAuthenticating} title="Finalize current window now (collection keeps running)" className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-foreground transition-colors hover:bg-white/[0.08] disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${isAuthenticating ? "animate-spin" : ""}`} />
          {isAuthenticating ? "Checking…" : "Check now"}
        </button>
      </div>
      <BehavioralScores behavioralAuth={behavioralAuth} />
      <div className="mt-3 text-[12px] text-muted-foreground">
        {isWaiting && !lastError && (<span>WAITING — collecting typing and mouse rhythm{collectorStatus.state === "collecting" ? ` (${collectorStatus.keystrokesCaptured} keys · ${collectorStatus.mouseEventsCaptured} mouse). First result after first 30s window — or press Check now.` : " (starts after login)."}</span>)}
        {behavioralDecision === "ALLOW" && (<span className="text-success">Session trusted — normal usage continues. Monitoring runs silently.{behavioralAuth && (<span className="text-muted-foreground"> · updated {formatTime(behavioralAuth.authenticatedAt)}</span>)}</span>)}
        {behavioralDecision === "WARN" && (<span className="text-warning">Elevated risk — session stays usable while monitoring continues.{behavioralAuth && (<span className="text-muted-foreground"> · updated {formatTime(behavioralAuth.authenticatedAt)}</span>)}</span>)}
        {behavioralDecision === "CHALLENGE" && (<span><span className="font-semibold text-destructive">Additional verification required.</span> <span className="text-muted-foreground">Session preserved — complete a quick check. </span><Link to="/app/guard/challenges" className="font-medium text-accent hover:underline">Open challenge history →</Link></span>)}
        {lastError && (<span className="mt-1 block text-[11.5px] text-muted-foreground">Last check failed: {lastError} — will retry on next window.</span>)}
      </div>
    </section>
  );
}
function BehavioralScores({ behavioralAuth }: { behavioralAuth: BehavioralAuthSnapshot | null }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2.5">
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Risk score</div>
        <div data-testid="behavioral-risk" className="mt-1 font-numeric text-[16px] font-semibold tabular-nums">{behavioralAuth ? formatPct01(behavioralAuth.fusedScore) : "—"}</div>
      </div>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">LightGBM</div>
        <div data-testid="behavioral-lightgbm" className="mt-1 font-numeric text-[16px] font-semibold tabular-nums">{behavioralAuth ? formatPct01(behavioralAuth.lightgbmScore) : "—"}</div>
      </div>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">OC-SVM anomaly</div>
        <div data-testid="behavioral-ocsvm" className="mt-1 font-numeric text-[16px] font-semibold tabular-nums">{behavioralAuth ? formatPct01(behavioralAuth.ocsvmAnomalyScore) : "—"}</div>
      </div>
    </div>
  );
}
