import { createFileRoute, Outlet } from "@tanstack/react-router";
import { VaultAtmosphere } from "@/components/auth/vault-atmosphere";
import { VaultRail } from "@/components/dashboard/vault-rail";
import { CommandBar } from "@/components/dashboard/command-bar";
import { SecurityStrip } from "@/components/banking/security-strip";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen text-foreground">
      <VaultAtmosphere intensity={0.85} />
      <VaultRail />
      <main className="ml-[300px] pr-8 pb-20">
        <CommandBar />
        <Outlet />
      </main>
      <SecurityStrip />
    </div>
  );
}
