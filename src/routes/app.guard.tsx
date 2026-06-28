import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GuardSubRail } from "@/components/guard/guard-sub-rail";

export const Route = createFileRoute("/app/guard")({
  component: GuardLayout,
});

function GuardLayout() {
  return (
    <div>
      <GuardSubRail />
      <Outlet />
    </div>
  );
}
