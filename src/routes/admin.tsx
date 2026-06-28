import { createFileRoute, Outlet } from "@tanstack/react-router";
import { VaultAtmosphere } from "@/components/auth/vault-atmosphere";
import { OpsRail } from "@/components/admin/ops-rail";
import { OpsTopBar, OpsStatusBar } from "@/components/admin/ops-chrome";
import { AegisConsole } from "@/components/admin/aegis-console";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen text-foreground">
      <VaultAtmosphere intensity={0.35} />
      {/* Faint cockpit graticule */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <OpsRail />
      <main className="ml-[268px] mr-6 pb-12 relative z-10">
        <OpsTopBar />
        <Outlet />
      </main>
      <OpsStatusBar />
      <AegisConsole />
    </div>
  );
}
