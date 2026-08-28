import { getCurrentSessionId } from "../_transport/http";

/**
 * BehavioralCollector — Silent keystroke + mouse dynamics engine.
 *
 * Captures dwell time, flight time, typing rhythm from keydown/keyup events.
 * Captures velocity, acceleration, curvature, jerk from mouse events.
 * Aggregates into 30-second feature windows and flushes to backend.
 *
 * Privacy-safe: only key codes and timing data, never actual key values or form content.
 */

export interface KeystrokeEvent {
  kind: "keydown" | "keyup";
  keyCode: number;
  timestamp: number;
}

export interface MouseMoveSample {
  x: number;
  y: number;
  timestamp: number;
}

export interface MouseClickEvent {
  x: number;
  y: number;
  button: number;
  timestamp: number;
}

export interface ScrollEvent {
  deltaY: number;
  timestamp: number;
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
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  viewport: string;
  platform: string;
  timezone: string;
}

export interface CollectorStatus {
  state: "idle" | "collecting" | "paused";
  keystrokesCaptured: number;
  mouseEventsCaptured: number;
  windowsSent: number;
  windowsBuffered: number;
  uptimeMs: number;
}

export interface BehavioralSessionDump {
  sessionId: string;
  capturedAt: string;
  totalKeystrokes: number;
  totalMouseEvents: number;
  deviceInfo: DeviceInfo;
  windows: FeatureWindow[];
}

const FLUSH_INTERVAL_MS = 30000;
const MAX_BUFFERED_WINDOWS = 60;
const MAX_VELOCITY_PX_MS = 8;
/** Max time a key can be held before its entry is considered stale (ms). */
const STALE_KEYDOWN_MS = 10000;

type WindowCallback = (windows: FeatureWindow[]) => void | Promise<void>;

export class BehavioralCollector {
  private state: "idle" | "collecting" | "paused" = "idle";
  private onFlush: WindowCallback | null = null;

  // Keystroke buffers
  private keyDownTimes = new Map<number, number>();
  private dwellTimes: number[] = [];
  private flightTimes: number[] = [];
  private lastKeyDownAt = 0;
  private keyStrokeCount = 0;

  // Mouse buffers
  private mouseSamples: MouseMoveSample[] = [];
  private clickEvents: MouseClickEvent[] = [];
  private scrollDeltas: ScrollEvent[] = [];
  private mouseTravelPx = 0;
  private mouseEventCount = 0;

  // Window management
  private currentWindowStart = 0;
  private bufferedWindows: FeatureWindow[] = [];
  private windowsSent = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;

  // Bound handlers for cleanup
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: (e: MouseEvent) => void;
  private onClick: (e: MouseEvent) => void;
  private onWheel: (e: WheelEvent) => void;
  private onBeforeUnload: () => void;

  constructor() {
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onClick = this.handleClick.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.onBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  start(onFlush: WindowCallback): void {
    if (this.state === "collecting") return;

    this.onFlush = onFlush;
    this.state = "collecting";
    this.startedAt = Date.now();
    this.currentWindowStart = performance.now();

    // Reset session-level accumulators
    this.mouseTravelPx = 0;
    this.keyStrokeCount = 0;
    this.mouseEventCount = 0;
    this.windowsSent = 0;
    this.bufferedWindows = [];

    document.addEventListener("keydown", this.onKeyDown, { passive: true });
    document.addEventListener("keyup", this.onKeyUp, { passive: true });
    document.addEventListener("mousemove", this.onMouseMove, { passive: true });
    document.addEventListener("mousedown", this.onMouseDown, { passive: true });
    document.addEventListener("mouseup", this.onMouseUp, { passive: true });
    document.addEventListener("click", this.onClick, { passive: true });
    document.addEventListener("wheel", this.onWheel, { passive: true });
    window.addEventListener("beforeunload", this.onBeforeUnload);

    this.flushTimer = setInterval(() => {
      this.rotateWindow();
      this.flushWindows();
    }, FLUSH_INTERVAL_MS);

    console.debug(
      "[BehavioralCollector] Started — capturing keystroke dynamics & mouse dynamics",
      { deviceInfo: this.getDeviceInfo() },
    );
  }

  stop(): FeatureWindow[] {
    if (this.state !== "collecting") return [];

    this.state = "idle";
    if (this.flushTimer) clearInterval(this.flushTimer);

    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("beforeunload", this.onBeforeUnload);

    // Finalize the current window
    this.rotateWindow();
    const final = [...this.bufferedWindows];
    this.bufferedWindows = [];

    console.debug("[BehavioralCollector] Stopped", {
      keystrokes: this.keyStrokeCount,
      mouseEvents: this.mouseEventCount,
      windows: this.windowsSent + final.length,
    });

    return final;
  }

  getStatus(): CollectorStatus {
    return {
      state: this.state,
      keystrokesCaptured: this.keyStrokeCount,
      mouseEventsCaptured: this.mouseEventCount,
      windowsSent: this.windowsSent,
      windowsBuffered: this.bufferedWindows.length,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
    };
  }

  /** Returns all buffered (unflushed) feature windows without clearing them. */
  getWindows(): FeatureWindow[] {
    return [...this.bufferedWindows];
  }

  /**
   * Returns a complete session dump: all buffered windows plus metadata
   * suitable for ML training datasets.
   */
  dumpSession(): BehavioralSessionDump {
    this.rotateWindow();
    const windows = [...this.bufferedWindows];
    return {
      sessionId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      capturedAt: new Date().toISOString(),
      totalKeystrokes: this.keyStrokeCount,
      totalMouseEvents: this.mouseEventCount,
      deviceInfo: this.getDeviceInfo(),
      windows,
    };
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private handleKeyDown(e: KeyboardEvent): void {
    // Skip modifier-only and repeat events
    if (e.repeat) return;
    if (["Alt", "Control", "Shift", "Meta", "CapsLock", "Tab"].includes(e.key)) return;

    const now = performance.now();

    // Track this keydown for dwell time
    this.keyDownTimes.set(e.keyCode, now);

    // Compute flight time (time since last keydown)
    if (this.lastKeyDownAt > 0) {
      const flight = Math.min(2000, now - this.lastKeyDownAt);
      this.flightTimes.push(flight);
    }
    this.lastKeyDownAt = now;
    this.keyStrokeCount++;
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const downAt = this.keyDownTimes.get(e.keyCode);
    if (downAt == null) return;

    const now = performance.now();
    const dwell = Math.min(2000, now - downAt);
    this.dwellTimes.push(dwell);
    this.keyDownTimes.delete(e.keyCode);
  }

  private handleMouseMove(e: MouseEvent): void {
    this.mouseSamples.push({
      x: e.clientX,
      y: e.clientY,
      timestamp: performance.now(),
    });
    this.mouseEventCount++;

    // Keep buffer bounded
    if (this.mouseSamples.length > 2000) {
      this.computeMouseTravel(this.mouseSamples.splice(0, 1000));
    }
  }

  private handleMouseDown(_e: MouseEvent): void {
    // Track for click velocity context — captured in handleClick
  }

  private handleMouseUp(_e: MouseEvent): void {
    // Track for click velocity context — captured in handleClick
  }

  private handleClick(e: MouseEvent): void {
    this.clickEvents.push({
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      timestamp: performance.now(),
    });
    this.mouseEventCount++;

    if (this.clickEvents.length > 200) {
      this.clickEvents.splice(0, 100);
    }
  }

  private handleWheel(e: WheelEvent): void {
    this.scrollDeltas.push({
      deltaY: e.deltaY,
      timestamp: performance.now(),
    });
    this.mouseEventCount++;

    if (this.scrollDeltas.length > 200) {
      this.scrollDeltas.splice(0, 100);
    }
  }

  private handleBeforeUnload(): void {
    // Finalize current partial window before flushing
    this.rotateWindow();
    const sessionId = getCurrentSessionId();
    if (this.bufferedWindows.length > 0 && this.onFlush && sessionId) {
      const windows = [...this.bufferedWindows];
      this.bufferedWindows = [];
      // Use sendBeacon for reliable unload delivery
      const payload = JSON.stringify({ windows, sessionId });
      navigator.sendBeacon(
        `${import.meta.env?.VITE_API_BASE ?? "http://localhost:8000/api/v1"}/events/beacon`,
        new Blob([payload], { type: "application/json" }),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Window aggregation
  // ---------------------------------------------------------------------------

  private rotateWindow(): void {
    const now = performance.now();
    const windowEnd = now;
    const windowStart = this.currentWindowStart;
    const windowDurationMs = now - this.currentWindowStart;

    // Clean stale keydown entries (keydown fired but keyup never arrived)
    for (const [keyCode, downAt] of this.keyDownTimes) {
      if (now - downAt > STALE_KEYDOWN_MS) {
        this.keyDownTimes.delete(keyCode);
      }
    }

    // Snapshot mouse samples BEFORE computeMouseTravel consumes them
    const mouseSnapshot = [...this.mouseSamples];
    this.computeMouseTravel(this.mouseSamples.splice(0));

    // Snapshot and reset mouseTravelPx so each window gets only its own travel
    const windowMouseTravel = this.mouseTravelPx;
    this.mouseTravelPx = 0;

    const dwells = this.dwellTimes.splice(0);
    const flights = this.flightTimes.splice(0);
    const clicks = this.clickEvents.splice(0);
    const scrolls = this.scrollDeltas.splice(0);

    const features = this.computeFeatures(
      dwells,
      flights,
      clicks.length,
      scrolls,
      mouseSnapshot,
      windowDurationMs,
      windowMouseTravel,
    );

    this.bufferedWindows.push({
      windowStart,
      windowEnd,
      ...features,
      deviceInfo: this.getDeviceInfo(),
    });

    this.currentWindowStart = windowEnd;

    // Flush if buffer is full
    if (this.bufferedWindows.length >= MAX_BUFFERED_WINDOWS) {
      this.flushWindows();
    }
  }

  private computeFeatures(
    dwells: number[],
    flights: number[],
    clickCount: number,
    scrolls: ScrollEvent[],
    mouseSamples: MouseMoveSample[],
    windowDurationMs: number,
    mouseTravelPx: number,
  ): Omit<FeatureWindow, "windowStart" | "windowEnd" | "deviceInfo"> {
    const dwellMean = dwells.length ? mean(dwells) : 0;
    const dwellStd = dwells.length > 1 ? std(dwells, dwellMean) : 0;
    const flightMean = flights.length ? mean(flights) : 0;
    const flightStd = flights.length > 1 ? std(flights, flightMean) : 0;
    const windowSec = Math.max(windowDurationMs, 1000) / 1000;
    const keysPerSec = dwells.length / windowSec;

    // Mouse velocity, acceleration, curvature — use the snapshot passed in
    const { velMean, velStd, accMean, accStd, curvMean, curvStd } =
      this.computeMouseKinematics(mouseSamples);

    const scrollAmount = scrolls.reduce((s, e) => s + Math.abs(e.deltaY), 0);

    return {
      dwellMeanMs: round(dwellMean),
      dwellStdMs: round(dwellStd),
      flightMeanMs: round(flightMean),
      flightStdMs: round(flightStd),
      keysPerSec: round(keysPerSec, 2),
      velocityMean: round(velMean, 4),
      velocityStd: round(velStd, 4),
      accelerationMean: round(accMean, 6),
      accelerationStd: round(accStd, 6),
      curvatureMean: round(curvMean, 6),
      curvatureStd: round(curvStd, 6),
      clickCount,
      scrollAmount: round(scrollAmount),
      mouseTravelPx: round(mouseTravelPx),
    };
  }

  private computeMouseKinematics(samples: MouseMoveSample[]): {
    velMean: number;
    velStd: number;
    accMean: number;
    accStd: number;
    curvMean: number;
    curvStd: number;
  } {
    if (samples.length < 3) {
      return { velMean: 0, velStd: 0, accMean: 0, accStd: 0, curvMean: 0, curvStd: 0 };
    }

    const velocities: number[] = [];
    const accelerations: number[] = [];
    const curvatures: number[] = [];

    for (let i = 1; i < samples.length; i++) {
      const dt = samples[i].timestamp - samples[i - 1].timestamp;
      if (dt <= 0) continue;

      const dx = samples[i].x - samples[i - 1].x;
      const dy = samples[i].y - samples[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vel = Math.min(dist / dt, MAX_VELOCITY_PX_MS);
      velocities.push(vel);

      // Acceleration
      if (i >= 2 && velocities.length >= 2) {
        const prevVel = velocities[velocities.length - 2];
        const accDt = samples[i].timestamp - samples[i - 2].timestamp;
        if (accDt > 0) {
          accelerations.push((vel - prevVel) / accDt);
        }
      }

      // Curvature (angle change between consecutive segments)
      if (i >= 2) {
        const prevDx = samples[i - 1].x - samples[i - 2].x;
        const prevDy = samples[i - 1].y - samples[i - 2].y;
        const prevDist = Math.sqrt(prevDx * prevDx + prevDy * prevDy);

        if (dist > 0 && prevDist > 0) {
          const dot = (dx * prevDx + dy * prevDy) / (dist * prevDist);
          const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
          curvatures.push(angle);
        }
      }
    }

    const velMean = velocities.length ? mean(velocities) : 0;
    const velStd = velocities.length > 1 ? std(velocities, velMean) : 0;
    const accMean = accelerations.length ? mean(accelerations) : 0;
    const accStd = accelerations.length > 1 ? std(accelerations, accMean) : 0;
    const curvMean = curvatures.length ? mean(curvatures) : 0;
    const curvStd = curvatures.length > 1 ? std(curvatures, curvMean) : 0;

    return { velMean, velStd, accMean, accStd, curvMean, curvStd };
  }

  private computeMouseTravel(samples: MouseMoveSample[]): void {
    for (let i = 1; i < samples.length; i++) {
      const dx = samples[i].x - samples[i - 1].x;
      const dy = samples[i].y - samples[i - 1].y;
      this.mouseTravelPx += Math.sqrt(dx * dx + dy * dy);
    }
  }

  private flushWindows(): void {
    if (this.bufferedWindows.length === 0 || !this.onFlush) return;

    const batch = this.bufferedWindows.splice(0);
    this.windowsSent += batch.length;

    try {
      const result = this.onFlush(batch);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.warn("[BehavioralCollector] Flush failed:", err);
          // Re-queue for retry (drop if buffer would overflow)
          if (this.bufferedWindows.length + batch.length <= MAX_BUFFERED_WINDOWS * 2) {
            this.bufferedWindows.unshift(...batch);
          }
        });
      }
    } catch (err) {
      console.warn("[BehavioralCollector] Flush failed:", err);
    }
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform ?? "unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function std(values: number[], avg: number): number {
  const variance = values.reduce((s, v) => (s + (v - avg) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function round(v: number, decimals = 2): number {
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}
