/**
 * Behavioral data export utilities.
 *
 * Downloads feature windows as JSON (ML-ready) or CSV. Also provides
 * localStorage persistence so data accumulates across sessions for
 * bulk export before training.
 */

import type { BehavioralSessionDump, FeatureWindow } from "./collector";

const STORAGE_KEY = "ag_behavioral_dataset";

export interface StoredDataset {
  exportedAt: string;
  sessions: BehavioralSessionDump[];
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

function loadDataset(): StoredDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredDataset;
      if (Array.isArray(parsed.sessions)) return parsed;
    }
  } catch { /* corrupted */ }
  return { exportedAt: new Date().toISOString(), sessions: [] };
}

function saveDataset(ds: StoredDataset): void {
  ds.exportedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ds));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("[BehavioralExport] localStorage full — export and clear before collecting more");
    }
  }
}

/** Persist a session dump to localStorage (appends to existing dataset). */
export function persistSession(dump: BehavioralSessionDump): void {
  const ds = loadDataset();
  ds.sessions.push(dump);
  saveDataset(ds);
  console.debug(
    `[BehavioralExport] Session persisted — ${ds.sessions.length} total sessions, ${dump.windows.length} windows`,
  );
}

/** Returns the full accumulated dataset from localStorage. */
export function getStoredDataset(): StoredDataset {
  return loadDataset();
}

/** Clear the stored dataset. */
export function clearStoredDataset(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}

/** Number of sessions and total windows currently stored. */
export function datasetStats(): { sessions: number; windows: number } {
  const ds = loadDataset();
  return {
    sessions: ds.sessions.length,
    windows: ds.sessions.reduce((sum, s) => sum + s.windows.length, 0),
  };
}

// ---------------------------------------------------------------------------
// File download
// ---------------------------------------------------------------------------

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Downloads feature windows as a JSON file — ready for ML training.
 * Each window is one training sample with all extracted features.
 */
export function downloadAsJson(
  windows: FeatureWindow[],
  label?: string,
): void {
  const records = windows.map((w) => ({
    dwellMeanMs: w.dwellMeanMs,
    dwellStdMs: w.dwellStdMs,
    flightMeanMs: w.flightMeanMs,
    flightStdMs: w.flightStdMs,
    keysPerSec: w.keysPerSec,
    velocityMean: w.velocityMean,
    velocityStd: w.velocityStd,
    accelerationMean: w.accelerationMean,
    accelerationStd: w.accelerationStd,
    curvatureMean: w.curvatureMean,
    curvatureStd: w.curvatureStd,
    clickCount: w.clickCount,
    scrollAmount: w.scrollAmount,
    mouseTravelPx: w.mouseTravelPx,
    windowDurationMs: w.windowEnd - w.windowStart,
    platform: w.deviceInfo.platform,
    viewport: w.deviceInfo.viewport,
    userLabel: label ?? null,
  }));

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadBlob(JSON.stringify(records, null, 2), `behavioral-windows-${ts}.json`, "application/json");
}

/**
 * Downloads feature windows as CSV — one row per window.
 * Compatible with pandas, scikit-learn, etc.
 */
export function downloadAsCsv(
  windows: FeatureWindow[],
  label?: string,
): void {
  const header = [
    "dwellMeanMs", "dwellStdMs", "flightMeanMs", "flightStdMs",
    "keysPerSec", "velocityMean", "velocityStd", "accelerationMean",
    "accelerationStd", "curvatureMean", "curvatureStd", "clickCount",
    "scrollAmount", "mouseTravelPx", "windowDurationMs", "platform",
    "viewport", "userLabel",
  ];

  const rows = windows.map((w) => [
    w.dwellMeanMs, w.dwellStdMs, w.flightMeanMs, w.flightStdMs,
    w.keysPerSec, w.velocityMean, w.velocityStd, w.accelerationMean,
    w.accelerationStd, w.curvatureMean, w.curvatureStd, w.clickCount,
    w.scrollAmount, w.mouseTravelPx, w.windowEnd - w.windowStart,
    `"${w.deviceInfo.platform}"`, `"${w.deviceInfo.viewport}"`,
    label ?? "",
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadBlob(csv, `behavioral-windows-${ts}.csv`, "text/csv");
}

/**
 * Exports the full localStorage dataset as a single JSON file.
 * Each window is tagged with its sessionId for grouping.
 */
export function downloadFullDataset(): void {
  const ds = loadDataset();
  const flat: Record<string, unknown>[] = [];

  for (const session of ds.sessions) {
    for (const w of session.windows) {
      flat.push({
        sessionId: session.sessionId,
        capturedAt: session.capturedAt,
        dwellMeanMs: w.dwellMeanMs,
        dwellStdMs: w.dwellStdMs,
        flightMeanMs: w.flightMeanMs,
        flightStdMs: w.flightStdMs,
        keysPerSec: w.keysPerSec,
        velocityMean: w.velocityMean,
        velocityStd: w.velocityStd,
        accelerationMean: w.accelerationMean,
        accelerationStd: w.accelerationStd,
        curvatureMean: w.curvatureMean,
        curvatureStd: w.curvatureStd,
        clickCount: w.clickCount,
        scrollAmount: w.scrollAmount,
        mouseTravelPx: w.mouseTravelPx,
        windowDurationMs: w.windowEnd - w.windowStart,
        platform: w.deviceInfo.platform,
        viewport: w.deviceInfo.viewport,
      });
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadBlob(
    JSON.stringify({ exportedAt: new Date().toISOString(), sessions: ds.sessions.length, windows: flat }, null, 2),
    `behavioral-dataset-${ts}.json`,
    "application/json",
  );
}
