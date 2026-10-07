import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { OpsRail } from "@/components/admin/ops-rail";
import { services } from "@/services/registry";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const session = await services.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    if (!session.roles.includes("admin")) {
      throw redirect({ to: "/app" });
    }
    return { session };
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033]">
      {/* Desktop Sidebar */}
      <OpsRail />

      {/* Main Content Area */}
      <main id="main" className="xl:ml-64 p-6 sm:p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
