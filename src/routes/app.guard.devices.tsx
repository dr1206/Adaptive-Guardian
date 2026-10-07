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
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-[12px] font-medium text-foreground shadow-xs transition-colors hover:bg-muted">
            <Plus className="h-4 w-4 text-primary" /> Register New Device
          </button>
        }
      />
      <AsyncBoundary state={state} variant="cards">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
          <button className="grid min-h-[240px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/30 hover:text-foreground">
            <div className="text-center">
              <Plus className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-[13px] font-semibold text-foreground">
                Register a new device
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">
                Biometric profile will learn your rhythm seamlessly.
              </div>
            </div>
          </button>
        </section>
      </AsyncBoundary>
    </>
  );
}
