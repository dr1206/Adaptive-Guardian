import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ChevronRight,
  Download,
  Fingerprint,
  Gauge,
  Keyboard,
  Maximize2,
  Minimize2,
  MousePointer2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import {
  useAuthenticateNow,
  useBehavioralAuthenticating,
  useBehavioralAuthenticationStatus,
  useBehavioralExport,
  useBehavioralStatus,
} from "@/services/behavioral/BehavioralCollectorProvider";
import {
  clearStoredDataset,
  datasetStats,
  downloadAsCsv,
  downloadAsJson,
  downloadFullDataset,
  loadStoredWindows,
} from "@/services/behavioral/export";
import { cn } from "@/lib/utils";

const DOCK_STORAGE_KEY = "ag_telemetry_dock_expanded";

export function BehavioralTelemetryDock() {
  const status = useBehavioralStatus();
  const authStatus = useBehavioralAuthenticationStatus();
  const isAuthenticating = useBehavioralAuthenticating();
  const authenticateNow = useAuthenticateNow();
  const { dumpSession, getWindows } = useBehavioralExport();

  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DOCK_STORAGE_KEY);
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [label, setLabel] = useState("");
  const [stats, setStats] = useState(() => datasetStats());
  const [keyFlash, setKeyFlash] = useState(false);
  const [mouseFlash, setMouseFlash] = useState(false);

  const prevKeysRef = useRef(status.keystrokesCaptured);
  const prevMouseRef = useRef(status.mouseEventsCaptured);

  // Flash indicators on real inputs
  useEffect(() => {
    if (status.keystrokesCaptured !== prevKeysRef.current) {
      prevKeysRef.current = status.keystrokesCaptured;
      setKeyFlash(true);
      const t = setTimeout(() => setKeyFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [status.keystrokesCaptured]);

  useEffect(() => {
    if (status.mouseEventsCaptured !== prevMouseRef.current) {
      prevMouseRef.current = status.mouseEventsCaptured;
      setMouseFlash(true);
      const t = setTimeout(() => setMouseFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [status.mouseEventsCaptured]);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DOCK_STORAGE_KEY, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const refreshStats = useCallback(() => setStats(datasetStats()), []);

  useEffect(() => {
    const id = setInterval(refreshStats, 3000);
    return () => clearInterval(id);
  }, [refreshStats]);

  /**
   * Collect all windows for export:
   * 1. Start with everything stored in localStorage (accumulated across sessions)
   * 2. Also include any windows currently in-memory (current live session)
   */
  function getAllWindowsForExport() {
    const stored = loadStoredWindows();
    const allStored = stored.sessions.flatMap((s) => s.windows);

    // Also include in-memory windows not yet flushed to localStorage
    const liveWindows = getWindows();
    const liveDump = dumpSession();
    const liveExtra = (liveDump?.windows ?? liveWindows).filter(
      (w) => !allStored.some((sw) => sw.windowId === w.windowId),
    );

    return [...allStored, ...liveExtra];
  }

  const handleExportJson = () => {
    const windows = getAllWindowsForExport();
    if (windows.length > 0) {
      downloadAsJson(windows, label || undefined);
    } else {
      alert("No behavioral data collected yet. Use the app for at least 30 seconds first.");
    }
    refreshStats();
  };

  const handleExportCsv = () => {
    const windows = getAllWindowsForExport();
    if (windows.length > 0) {
      downloadAsCsv(windows, label || undefined);
    } else {
      alert("No behavioral data collected yet. Use the app for at least 30 seconds first.");
    }
    refreshStats();
  };

  const handleExportFull = () => {
    downloadFullDataset();
    refreshStats();
  };

  const handleClear = () => {
    clearStoredDataset();
    refreshStats();
  };

  const isCollecting = status.state === "collecting";
  const progressPercent = Math.min(
    100,
    Math.max(0, ((status.windowElapsedSec ?? 0) / (status.windowDurationSec || 30)) * 100),
  );

  // If not in collecting state (e.g. logged out), we don't render the dock
  if (!isCollecting) {
    return null;
  }

  // Collapsed vertical edge tab/pill
  if (!expanded) {
    return (
      <aside
        aria-label="Behavioral Biometrics Telemetry Dock"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center shadow-xl"
      >
        <button
          onClick={toggleExpanded}
          className="group flex flex-col items-center gap-2 rounded-l-xl border border-r-0 border-[#0B3A82]/30 bg-[#082A5C] px-2.5 py-4 text-white shadow-2xl transition-all hover:bg-[#0B3A82] hover:pl-3"
          title="Open Live Behavioral Biometrics Telemetry Window"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <Activity className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />

          {/* Vertical rotated text label */}
          <span
            className="text-[11px] font-semibold uppercase tracking-wider text-white/90"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            Live Telemetry
          </span>

          <div className="my-1 h-px w-3 bg-white/20" />

          <span className="font-mono text-[10px] font-medium text-emerald-300">
            {status.keystrokesCaptured + status.mouseEventsCaptured}
          </span>

          <ChevronRight className="h-3.5 w-3.5 text-white/60 transition-transform group-hover:translate-x-0.5" />
        </button>
      </aside>
    );
  }

  // Expanded vertical floating window
  return (
    <aside
      role="complementary"
      aria-label="Live Behavioral Biometrics Telemetry"
      className="fixed right-4 top-20 bottom-16 z-50 flex w-[330px] flex-col overflow-hidden rounded-2xl border border-[#D9E1EA] bg-white shadow-2xl transition-all duration-200"
      style={{
        boxShadow: "0 20px 40px -15px rgba(8, 42, 92, 0.25), 0 0 0 1px rgba(11, 58, 130, 0.08)",
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#082A5C] px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
            <Activity className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-white">Live Telemetry</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-[10.5px] text-white/70">Keyboard & Mouse Dynamics</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleExpanded}
            className="grid h-7 w-7 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Minimize Telemetry Dock"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-3.5 text-xs text-[#172033]">
        {/* 1. Active ML Window Countdown & Evaluation */}
        <section className="rounded-xl border border-[#D9E1EA] bg-[#F8FAFC] p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0B3A82]">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              30s Window Pipeline
            </span>
            <span className="font-mono text-[10.5px] font-medium text-[#667085]">
              {status.windowRemainingSec ?? 30}s left
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0B3A82] to-[#2563A6] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-[#667085]">
              Window: <strong className="text-[#172033]">#{status.windowsSent + 1}</strong>
            </span>
            <button
              onClick={authenticateNow}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-1 rounded-md border border-[#D9E1EA] bg-white px-2 py-0.5 text-[10.5px] font-medium text-[#0B3A82] shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", isAuthenticating && "animate-spin")} />
              {isAuthenticating ? "Evaluating…" : "Check now"}
            </button>
          </div>

          {/* Latest Model Evaluation */}
          {authStatus && (
            <div className="mt-2.5 rounded-lg border border-slate-200/80 bg-white p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[#667085]">Decision</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                    authStatus.decision === "ALLOW" && "bg-emerald-100 text-emerald-800",
                    authStatus.decision === "WARN" && "bg-amber-100 text-amber-800",
                    authStatus.decision === "CHALLENGE" && "bg-rose-100 text-rose-800",
                  )}
                >
                  {authStatus.decision}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                <div className="rounded bg-slate-50 p-1">
                  <div className="text-[9px] text-[#667085]">Risk</div>
                  <div className="font-semibold text-[#172033]">
                    {(authStatus.fusedScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded bg-slate-50 p-1">
                  <div className="text-[9px] text-[#667085]">LightGBM</div>
                  <div className="font-semibold text-[#172033]">
                    {(authStatus.lightgbmScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded bg-slate-50 p-1">
                  <div className="text-[9px] text-[#667085]">OC-SVM</div>
                  <div className="font-semibold text-[#172033]">
                    {(authStatus.ocsvmAnomalyScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Step-up Verification Diagnostic (when in progress) */}
          {status.verification && (
            <div className="mt-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-[#0B3A82]">
                <span className="flex items-center gap-1">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Verification Attempt
                </span>
                <span className="font-mono text-[10px] text-[#667085]">
                  {status.verification.isReady ? "READY" : "COLLECTING"}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-[#475467] font-mono truncate">
                ID: {status.verification.windowId}
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                <div className="rounded bg-white p-1 border border-blue-100">
                  <div className="text-[9px] text-[#667085]">Keys</div>
                  <div className="font-semibold text-[#0B3A82]">
                    {status.verification.keystrokes}
                  </div>
                </div>
                <div className="rounded bg-white p-1 border border-blue-100">
                  <div className="text-[9px] text-[#667085]">Mouse</div>
                  <div className="font-semibold text-[#0B3A82]">
                    {status.verification.mouseMoves}
                  </div>
                </div>
                <div className="rounded bg-white p-1 border border-blue-100">
                  <div className="text-[9px] text-[#667085]">Travel</div>
                  <div className="font-semibold text-[#0B3A82]">
                    {status.verification.mouseTravelPx}px
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. Keyboard Dynamics Card */}
        <section
          className={cn(
            "rounded-xl border border-[#D9E1EA] bg-white p-3 shadow-xs transition-colors",
            keyFlash && "border-[#0B3A82] ring-1 ring-[#0B3A82]/30",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#172033]">
              <Keyboard className="h-3.5 w-3.5 text-[#0B3A82]" />
              Keyboard Dynamics
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[11px] font-bold transition-all",
                keyFlash ? "bg-[#0B3A82] text-white scale-105" : "bg-slate-100 text-[#0B3A82]",
              )}
            >
              {status.keystrokesCaptured} keys
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 font-mono">
            <div className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-2">
              <span className="text-[10px] text-[#667085]">Dwell (Hold)</span>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[14px] font-bold text-[#172033]">
                  {status.lastDwellMs ?? 0}
                </span>
                <span className="text-[10px] text-[#667085]">ms</span>
              </div>
              <div className="text-[9px] text-[#667085]">avg: {status.meanDwellMs ?? 0} ms</div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-2">
              <span className="text-[10px] text-[#667085]">Flight (Interval)</span>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[14px] font-bold text-[#172033]">
                  {status.lastFlightMs ?? 0}
                </span>
                <span className="text-[10px] text-[#667085]">ms</span>
              </div>
              <div className="text-[9px] text-[#667085]">avg: {status.meanFlightMs ?? 0} ms</div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px]">
            <span className="text-[#667085]">Cadence:</span>
            <span className="font-mono font-semibold text-[#0B3A82]">
              {status.keysPerSec ?? 0} keys/sec
            </span>
          </div>

          <p className="mt-2 text-[9.5px] leading-tight text-[#667085]">
            <ShieldCheck className="mr-1 inline h-3 w-3 text-emerald-600" />
            Zero keystroke content stored · Pure biometric rhythm only.
          </p>
        </section>

        {/* 3. Mouse & Pointer Kinematics Card */}
        <section
          className={cn(
            "rounded-xl border border-[#D9E1EA] bg-white p-3 shadow-xs transition-colors",
            mouseFlash && "border-[#0B3A82] ring-1 ring-[#0B3A82]/30",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#172033]">
              <MousePointer2 className="h-3.5 w-3.5 text-[#0B3A82]" />
              Mouse Kinematics
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[11px] font-bold transition-all",
                mouseFlash ? "bg-[#0B3A82] text-white scale-105" : "bg-slate-100 text-[#0B3A82]",
              )}
            >
              {status.mouseEventsCaptured} events
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 font-mono">
            <div className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-2">
              <span className="text-[10px] text-[#667085]">Coordinates</span>
              <div className="mt-0.5 text-[12px] font-bold text-[#172033]">
                X: {status.mouseX ?? 0} <span className="text-slate-400">|</span> Y:{" "}
                {status.mouseY ?? 0}
              </div>
              <div className="text-[9px] text-[#667085]">screen pos</div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-2">
              <span className="text-[10px] text-[#667085]">Velocity</span>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[14px] font-bold text-[#172033]">
                  {status.mouseVelocityPxS ?? 0}
                </span>
                <span className="text-[10px] text-[#667085]">px/s</span>
              </div>
              <div className="text-[9px] text-[#667085]">instant speed</div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono">
              <span className="text-[10px] text-[#667085]">Clicks</span>
              <span className="font-semibold text-[#172033]">{status.clicksCaptured ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono">
              <span className="text-[10px] text-[#667085]">Travel</span>
              <span className="font-semibold text-[#172033]">{status.mouseTravelPx ?? 0} px</span>
            </div>
          </div>
        </section>

        {/* 4. Dataset Export & Tools Card */}
        <section className="rounded-xl border border-[#D9E1EA] bg-[#F8FAFC] p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#172033]">
              <Download className="h-3.5 w-3.5 text-[#0B3A82]" />
              ML Dataset Export
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
              {stats.windows} windows stored
            </span>
          </div>

          <p className="mt-1.5 text-[10px] text-[#667085]">
            All completed 30s windows are auto-saved. Export JSON or CSV below to download everything.
          </p>

          <div className="mt-2">
            <input
              placeholder="User label (e.g. user_01)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-md border border-[#D9E1EA] bg-white px-2 py-1 text-[11px] text-[#172033] outline-hidden focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82]"
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-1 rounded-md border border-[#D9E1EA] bg-white py-1.5 text-[10.5px] font-medium text-[#172033] shadow-2xs transition-colors hover:bg-slate-50 hover:border-[#0B3A82]"
            >
              ⬇ JSON ({stats.windows})
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-1 rounded-md border border-[#0B3A82]/30 bg-[#0B3A82]/5 py-1.5 text-[10.5px] font-medium text-[#0B3A82] shadow-2xs transition-colors hover:bg-[#0B3A82]/10"
            >
              ⬇ CSV ({stats.windows})
            </button>
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <button
              onClick={handleExportFull}
              disabled={stats.windows === 0}
              className="text-[10px] font-medium text-[#0B3A82] hover:underline disabled:text-slate-400"
            >
              Export Full Dataset ({stats.sessions} sessions)
            </button>
            <button
              onClick={handleClear}
              disabled={stats.windows === 0}
              className="flex items-center gap-1 text-[10px] text-rose-600 hover:underline disabled:text-slate-400"
            >
              <Trash2 className="h-2.5 w-2.5" />
              Clear All
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center justify-between border-t border-[#D9E1EA] bg-slate-50 px-3.5 py-2 text-[10.5px] text-[#667085]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Sampling @ 250ms</span>
        </div>
        <button onClick={toggleExpanded} className="font-medium text-[#0B3A82] hover:underline">
          Collapse
        </button>
      </div>
    </aside>
  );
}
