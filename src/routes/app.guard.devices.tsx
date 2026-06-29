import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { DeviceCard } from "@/components/guard/device-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useDeviceProfiles } from "@/services/hooks";
import { asyncStateFromQuery } from "@/lib/async-state";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/guard/devices")({
  component: Devices,
});

function Devices() {
  const devicesQ = useDeviceProfiles();
  const devices = devicesQ.data ?? [];
  const state = asyncStateFromQuery(devicesQ);

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
      <AsyncBoundary state={state} variant="cards">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
          <button className="grid min-h-[260px] place-items-center rounded-[24px] border border-dashed border-white/[0.1] bg-white/[0.01] text-muted-foreground transition-colors hover:border-white/[0.18] hover:text-foreground">
            <div className="text-center">
              <Plus className="mx-auto h-6 w-6" />
              <div className="mt-2 text-[13px]">Pair a new device</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                It will be learned in the background.
              </div>
            </div>
          </button>
        </section>
      </AsyncBoundary>
    </>
  );
}
