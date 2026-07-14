import { useCallback, useEffect, useState } from "react";
import {
  clearStoredDataset,
  datasetStats,
  downloadAsCsv,
  downloadAsJson,
  downloadFullDataset,
} from "./export";
import { useBehavioralExport, useBehavioralStatus } from "./BehavioralCollectorProvider";

export function BehavioralExportPanel() {
  const { dumpSession, getWindows } = useBehavioralExport();
  const status = useBehavioralStatus();
  const [label, setLabel] = useState("");
  const [stats, setStats] = useState(() => datasetStats());

  const refreshStats = useCallback(() => setStats(datasetStats()), []);

  useEffect(() => {
    const id = setInterval(refreshStats, 3000);
    return () => clearInterval(id);
  }, [refreshStats]);

  const handleExportJson = () => {
    const dump = dumpSession();
    if (dump && dump.windows.length > 0) {
      downloadAsJson(dump.windows, label || undefined);
    } else {
      const windows = getWindows();
      if (windows.length > 0) downloadAsJson(windows, label || undefined);
    }
  };

  const handleExportCsv = () => {
    const dump = dumpSession();
    if (dump && dump.windows.length > 0) {
      downloadAsCsv(dump.windows, label || undefined);
    } else {
      const windows = getWindows();
      if (windows.length > 0) downloadAsCsv(windows, label || undefined);
    }
  };

  const handleExportFull = () => {
    downloadFullDataset();
    refreshStats();
  };

  const handleClear = () => {
    clearStoredDataset();
    refreshStats();
  };

  if (status.state !== "collecting") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 99999,
        background: "#0A1628",
        border: "1px solid rgba(212,175,55,0.3)",
        borderRadius: 12,
        padding: 16,
        minWidth: 260,
        fontFamily: "monospace",
        fontSize: 11,
        color: "#cbd5e1",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong style={{ color: "#d4af37", fontSize: 12 }}>Behavioral Export</strong>
        <span style={{ color: "#22c55e", fontSize: 10 }}>● {status.windowsSent + status.windowsBuffered} windows</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="User label (e.g. user_01)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{
            width: "100%",
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#f1f5f9",
            fontSize: 11,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Btn onClick={handleExportJson}>JSON</Btn>
        <Btn onClick={handleExportCsv}>CSV</Btn>
        <Btn onClick={handleExportFull} disabled={stats.windows === 0}>
          All ({stats.windows})
        </Btn>
        <Btn onClick={handleClear} disabled={stats.windows === 0} danger>
          Clear
        </Btn>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: "#64748b" }}>
        {stats.sessions > 0
          ? `${stats.sessions} sessions · ${stats.windows} windows stored`
          : "Add ?export-behavioral to URL & collect data"}
      </div>
    </div>
  );
}

function Btn({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "3px 10px",
        borderRadius: 6,
        border: `1px solid ${danger ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.12)"}`,
        background: danger ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
        color: disabled ? "#475569" : danger ? "#fca5a5" : "#e2e8f0",
        fontSize: 11,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
