import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { useLogin } from "@/services/hooks";
import { services } from "@/services/registry";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/")({
  beforeLoad: async () => {
    const session = await services.auth.getSession();
    if (session) {
      if (session.roles?.includes("admin")) {
        throw redirect({ to: "/admin" });
      }
      throw redirect({ to: "/app" });
    }
  },
  component: IdentityScreen,
});

function IdentityScreen() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const submitting = login.isPending;
  const error = login.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    login.mutate(
      { email, password },
      {
        onSuccess: (session) => {
          if (session.roles?.includes("admin")) {
            window.location.href = "/admin";
          } else {
            window.location.href = "/app";
          }
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between">
      {/* Top Banking Navigation Bar */}
      <header className="border-b border-[#D9E1EA] bg-white py-4 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/">
            <Wordmark size="md" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-[#16845B]">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure SSL Banking Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white border border-[#D9E1EA] rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-[#EEF2F6] rounded-full text-[#0B3A82] mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#082A5C]">
              Internet Banking Sign In
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Protected by Continuous Behavioral Biometrics
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-[#C53030]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Authentication failed:</strong> {error.message || "Invalid credentials provided."}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5" htmlFor="email">
                Registered Email ID / Customer ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. amal@adaptiveguardian.dev"
                  className="w-full h-10 pl-10 pr-3 bg-white border border-[#D9E1EA] rounded-md text-sm text-[#172033] placeholder:text-[#98A2B3] focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#172033]" htmlFor="password">
                  Password
                </label>
                <span className="text-xs text-[#2563A6] hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your banking password"
                  className="w-full h-10 pl-10 pr-3 bg-white border border-[#D9E1EA] rounded-md text-sm text-[#172033] placeholder:text-[#98A2B3] focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className={cn(
                "w-full h-10 mt-2 bg-[#0B3A82] hover:bg-[#082A5C] text-white font-semibold text-sm rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer",
                submitting && "opacity-75 cursor-not-allowed",
              )}
            >
              {submitting ? "Verifying Credentials..." : "Secure Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-[#D9E1EA]">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider block mb-2">
              Authorized Trial Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail("amal@adaptiveguardian.dev");
                  setPassword("Demo@1234567890");
                }}
                className="p-2 border border-[#D9E1EA] rounded bg-[#F5F7FA] hover:bg-[#EEF2F6] text-left text-[#172033]"
              >
                <div className="font-semibold">Amal Varghese</div>
                <div className="text-[10px] text-[#667085]">Demo@1234567890</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@adaptiveguard.ai");
                  setPassword("Admin@1234567890");
                }}
                className="p-2 border border-[#D9E1EA] rounded bg-[#F5F7FA] hover:bg-[#EEF2F6] text-left text-[#172033]"
              >
                <div className="font-semibold">Platform Admin</div>
                <div className="text-[10px] text-[#667085]">Admin@1234567890</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Footer */}
      <footer className="border-t border-[#D9E1EA] bg-white py-4 px-6 text-center text-xs text-[#667085]">
        <span>© 2026 Adaptive Guardian Bank · RBI Cyber Security Framework Compliant · 256-Bit SSL Encryption</span>
      </footer>
    </div>
  );
}
