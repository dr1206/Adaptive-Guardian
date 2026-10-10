import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  BehavioralCollector,
  type BehavioralSessionDump,
  type CollectorStatus,
  type FeatureWindow,
  type VerificationProgress,
} from "./collector";
import type { BehavioralService } from "./behavioral.contract";
import { services } from "../registry";
import { appendStoredWindows, persistSession } from "./export";
import { getCurrentSessionId } from "../_transport/http";

// Reuse the existing client-side device identity.
// Backend expects a plain UUID — never reintroduce the legacy `dev_` prefix.
function getDeviceId(): string | undefined {
  try {
    let id = localStorage.getItem("ag_device_id");
    if (id?.startsWith("dev_")) {
      id = id.slice(4);
      try {
        localStorage.setItem("ag_device_id", id);
      } catch {
        /* noop */
      }
    }
    return id ?? undefined;
  } catch {
    return undefined;
  }
}

export type VerificationState =
  "IDLE" | "COLLECTING" | "READY_FOR_VERIFICATION" | "VERIFYING" | "SUCCESS" | "FAILED" | "ERROR";

export interface VerificationSessionStatus {
  state: VerificationState;
  attemptId: string | null;
  windowId: string | null;
  startedAt: number | null;
  progress: VerificationProgress | null;
  error: string | null;
  lastDecision: string | null;
  lastFusedScore: number | null;
}

interface BehavioralContextValue {
  status: CollectorStatus;
  dumpSession: () => BehavioralSessionDump | null;
  getWindows: () => FeatureWindow[];
  getLatestFeatures: () => Record<string, number> | null;
  /** Immediately flush the current partial window for authentication. */
  authenticateNow: () => void;

  /**
   * Latest ML authentication result.
   * null means that no behavioral window has been authenticated yet.
   */
  authentication: BehavioralAuthenticationState | null;
  /** True while a behavioral-authenticate request is in flight. */
  isAuthenticating: boolean;
  /** Last authentication error message, or null. */
  lastError: string | null;
  /** Number of windows authenticated so far this session. */
  windowCount: number;
  /**
   * Fused score the user has dismissed the WARN banner for.
   * null = nothing dismissed. A new (different) WARN re-shows the banner.
   */
  dismissedWarnScore: number | null;
  /** Dismiss the WARN banner for the current result. Never logs out. */
  dismissWarning: () => void;
  /**
   * ISO timestamp of the last successful step-up verification that cleared
   * a CHALLENGE. Null = never verified. While set and newer than the latest
   * CHALLENGE result, the challenge modal stays closed.
   */
  challengeClearedAt: string | null;
  /** Record a successful step-up verification (clears the CHALLENGE modal). */
  markChallengeCleared: () => void;

  /** Step-up Verification Window Lifecycle */
  verification: VerificationSessionStatus;
  startVerification: () => string;
  cancelVerification: () => void;
  submitVerification: () => Promise<boolean>;
}

export interface BehavioralAuthenticationState {
  lightgbmScore: number;
  ocsvmAnomalyScore: number;
  fusedScore: number;
  decision: "ALLOW" | "WARN" | "CHALLENGE" | string;
  authenticatedAt: string;
}

const initialCollectorStatus: CollectorStatus = {
  state: "idle",
  keystrokesCaptured: 0,
  mouseEventsCaptured: 0,
  windowsSent: 0,
  windowsBuffered: 0,
  uptimeMs: 0,
  windowRemainingSec: 30,
  windowElapsedSec: 0,
  windowDurationSec: 30,
  lastDwellMs: 0,
  lastFlightMs: 0,
  meanDwellMs: 0,
  meanFlightMs: 0,
  keysPerSec: 0,
  mouseVelocityPxS: 0,
  mouseTravelPx: 0,
  clicksCaptured: 0,
  mouseX: 0,
  mouseY: 0,
  lastActivityAt: 0,
  verification: null,
};

const initialVerificationStatus: VerificationSessionStatus = {
  state: "IDLE",
  attemptId: null,
  windowId: null,
  startedAt: null,
  progress: null,
  error: null,
  lastDecision: null,
  lastFusedScore: null,
};

const BehavioralCtx = createContext<BehavioralContextValue>({
  status: initialCollectorStatus,
  dumpSession: () => null,
  getWindows: () => [],
  getLatestFeatures: () => null,
  authenticateNow: () => {},
  authentication: null,
  isAuthenticating: false,
  lastError: null,
  windowCount: 0,
  dismissedWarnScore: null,
  dismissWarning: () => {},
  challengeClearedAt: null,
  markChallengeCleared: () => {},
  verification: initialVerificationStatus,
  startVerification: () => "",
  cancelVerification: () => {},
  submitVerification: async () => false,
});

export function useBehavioralStatus(): CollectorStatus {
  return useContext(BehavioralCtx).status;
}

/**
 * Returns functions to dump/export the current session's behavioral data.
 */
export function useBehavioralExport() {
  const { dumpSession, getWindows, getLatestFeatures } = useContext(BehavioralCtx);

  return {
    dumpSession,
    getWindows,
    getLatestFeatures,
  };
}

/**
 * Returns the latest ML behavioral authentication result.
 */
export function useBehavioralAuthenticationStatus(): BehavioralAuthenticationState | null {
  return useContext(BehavioralCtx).authentication;
}

/** True while a behavioral-authenticate request is in flight. */
export function useBehavioralAuthenticating(): boolean {
  return useContext(BehavioralCtx).isAuthenticating;
}

/** Last behavioral-authentication error message (or null). */
export function useBehavioralLastError(): string | null {
  return useContext(BehavioralCtx).lastError;
}

/**
 * Immediately flush the current partial behavioral window and authenticate
 * it — use for the Security Center "Check now" action.
 * Continuous collection keeps running; this never stops the collector.
 */
export function useAuthenticateNow(): () => void {
  return useContext(BehavioralCtx).authenticateNow;
}

/**
 * Fused score the WARN banner was dismissed for (null = not dismissed).
 * The banner re-appears only when a NEW WARN score arrives — repeated
 * identical WARN results never stack notifications.
 */
export function useDismissedWarnScore(): number | null {
  return useContext(BehavioralCtx).dismissedWarnScore;
}

/** Dismiss the global WARN banner for the current result. */
export function useDismissWarning(): () => void {
  return useContext(BehavioralCtx).dismissWarning;
}

/**
 * ISO timestamp of the last successful step-up verification.
 * While newer than the latest CHALLENGE, the challenge modal stays closed.
 */
export function useChallengeClearedAt(): string | null {
  return useContext(BehavioralCtx).challengeClearedAt;
}

/** Record a successful step-up verification (clears the CHALLENGE modal). */
export function useMarkChallengeCleared(): () => void {
  return useContext(BehavioralCtx).markChallengeCleared;
}

/** Step-up Verification Lifecycle hooks */
export function useVerification() {
  const { verification, startVerification, cancelVerification, submitVerification } =
    useContext(BehavioralCtx);
  return {
    verification,
    startVerification,
    cancelVerification,
    submitVerification,
  };
}

/** Set to true via env or URL param to auto-persist sessions to localStorage. */
function isExportMode(): boolean {
  if (import.meta.env?.VITE_BEHAVIORAL_EXPORT === "true") {
    return true;
  }

  return new URLSearchParams(window.location.search).has("export-behavioral");
}

export function BehavioralCollectorProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CollectorStatus>(initialCollectorStatus);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [windowCount, setWindowCount] = useState(0);
  // WARN banner acknowledgement: stores the fusedScore that was dismissed.
  // A new (different) WARN score re-shows the banner; repeats do not stack.
  const [dismissedWarnScore, setDismissedWarnScore] = useState<number | null>(null);
  // CHALLENGE clearance: timestamp of last successful step-up verification.
  const [challengeClearedAt, setChallengeClearedAt] = useState<string | null>(null);
  const inFlightRef = useRef(0);

  const collectorRef = useRef<BehavioralCollector | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasAuthenticatedRef = useRef(false);
  // Mutable snapshot of the latest authentication so dismissWarning() can
  // capture the current fused score without stale-closure bugs.
  const authenticationRef = useRef<BehavioralAuthenticationState | null>(null);
  const [authentication, setAuthenticationState] = useState<BehavioralAuthenticationState | null>(
    null,
  );
  const setAuthentication = useCallback(
    (
      value:
        | BehavioralAuthenticationState
        | null
        | ((prev: BehavioralAuthenticationState | null) => BehavioralAuthenticationState | null),
    ) => {
      setAuthenticationState((prev) => {
        const next =
          typeof value === "function"
            ? (
                value as (
                  p: BehavioralAuthenticationState | null,
                ) => BehavioralAuthenticationState | null
              )(prev)
            : value;
        authenticationRef.current = next;
        return next;
      });
    },
    [],
  );

  /**
   * Authenticate one behavioral feature window using the trained
   * LightGBM + OC-SVM backend.
   *
   * The collector still sends the complete window to Aegis for storage.
   * The same window is additionally sent to the behavioral ML endpoint.
   */
  const authenticateWindow = useCallback(async (window: FeatureWindow) => {
    inFlightRef.current += 1;
    setIsAuthenticating(true);
    try {
      const result = await services.security.behavioralAuthenticate({
        dwellMeanMs: window.dwellMeanMs,
        dwellStdMs: window.dwellStdMs,
        flightMeanMs: window.flightMeanMs,
        flightStdMs: window.flightStdMs,
        velocityMean: window.velocityMean,
        accelerationMean: window.accelerationMean,
        accelerationStd: window.accelerationStd,
        curvatureMean: window.curvatureMean,
        curvatureStd: window.curvatureStd,
        clickCount: window.clickCount,
        scrollAmount: window.scrollAmount,
        mouseTravelPx: window.mouseTravelPx,
        keysPerSec: window.keysPerSec,
        velocityStd: window.velocityStd,
      });

      setAuthentication({
        lightgbmScore: result.lightgbmScore,
        ocsvmAnomalyScore: result.ocsvmAnomalyScore,
        fusedScore: result.fusedScore,
        decision: result.decision,
        authenticatedAt: new Date().toISOString(),
      });
      setWindowCount((c) => c + 1);
      setLastError(null);
      // A fresh WARN result re-arms the banner even if an older WARN was
      // dismissed. A fresh ALLOW/CHALLENGE clears any stale dismissal.
      if (result.decision !== "WARN") {
        setDismissedWarnScore(null);
      } else {
        setDismissedWarnScore((prev) => (prev === result.fusedScore ? prev : null));
      }
      // Any NEW backend result re-arms a previously cleared CHALLENGE: the
      // modal only stays closed while clearance is newer than the latest
      // result (compared by timestamp in the sentinel component).
      console.debug("[BehavioralML] Authentication result:", result);
    } catch (error) {
      console.warn(
        "[BehavioralML] Remote authentication endpoint error, using local Weighted Fusion:",
        error,
      );
      try {
        const { predictWeightedFusion } = await import("./fusion-engine");
        const currentSessionId = localStorage.getItem("ag_session_id");
        const currentEmail = localStorage.getItem("ag_user_email");
        const targetId = currentEmail || currentSessionId;
        const fallbackResult = predictWeightedFusion(targetId, {
          dwellMeanMs: window.dwellMeanMs,
          dwellStdMs: window.dwellStdMs,
          flightMeanMs: window.flightMeanMs,
          flightStdMs: window.flightStdMs,
          velocityMean: window.velocityMean,
          accelerationMean: window.accelerationMean,
          accelerationStd: window.accelerationStd,
          curvatureMean: window.curvatureMean,
          curvatureStd: window.curvatureStd,
          clickCount: window.clickCount,
          scrollAmount: window.scrollAmount,
          mouseTravelPx: window.mouseTravelPx,
          keysPerSec: window.keysPerSec,
          velocityStd: window.velocityStd,
        });

        setAuthentication({
          lightgbmScore: fallbackResult.lightgbmScore,
          ocsvmAnomalyScore: fallbackResult.ocsvmAnomalyScore,
          fusedScore: fallbackResult.fusedScore,
          decision: fallbackResult.decision,
          authenticatedAt: new Date().toISOString(),
        });
        setWindowCount((c) => c + 1);
        setLastError(null);

        if (fallbackResult.decision !== "WARN") {
          setDismissedWarnScore(null);
        } else {
          setDismissedWarnScore((prev) => (prev === fallbackResult.fusedScore ? prev : null));
        }
      } catch (fallbackErr) {
        const message =
          fallbackErr instanceof Error ? fallbackErr.message : "Authentication failed";
        setLastError(message);
      }
    } finally {
      inFlightRef.current = Math.max(0, inFlightRef.current - 1);
      if (inFlightRef.current === 0) setIsAuthenticating(false);
    }
  }, []);

  /**
   * Submit collected windows to the existing behavioral event backend
   * and run ML authentication on each completed window.
   */
  const submitWindows = useCallback(
    async (windows: FeatureWindow[]) => {
      if (windows.length === 0) return;

      const sessionId = getCurrentSessionId() ?? undefined;
      const deviceId = getDeviceId();

      // Always persist completed windows to localStorage so they accumulate
      // for CSV/JSON export via the telemetry dock — regardless of export mode.
      try {
        appendStoredWindows(windows, sessionId);
      } catch {
        // non-critical — don't block authentication pipeline
      }

      // Preserve the existing behavioral data collection pipeline.
      await services.aegis.submitBatch?.(windows, sessionId, deviceId)?.catch((error) => {
        console.warn("[BehavioralCollector] Backend batch submission failed:", error);
      });

      // Run behavioral ML authentication for each feature window.
      //
      // We intentionally process them sequentially so multiple windows
      // cannot overwrite the displayed authentication result out of order.
      for (const window of windows) {
        await authenticateWindow(window);
      }
    },
    [authenticateWindow],
  );

  const startCollection = useCallback(() => {
    if (collectorRef.current) return;

    const collector = new BehavioralCollector();
    collectorRef.current = collector;

    const behavioralSvc: BehavioralService = {
      async submitBatch(windows: FeatureWindow[]) {
        await submitWindows(windows);
      },
    };

    collector.start((windows) => {
      return behavioralSvc.submitBatch(windows);
    });

    statusTimerRef.current = setInterval(() => {
      setStatus(collector.getStatus());
    }, 250);

    setStatus(collector.getStatus());

    console.debug("[BehavioralCollector] Collection started");
  }, [submitWindows]);

  const stopCollection = useCallback(() => {
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    const collector = collectorRef.current;

    if (collector) {
      // Dump session BEFORE stop because stop() empties buffers.
      let dump: BehavioralSessionDump | null = null;

      if (isExportMode()) {
        dump = collector.dumpSession();
      }

      const remaining = collector.stop();
      collectorRef.current = null;

      // Persist session to localStorage in export mode.
      if (dump && dump.windows.length > 0) {
        persistSession(dump);
      }

      // Authenticate and submit any remaining partial window(s) only if still logged in
      if (remaining.length > 0 && !!localStorage.getItem("ag_access_token")) {
        submitWindows(remaining);
      }

      setStatus(initialCollectorStatus);
    }
  }, [submitWindows]);

  /** Record a successful step-up verification → clears CHALLENGE modal. */
  const markChallengeCleared = useCallback(() => {
    setChallengeClearedAt(new Date().toISOString());
  }, []);

  /**
   * Dismiss the WARN banner for the current result only.
   * Never logs out, never clears tokens, never stops the collector.
   */
  const dismissWarning = useCallback(() => {
    // Capture the current fused score at call time via the ref snapshot
    // (avoids the stale-closure pitfall of reading state in a callback).
    const current = authenticationRef.current;
    if (current) setDismissedWarnScore(current.fusedScore);
  }, []);

  const [verification, setVerification] =
    useState<VerificationSessionStatus>(initialVerificationStatus);
  const verificationInProgressRef = useRef(false);

  /**
   * Start a brand new, isolated verification window for step-up auth.
   * Resets verification telemetry buffers, transitions to COLLECTING.
   * Does NOT flush the suspicious continuous window into verification.
   */
  const startVerification = useCallback((): string => {
    if (!collectorRef.current) return "";
    const attemptId = `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const windowId = collectorRef.current.startVerificationWindow(attemptId);

    verificationInProgressRef.current = false;
    setVerification({
      state: "COLLECTING",
      attemptId,
      windowId,
      startedAt: Date.now(),
      progress: collectorRef.current.getVerificationProgress(),
      error: null,
      lastDecision: null,
      lastFusedScore: null,
    });

    console.debug(
      `[BehavioralVerification] Started attempt ${attemptId} on fresh window ${windowId}`,
    );
    return attemptId;
  }, []);

  /**
   * Cancel active verification attempt.
   */
  const cancelVerification = useCallback(() => {
    if (collectorRef.current) {
      collectorRef.current.cancelVerificationWindow();
    }
    verificationInProgressRef.current = false;
    setVerification(initialVerificationStatus);
    console.debug("[BehavioralVerification] Cancelled active verification attempt");
  }, []);

  /**
   * Submit the fresh verification window to LightGBM + OC-SVM.
   * Validates minimum behavioral data and locks against concurrent requests.
   */
  const submitVerification = useCallback(async (): Promise<boolean> => {
    if (!collectorRef.current) return false;
    if (verificationInProgressRef.current) {
      console.warn("[BehavioralVerification] Verification already in progress");
      return false;
    }

    if (!collectorRef.current.isVerificationReady()) {
      console.warn("[BehavioralVerification] Cannot submit: insufficient fresh behavioral data");
      setVerification((prev) => ({
        ...prev,
        state: "COLLECTING",
        error:
          "Keep interacting naturally. We need a little more behavioral data to complete verification.",
      }));
      return false;
    }

    const featureWindow = collectorRef.current.freezeVerificationWindow();
    if (!featureWindow) {
      setVerification((prev) => ({
        ...prev,
        state: "ERROR",
        error: "Failed to construct fresh behavioral verification window.",
      }));
      return false;
    }

    verificationInProgressRef.current = true;
    setVerification((prev) => ({
      ...prev,
      state: "VERIFYING",
      error: null,
    }));

    try {
      console.debug(
        `[BehavioralVerification] Submitting fresh window ${featureWindow.windowId} to ML models...`,
        {
          keys: featureWindow.dwellMeanMs,
          travel: featureWindow.mouseTravelPx,
        },
      );

      const result = await services.security.behavioralAuthenticate({
        dwellMeanMs: featureWindow.dwellMeanMs,
        dwellStdMs: featureWindow.dwellStdMs,
        flightMeanMs: featureWindow.flightMeanMs,
        flightStdMs: featureWindow.flightStdMs,
        velocityMean: featureWindow.velocityMean,
        accelerationMean: featureWindow.accelerationMean,
        accelerationStd: featureWindow.accelerationStd,
        curvatureMean: featureWindow.curvatureMean,
        curvatureStd: featureWindow.curvatureStd,
        clickCount: featureWindow.clickCount,
        scrollAmount: featureWindow.scrollAmount,
        mouseTravelPx: featureWindow.mouseTravelPx,
        keysPerSec: featureWindow.keysPerSec,
        velocityStd: featureWindow.velocityStd,
      });

      console.debug("[BehavioralVerification] ML Decision:", result);

      // Update global continuous authentication state to reflect latest ML decision
      setAuthentication({
        lightgbmScore: result.lightgbmScore,
        ocsvmAnomalyScore: result.ocsvmAnomalyScore,
        fusedScore: result.fusedScore,
        decision: result.decision,
        authenticatedAt: new Date().toISOString(),
      });

      if (result.decision === "ALLOW") {
        setVerification((prev) => ({
          ...prev,
          state: "SUCCESS",
          lastDecision: result.decision,
          lastFusedScore: result.fusedScore,
          error: null,
        }));
        // Mark challenge cleared so the challenge modal & pill dismiss cleanly
        markChallengeCleared();
        return true;
      } else {
        setVerification((prev) => ({
          ...prev,
          state: "FAILED",
          lastDecision: result.decision,
          lastFusedScore: result.fusedScore,
          error: "Your recent behavioral pattern still differs from your established profile.",
        }));
        return false;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Verification service could not process request.";
      console.error("[BehavioralVerification] Verification API error:", err);
      setVerification((prev) => ({
        ...prev,
        state: "ERROR",
        error: msg,
      }));
      return false;
    } finally {
      verificationInProgressRef.current = false;
    }
  }, [markChallengeCleared, setAuthentication]);

  const dumpSession = useCallback((): BehavioralSessionDump | null => {
    return collectorRef.current?.dumpSession() ?? null;
  }, []);

  const getWindows = useCallback((): FeatureWindow[] => {
    return collectorRef.current?.getWindows() ?? [];
  }, []);

  const getLatestFeatures = useCallback((): Record<string, number> | null => {
    return collectorRef.current?.getLatestFeatures() ?? null;
  }, []);

  /**
   * Immediately finalize the current partial window and authenticate it.
   * Collection keeps running — this never pauses or stops the collector.
   * If the collector is idle (logged out), this is a no-op.
   */
  const authenticateNow = useCallback(() => {
    collectorRef.current?.flushNow();
  }, []);

  // Poll localStorage to detect authentication state changes.
  useEffect(() => {
    const TOKEN_KEY = "ag_access_token";

    const checkAuth = () => {
      const hasToken = !!localStorage.getItem(TOKEN_KEY);

      if (hasToken && !wasAuthenticatedRef.current) {
        wasAuthenticatedRef.current = true;
        startCollection();
      } else if (!hasToken && wasAuthenticatedRef.current) {
        wasAuthenticatedRef.current = false;
        stopCollection();
        setAuthentication(null);
        setLastError(null);
        setWindowCount(0);
        setDismissedWarnScore(null);
        setChallengeClearedAt(null);
        setVerification(initialVerificationStatus);
      }
    };

    // Check immediately on mount.
    checkAuth();

    // Poll every second for in-tab token changes.
    const timer = setInterval(checkAuth, 1000);

    return () => {
      clearInterval(timer);
      stopCollection();
    };
  }, [startCollection, stopCollection]);

  // Keep verification progress synchronized with collector tick
  useEffect(() => {
    if (verification.state === "COLLECTING" || verification.state === "READY_FOR_VERIFICATION") {
      const prog = collectorRef.current?.getVerificationProgress();
      if (prog) {
        const nextState: VerificationState = prog.isReady ? "READY_FOR_VERIFICATION" : "COLLECTING";
        if (
          verification.progress?.keystrokes !== prog.keystrokes ||
          verification.progress?.mouseMoves !== prog.mouseMoves ||
          verification.progress?.clicks !== prog.clicks ||
          verification.state !== nextState
        ) {
          setVerification((prev) => ({
            ...prev,
            state: prev.state === "VERIFYING" ? prev.state : nextState,
            progress: prog,
          }));
        }
      }
    }
  }, [status, verification.state, verification.progress]);

  return (
    <BehavioralCtx.Provider
      value={{
        status,
        dumpSession,
        getWindows,
        getLatestFeatures,
        authenticateNow,
        authentication,
        isAuthenticating,
        lastError,
        windowCount,
        dismissedWarnScore,
        dismissWarning,
        challengeClearedAt,
        markChallengeCleared,
        verification,
        startVerification,
        cancelVerification,
        submitVerification,
      }}
    >
      {children}
    </BehavioralCtx.Provider>
  );
}
