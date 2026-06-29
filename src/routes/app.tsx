import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { VaultAtmosphere } from "@/components/auth/vault-atmosphere";
import { VaultRail } from "@/components/dashboard/vault-rail";
import { CommandBar } from "@/components/dashboard/command-bar";
import { SecurityStrip } from "@/components/banking/security-strip";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Shield } from "@/components/brand/shield";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground">
      <VaultAtmosphere intensity={0.85} />

      {/* Desktop rail */}
      <div className="hidden lg:block">
        <VaultRail />
      </div>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-[oklch(0.16_0.025_264/0.88)] px-4 py-3 backdrop-blur-xl">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open navigation menu"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] border-white/[0.06] bg-[oklch(0.16_0.025_264/0.98)] p-0 backdrop-blur-2xl"
          >
            <VisuallyHidden>
              <SheetTitle>Navigation</SheetTitle>
            </VisuallyHidden>
            <div className="h-full overflow-y-auto" onClick={() => setOpen(false)}>
              <VaultRail variant="drawer" />
            </div>
          </SheetContent>
        </Sheet>
        <a href="/app" className="flex items-center gap-2">
          <Shield size={22} live />
          <span className="font-display text-[14px] font-semibold lowercase tracking-tight">
            adaptiveguard<span className="text-accent">.ai</span>
          </span>
        </a>
      </header>

      <main
        id="main"
        className="lg:ml-[300px] px-4 sm:px-6 lg:pr-8 lg:pl-0 pb-20 lg:pb-24"
      >
        <CommandBar />
        <Outlet />
      </main>
      <SecurityStrip />
    </div>
  );
}
