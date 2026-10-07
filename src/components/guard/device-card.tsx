import { Laptop, Smartphone, Tablet, Monitor, MapPin, MoreHorizontal } from "lucide-react";
import { ConfidenceRing } from "./confidence-ring";

const ICONS = { laptop: Laptop, phone: Smartphone, tablet: Tablet, desktop: Monitor };

export type Device = {
  id: string;
  name: string;
  kind: keyof typeof ICONS;
  os: string;
  browser: string;
  location: string;
  lastActive: string;
  confidence: number;
  trust: number;
  primary?: boolean;
};

export function DeviceCard({ device }: { device: Device }) {
  const Icon = ICONS[device.kind];
  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
      <header className="relative flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          {device.primary && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Primary Device
            </span>
          )}
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative mt-4">
        <div className="font-display text-[16px] font-medium tracking-tight">{device.name}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">
          {device.os} · {device.browser}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {device.location}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Last active
          </div>
          <div className="mt-0.5 font-numeric text-[13px] tabular-nums">{device.lastActive}</div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Trust {device.trust.toFixed(1)} / 10
          </div>
        </div>
        <ConfidenceRing
          value={device.confidence}
          size="md"
          label="Recognition"
          showShield={false}
        />
      </div>

      <footer className="relative mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4">
        <button className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] py-2 text-[12px] hover:bg-white/[0.04]">
          Rename
        </button>
        <button className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] py-2 text-[12px] hover:bg-white/[0.04]">
          Trust again
        </button>
        <button className="flex-1 rounded-xl border border-danger/25 bg-danger/5 py-2 text-[12px] text-danger hover:bg-danger/10">
          Remove
        </button>
      </footer>
    </article>
  );
}
