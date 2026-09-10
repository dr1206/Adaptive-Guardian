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
} from "./collector";
import type { BehavioralService } from "./behavioral.contract";
import { services } from "../registry";
import { persistSession } from "./export";
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

interface BehavioralContextValue {
  status: CollectorStatus;
  dumpSession: () => BehavioralSessionDump | null;
  getWindows: () => FeatureWindow[];
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
}

export interface BehavioralAuthenticationState {
  lightgbmScore: number;
  ocsvmAnomalyScore: number;
  fusedScore: number;
  decision: "ALLOW" | "WARN" | "CHALLENGE" | string;
  authenticatedAt: string;
}

const BehavioralCtx = createContext<BehavioralContextValue>({
  status: {
    state: "idle",
    keystrokesCaptured: 0,
    mouseEventsCaptured: 0,
    windowsSent: 0,
    windowsBuffered: 0,
    uptimeMs: 0,
  },
  dumpSession: () => null,
  getWindows: () => [],
  authenticateNow: () => {},
  authentication: null,
  isAuthenticating: false,
  lastError: null,
  windowCount: 0,
  dismissedWarnScore: null,
  dismissWarning: () => {},
  challengeClearedAt: null,
  markChallengeCleared: () => {},
});

export function useBehavioralStatus(): CollectorStatus {
  return useContext(BehavioralCtx).status;
}

/**
 * Returns functions to dump/export the current session's behavioral data.
 */
export function useBehavioralExport() {
  const { dumpSession, getWindows } = useContext(BehavioralCtx);

  return {
    dumpSession,
    getWindows,
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

/** Set to true via env or URL param to auto-persist sessions to localStorage. */
function isExportMode(): boolean {
  if (import.meta.env?.VITE_BEHAVIORAL_EXPORT === "true") {
    return true;
  }

  return new URLSearchParams(window.location.search).has(
    "export-behavioral",
  );
}

export function BehavioralCollectorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<CollectorStatus>({
    state: "idle",
    keystrokesCaptured: 0,
    mouseEventsCaptured: 0,
    windowsSent: 0,
    windowsBuffered: 0,
    uptimeMs: 0,
  });

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
  const [authentication, setAuthenticationState] =
    useState<BehavioralAuthenticationState | null>(null);
  const setAuthentication = useCallback(
    (
      value:
        | BehavioralAuthenticationState
        | null
        | ((
            prev: BehavioralAuthenticationState | null,
          ) => BehavioralAuthenticationState | null),
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
        setDismissedWarnScore((prev) =>
          prev === result.fusedScore ? prev : null,
        );
      }
      // Any NEW backend result re-arms a previously cleared CHALLENGE: the
      // modal only stays closed while clearance is newer than the latest
      // result (compared by timestamp in the sentinel component).
      console.debug(
        "[BehavioralML] Authentication result:",
        result,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      setLastError(message);
      console.warn(
        "[BehavioralML] Authentication request failed:",
        error,
      );
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

      // Preserve the existing behavioral data collection pipeline.
      await services.aegis
        .submitBatch?.(windows, sessionId, deviceId)
        ?.catch((error) => {
          console.warn(
            "[BehavioralCollector] Backend batch submission failed:",
            error,
          );
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
    }, 2000);

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

      // Authenticate and submit any remaining partial window(s).
      if (remaining.length > 0) {
        submitWindows(remaining);
      }

      setStatus({
        state: "idle",
        keystrokesCaptured: 0,
        mouseEventsCaptured: 0,
        windowsSent: 0,
        windowsBuffered: 0,
        uptimeMs: 0,
      });
    }
  }, [submitWindows]);

  const dumpSession = useCallback((): BehavioralSessionDump | null => {
    return collectorRef.current?.dumpSession() ?? null;
  }, []);

  const getWindows = useCallback((): FeatureWindow[] => {
    return collectorRef.current?.getWindows() ?? [];
  }, []);

  /**
   * Immediately finalize the current partial window and authenticate it.
   * Collection keeps running — this never pauses or stops the collector.
   * If the collector is idle (logged out), this is a no-op.
   */
  const authenticateNow = useCallback(() => {
    collectorRef.current?.flushNow();
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

  /** Record a successful step-up verification → clears CHALLENGE modal. */
  const markChallengeCleared = useCallback(() => {
    setChallengeClearedAt(new Date().toISOString());
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

  return (
    <BehavioralCtx.Provider
      value={{
        status,
        dumpSession,
        getWindows,
        authenticateNow,
        authentication,
        isAuthenticating,
        lastError,
        windowCount,
        dismissedWarnScore,
        dismissWarning,
        challengeClearedAt,
        markChallengeCleared,
      }}
    >
      {children}
    </BehavioralCtx.Provider>
  );
}