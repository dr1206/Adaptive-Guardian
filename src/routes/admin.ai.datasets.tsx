import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { OpsTable } from "@/components/admin/ops-table";
import { useAdminDatasets } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Database, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/ai/datasets")({
  component: DatasetsPage,
});

function DatasetsPage() {
  const datasetsQ = useAdminDatasets();
  const datasets = datasetsQ.data ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    toast.success("Dataset upload started", { description: e.target.files?.[0]?.name });
  };
  return (
    <AsyncBoundary
      isLoading={datasetsQ.isLoading}
      error={datasetsQ.error as Error | null}
      isEmpty={datasets.length === 0}
    >
      <div className="space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              AI core · datasets
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Datasets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Versioned training data with lineage to deployed models
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl gradient-primary px-3 py-2 text-xs inline-flex items-center gap-1.5 shadow-glow"
          >
            <Upload className="size-3.5" />
            Upload
          </button>
          <input
            type="file"
            accept=".csv,.json,.zip"
            ref={fileRef}
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </header>

        <OpsTable
          rows={datasets}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "id",
              label: "Dataset",
              width: "1.2fr",
              render: (r) => (
                <span className="flex items-center gap-2">
                  <Database className="size-3.5 text-cyan-300" />
                  <span className="font-mono text-xs">{r.id}</span>
                </span>
              ),
            },
            {
              key: "v",
              label: "Ver",
              width: "0.4fr",
              render: (r) => <span className="font-mono text-xs">{r.version}</span>,
            },
            {
              key: "samples",
              label: "Samples",
              width: "0.8fr",
              align: "right",
              render: (r) => (
                <span data-numeric className="text-xs">
                  {r.samples.toLocaleString()}
                </span>
              ),
            },
            {
              key: "users",
              label: "Users",
              width: "0.7fr",
              align: "right",
              render: (r) => (
                <span data-numeric className="text-xs">
                  {r.users.toLocaleString()}
                </span>
              ),
            },
            {
              key: "feat",
              label: "Features",
              width: "0.5fr",
              align: "right",
              render: (r) => (
                <span data-numeric className="text-xs">
                  {r.features}
                </span>
              ),
            },
            {
              key: "qual",
              label: "Quality",
              width: "0.7fr",
              render: (r) => (
                <span className="flex items-center gap-2">
                  <span className="w-16 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <span
                      className="block h-full gradient-cyber"
                      style={{ width: `${r.quality * 100}%` }}
                    />
                  </span>
                  <span data-numeric className="text-[11px] text-emerald-300">
                    {(r.quality * 100).toFixed(1)}%
                  </span>
                </span>
              ),
            },
            {
              key: "cov",
              label: "Coverage",
              width: "0.7fr",
              render: (r) => (
                <span data-numeric className="text-xs">
                  {(r.coverage * 100).toFixed(1)}%
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              width: "0.7fr",
              render: (r) => {
                const m: Record<string, string> = {
                  production: "text-emerald-300 bg-emerald-500/10",
                  staging: "text-cyan-300 bg-cyan-500/10",
                  draft: "text-muted-foreground bg-white/[0.04]",
                };
                return (
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${m[r.status]}`}
                  >
                    {r.status}
                  </span>
                );
              },
            },
            {
              key: "created",
              label: "Created",
              width: "0.7fr",
              align: "right",
              render: (r) => (
                <span className="font-mono text-[11px] text-muted-foreground">{r.created}</span>
              ),
            },
          ]}
        />

        <InstrumentPanel eyebrow="Feature coverage · ds-2026.06-B" title="Quality heatmap">
          <div className="grid grid-cols-16 gap-1">
            {Array.from({ length: 64 }).map((_, i) => {
              const q = 0.6 + (Math.sin(i * 1.3) + 1) * 0.2;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: `oklch(${0.3 + q * 0.4} ${0.08 + q * 0.18} 215 / ${0.2 + q * 0.8})`,
                  }}
                  title={`feature ${i}: ${(q * 100).toFixed(0)}%`}
                />
              );
            })}
          </div>
          <div className="mt-3 text-[11px] font-mono text-muted-foreground flex justify-between">
            <span>188 features</span>
            <span>2 below threshold · mouse.curvature · session.idle_var</span>
          </div>
        </InstrumentPanel>
      </div>
    </AsyncBoundary>
  );
}
