import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { BehavioralCollector, type BehavioralSessionDump, type CollectorStatus, type FeatureWindow } from "./collector";
import type { BehavioralService } from "./behavioral.contract";
import { services } from "../registry";
import { persistSession } from "./export";

interface BehavioralContextValue {
  status: CollectorStatus;
  /** Dumps the current session and optionally persists to localStorage. */
  dumpSession: () => BehavioralSessionDump | null;
  /** Returns currently buffered windows without clearing. */
  getWindows: () => FeatureWindow[];
}

const BehavioralCtx = createContext<BehavioralContextValue>({
  status: { state: "idle", keystrokesCaptured: 0, mouseEventsCaptured: 0, windowsSent: 0, windowsBuffered: 0, uptimeMs: 0 },
  dumpSession: () => null,
  getWindows: () => [],
});

export function useBehavioralStatus(): CollectorStatus {
  return useContext(BehavioralCtx).status;
}

/** Returns functions to dump/export the current session's behavioral data. */
export function useBehavioralExport() {
  const { dumpSession, getWindows } = useContext(BehavioralCtx);
  return { dumpSession, getWindows };
}

/** Set to true via env or URL param to auto-persist sessions to localStorage. */
function isExportMode(): boolean {
  if (import.meta.env?.VITE_BEHAVIORAL_EXPORT === "true") return true;
  return new URLSearchParams(window.location.search).has("export-behavioral");
}

export function BehavioralCollectorProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CollectorStatus>({
    state: "idle",
    keystrokesCaptured: 0,
    mouseEventsCaptured: 0,
    windowsSent: 0,
    windowsBuffered: 0,
    uptimeMs: 0,
  });

  const collectorRef = useRef<BehavioralCollector | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasAuthenticatedRef = useRef(false);

  const startCollection = useCallback(() => {
    if (collectorRef.current) return;

    const collector = new BehavioralCollector();
    collectorRef.current = collector;

    const behavioralSvc: BehavioralService = {
      async submitBatch(windows: FeatureWindow[]) {
        await services.aegis.submitBatch?.(windows)?.catch(() => null);
      },
    };

    collector.start((windows) => {
      behavioralSvc.submitBatch(windows);
    });

    statusTimerRef.current = setInterval(() => {
      setStatus(collector.getStatus());
    }, 2000);

    setStatus(collector.getStatus());
  }, []);

  const stopCollection = useCallback(() => {
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    const collector = collectorRef.current;
    if (collector) {
      // Dump session BEFORE stop — stop() empties buffers and dump would return empty
      let dump: BehavioralSessionDump | null = null;
      if (isExportMode()) {
        dump = collector.dumpSession();
      }

      const remaining = collector.stop();
      collectorRef.current = null;

      // Persist session to localStorage in export mode
      if (dump && dump.windows.length > 0) {
        persistSession(dump);
      }

      if (remaining.length > 0) {
        const behavioralSvc: BehavioralService = {
          async submitBatch(windows: FeatureWindow[]) {
            await services.aegis.submitBatch?.(windows)?.catch(() => null);
          },
        };
        behavioralSvc.submitBatch(remaining);
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
  }, []);

  const dumpSession = useCallback((): BehavioralSessionDump | null => {
    return collectorRef.current?.dumpSession() ?? null;
  }, []);

  const getWindows = useCallback((): FeatureWindow[] => {
    return collectorRef.current?.getWindows() ?? [];
  }, []);

  // Poll localStorage to detect auth state changes within the same tab
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
      }
    };

    // Check immediately on mount
    checkAuth();

    // Poll every second for in-tab token changes
    const timer = setInterval(checkAuth, 1000);

    return () => {
      clearInterval(timer);
      stopCollection();
    };
  }, [startCollection, stopCollection]);

  return (
    <BehavioralCtx.Provider value={{ status, dumpSession, getWindows }}>
      {children}
    </BehavioralCtx.Provider>
  );
}
