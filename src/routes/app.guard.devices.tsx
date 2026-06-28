import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { DeviceCard, type Device } from "@/components/guard/device-card";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/guard/devices")({
  component: Devices,
});

const DEVICES: Device[] = [
  { id: "1", name: "MacBook Pro 14", kind: "laptop", os: "macOS 15.2", browser: "Safari 18", location: "Lisbon, PT", lastActive: "Now", confidence: 99.1, trust: 9.8, primary: true },
  { id: "2", name: "iPhone 15 Pro", kind: "phone", os: "iOS 18.2", browser: "Native app", location: "Lisbon, PT", lastActive: "2h ago", confidence: 97.4, trust: 9.4 },
  { id: "3", name: "iPad Air", kind: "tablet", os: "iPadOS 18.2", browser: "Safari", location: "Lisbon, PT", lastActive: "Yesterday", confidence: 95.8, trust: 9.0 },
  { id: "4", name: "Office iMac", kind: "desktop", os: "macOS 15.1", browser: "Chrome 131", location: "Lisbon, PT", lastActive: "3 days ago", confidence: 92.6, trust: 8.4 },
];

function Devices() {
  return (
    <>
      <PageHeader
        eyebrow="Identity"
        title="Trusted Devices"
        subtitle="Devices the Guardian recognizes as you."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[12px] hover:bg-white/[0.06]">
            <Plus className="h-3.5 w-3.5" /> Pair new device
          </button>
        }
      />
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {DEVICES.map((d) => <DeviceCard key={d.id} device={d} />)}
        <button
          className="grid min-h-[260px] place-items-center rounded-[24px] border border-dashed border-white/[0.1] bg-white/[0.01] text-muted-foreground transition-colors hover:border-white/[0.18] hover:text-foreground"
        >
          <div className="text-center">
            <Plus className="mx-auto h-6 w-6" />
            <div className="mt-2 text-[13px]">Pair a new device</div>
            <div className="mt-1 text-[11px] text-muted-foreground">It will be learned in the background.</div>
          </div>
        </button>
      </section>
    </>
  );
}
