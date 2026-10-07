import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Send,
  ListOrdered,
  ShieldCheck,
  CreditCard,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { useAegisSnapshot, useLogout, useSession } from "@/services/hooks";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard },
  { label: "Accounts", to: "/app/accounts", icon: Wallet },
  { label: "Transfer", to: "/app/transfer", icon: Send },
  { label: "Transactions", to: "/app/transactions", icon: ListOrdered },
  { label: "Cards", to: "/app/cards", icon: CreditCard },
  { label: "Security & Biometrics", to: "/app/guard", icon: ShieldCheck },
];

export function BankingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: session } = useSession();
  const { data: snapshot } = useAegisSnapshot();
  const logout = useLogout();

  const isProtected = (snapshot?.confidence ?? 0.95) >= 0.7;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D9E1EA] bg-white shadow-xs">
      {/* Top utility sub-bar */}
      <div className="bg-[#082A5C] text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit Encrypted Banking Portal
          </span>
          <span className="hidden md:inline text-white/40">|</span>
          <span className="hidden md:flex items-center gap-1.5 text-white/80">
            <span
              className={cn("size-2 rounded-full", isProtected ? "bg-emerald-400" : "bg-amber-400")}
            />
            Continuous Behavioral Authentication Active
          </span>
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <span className="text-white/80 hidden sm:inline">
              Welcome, <strong className="text-white font-semibold">{session.displayName}</strong>
            </span>
          )}
          {session?.roles.includes("admin") && (
            <Link
              to="/admin"
              className="text-xs bg-[#2563A6] hover:bg-[#1E4D88] text-white font-medium px-2.5 py-0.5 rounded transition-colors"
            >
              Admin Operations
            </Link>
          )}
          <button
            onClick={() => {
              logout.mutateAsync().finally(() => {
                window.location.href = "/auth";
              });
            }}
            className="text-white/80 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Secure Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/app" className="flex items-center gap-2">
            <Wordmark size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                currentPath === link.to || (link.to !== "/app" && currentPath.startsWith(link.to));
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "text-[#0B3A82] bg-[#EEF2F6] font-semibold"
                      : "text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA]",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-3">
          <Link
            to="/app/profile"
            className={cn(
              "p-2 rounded-full border border-[#D9E1EA] text-[#667085] hover:text-[#0B3A82] hover:bg-[#F5F7FA] transition-colors",
              currentPath === "/app/profile" && "border-[#0B3A82] text-[#0B3A82]",
            )}
            title="My Profile"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md border border-[#D9E1EA] text-[#667085] hover:text-[#0B3A82]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D9E1EA] bg-white px-4 pt-2 pb-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const active =
              currentPath === link.to || (link.to !== "/app" && currentPath.startsWith(link.to));
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium",
                  active
                    ? "text-[#0B3A82] bg-[#EEF2F6] font-semibold"
                    : "text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA]",
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
