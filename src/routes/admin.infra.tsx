import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { useAdminInfra } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Network,
  Boxes,
  Container,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/admin/infra")({
  component: InfraPage,
});

function Gauge({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-4 bg-[oklch(0.225_0.035_264/0.55)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.16em] font-mono text-muted-foreground">
          {label}
        </span>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div data-numeric className="text-2xl font-semibold">
        {value}%
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background:
              value > 80
                ? "linear-gradient(90deg,#fb7185,#f43f5e)"
                : value > 60
                  ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                  : "linear-gradient(90deg,oklch(0.71 0.135 215),oklch(0.655 0.195 258))",
          }}
        />
      </div>
    </div>
  );
}

function InfraPage() {
  const infraQ = useAdminInfra();
  const infra = infraQ.data;
  return (
    <AsyncBoundary
      isLoading={infraQ.isLoading}
      error={infraQ.error as Error | null}
      isEmpty={!infra}
    >
      {infra ? (
        <div className="space-y-6">
          <header>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              Platform · infrastructure
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Infrastructure</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time compute, queues and worker fleet
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Gauge label="CPU" value={infra.cpu.value} icon={Cpu} />
            <Gauge label="Memory" value={infra.memory.value} icon={MemoryStick} />
            <Gauge label="Disk" value={infra.disk.value} icon={HardDrive} />
            <Gauge label="GPU" value={infra.gpu.value} icon={Activity} />
            <Gauge label="Network" value={infra.network.value} icon={Network} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InstrumentPanel eyebrow="Fleet" title="Containers & workers">
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Container className="size-3.5 text-cyan-300" />
                    Containers
                  </span>
                  <span data-numeric>{infra.containers}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Boxes className="size-3.5 text-cyan-300" />
                    Workers
                  </span>
                  <span data-numeric>{infra.workers}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ListChecks className="size-3.5 text-cyan-300" />
                    Inference queue
                  </span>
                  <span data-numeric>{infra.inferenceQueue}</span>
                </li>
              </ul>
            </InstrumentPanel>
            <InstrumentPanel eyebrow="Background jobs" title="Right now">
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Running</span>
                  <span data-numeric className="text-emerald-300">
                    {infra.jobsRunning}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Queued</span>
                  <span data-numeric>{infra.jobsQueued}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Failed</span>
                  <span data-numeric className="text-rose-300">
                    {infra.jobsFailed}
                  </span>
                </li>
              </ul>
            </InstrumentPanel>
            <InstrumentPanel eyebrow="Regions" title="Topology">
              <ul className="space-y-2.5 text-sm">
                {[
                  { r: "eu-west-1", s: "primary", up: "99.99%" },
                  { r: "us-east-1", s: "warm", up: "99.97%" },
                  { r: "ap-south-1", s: "warm", up: "99.98%" },
                ].map((row) => (
                  <li key={row.r} className="flex items-center justify-between">
                    <span className="font-mono text-xs">{row.r}</span>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                      {row.s}
                    </span>
                    <span data-numeric className="text-xs text-emerald-300">
                      {row.up}
                    </span>
                  </li>
                ))}
              </ul>
            </InstrumentPanel>
          </div>
        </div>
      ) : null}
    </AsyncBoundary>
  );
}
