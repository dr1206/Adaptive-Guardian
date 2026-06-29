import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { VaultAtmosphere } from "@/components/auth/vault-atmosphere";
import { OpsRail } from "@/components/admin/ops-rail";
import { OpsTopBar, OpsStatusBar } from "@/components/admin/ops-chrome";
import { AegisConsole } from "@/components/admin/aegis-console";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [open, setOpen] = useState(false);

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

      {/* Desktop rail */}
      <div className="hidden xl:block">
        <OpsRail />
      </div>

      {/* Mobile/tablet top bar */}
      <header className="xl:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-[oklch(0.16_0.025_264/0.92)] px-4 py-3 backdrop-blur-xl">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open admin navigation"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[260px] border-white/[0.06] bg-[oklch(0.16_0.025_264/0.98)] p-0 backdrop-blur-2xl"
          >
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="h-full overflow-y-auto" onClick={() => setOpen(false)}>
              <OpsRail variant="drawer" />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg gradient-cyber flex items-center justify-center font-bold text-xs">
            A
          </div>
          <span className="text-sm font-semibold truncate">AdaptiveGuard · Cockpit</span>
        </div>
      </header>

      <main
        id="main"
        className="xl:ml-[268px] mr-4 sm:mr-6 ml-4 sm:ml-6 xl:ml-[268px] pb-12 xl:pb-16 relative z-10"
      >
        <OpsTopBar />
        <Outlet />
      </main>
      <OpsStatusBar />
      <AegisConsole />
    </div>
  );
}
