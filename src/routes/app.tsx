import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BankingHeader } from "@/components/layout/banking-header";
import { BehavioralSecuritySentinel } from "@/components/guard/behavioral-security-sentinel";
import { services } from "@/services/registry";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    let session = null;
    try {
      session = await services.auth.getSession();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      if (typeof window === "undefined") return {};
      return {};
    }
    if (!session) {
      if (typeof window !== "undefined") {
        throw redirect({ to: "/auth", search: { redirect: location.href } });
      }
      return {};
    }
    return { session };
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col">
      {/* Enterprise Banking Header */}
      <BankingHeader />

      {/* Main banking portal view */}
      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Continuous Behavioral Authentication Sentinel: Handles WARN & CHALLENGE gracefully */}
        <BehavioralSecuritySentinel />
        <Outlet />
      </main>

      {/* Standard Indian banking trust footer */}
      <footer className="border-t border-[#D9E1EA] bg-white py-6 text-xs text-[#667085]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#082A5C]">Adaptive Guardian Bank</span>
            <span>· Continuous Behavioral Biometrics & Adaptive Risk Protection</span>
          </div>
          <div className="flex items-center gap-6">
            <span>256-bit SSL Certified</span>
            <span>RBI / Banking Security Compliant</span>
            <span>Privacy Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
