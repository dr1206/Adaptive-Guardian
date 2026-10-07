import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  ShieldCheck,
  Send,
  CreditCard,
  ListOrdered,
  Wallet,
  ArrowRight,
  TrendingUp,
  Lock,
  Smartphone,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { fmt, fmtShort } from "@/lib/format";
import { useAccounts, useAegisSnapshot, useSession, useTransactions } from "@/services/hooks";
import { cn } from "@/lib/utils";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/app/")({
  validateSearch: search,
  component: DashboardPage,
});

const QUICK_ACTIONS = [
  { label: "Transfer Funds", desc: "IMPS / NEFT / RTGS", icon: Send, to: "/app/transfer" },
  { label: "Manage Accounts", desc: "Savings & Checking", icon: Wallet, to: "/app/accounts" },
  { label: "Cards Management", desc: "Debit & Credit Cards", icon: CreditCard, to: "/app/cards" },
  { label: "Account Statement", desc: "Detailed records", icon: ListOrdered, to: "/app/transactions" },
];

function DashboardPage() {
  const { e } = Route.useSearch();
  const { data: accounts } = useAccounts();
  const { data: session } = useSession();
  const { data: snapshot } = useAegisSnapshot();
  const { data: transactions } = useTransactions({ limit: 6 });

  const displayName = session?.displayName ?? (e ? e.split("@")[0] : "Account Holder");
  const totalBalance = (accounts ?? []).reduce((s, a) => s + a.balance, 0);
  const primary = (accounts ?? []).find((a) => a.type === "primary") ?? accounts?.[0];
  const savings = (accounts ?? []).find((a) => a.type === "savings") ?? accounts?.[1];

  const confPercent = snapshot?.confidence != null ? Math.round(snapshot.confidence * 100) : 98;
  const isProtected = confPercent >= 70;

  return (
    <div className="space-y-8">
      {/* Top Welcome & Security Banner */}
      <div className="bg-white rounded-lg border border-[#D9E1EA] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-[#2563A6] uppercase tracking-wider">
            Internet Banking Portal
          </span>
          <h1 className="text-2xl font-bold text-[#082A5C] mt-1">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Your account is actively protected by Adaptive Guardian continuous behavioral authentication.
          </p>
        </div>

        {/* Real Security Health Badge */}
        <div className="flex items-center gap-4 bg-[#F5F7FA] border border-[#D9E1EA] rounded-lg p-4 shrink-0">
          <div className="p-3 bg-white rounded-full border border-[#D9E1EA] text-[#16845B]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-[#16845B]" />
              <span className="text-xs font-bold text-[#16845B] uppercase tracking-wider">
                {isProtected ? "Protected & Verified" : "Review Elevated"}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#172033] mt-0.5">
              Behavioral Match: {confPercent}%
            </div>
            <div className="text-xs text-[#667085]">
              Continuous keystroke & mouse dynamics
            </div>
          </div>
          <Link
            to="/app/guard"
            className="text-xs font-semibold text-[#0B3A82] hover:underline ml-2"
          >
            Details
          </Link>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Net Balance Card */}
        <div className="bg-[#0B3A82] text-white rounded-lg p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
              Total Consolidated Balance
            </span>
            <Wallet className="w-5 h-5 text-white/60" />
          </div>
          <div className="mt-4 text-3xl font-bold font-numeric tracking-tight">
            {fmt(totalBalance)}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/80">
            <span>Customer ID: {session?.userId?.slice(0, 8) ?? "AGB-8831"}</span>
            <span className="text-emerald-300 font-medium">All Accounts Active</span>
          </div>
        </div>

        {/* Primary Checking Account */}
        <div className="bg-white rounded-lg border border-[#D9E1EA] p-6 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Primary Salary Account
              </span>
              <div className="text-xs text-[#98A2B3] mt-0.5">
                A/C No: •••• {primary?.accountNumber?.slice(-4) ?? "4921"}
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-[#16845B] border border-emerald-200 font-medium px-2 py-0.5 rounded">
              Operating
            </span>
          </div>
          <div className="mt-4 text-2xl font-bold text-[#172033] font-numeric">
            {fmt(primary?.balance ?? 0)}
          </div>
          <div className="mt-4 pt-4 border-t border-[#D9E1EA] flex justify-between items-center text-xs">
            <span className="text-[#667085]">Available Balance</span>
            <Link to="/app/accounts" className="text-[#0B3A82] font-semibold hover:underline">
              View Statement
            </Link>
          </div>
        </div>

        {/* Savings Account */}
        <div className="bg-white rounded-lg border border-[#D9E1EA] p-6 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                High-Yield Savings
              </span>
              <div className="text-xs text-[#98A2B3] mt-0.5">
                A/C No: •••• {savings?.accountNumber?.slice(-4) ?? "8104"}
              </div>
            </div>
            <span className="text-xs bg-blue-50 text-[#0B3A82] border border-blue-200 font-medium px-2 py-0.5 rounded">
              Savings
            </span>
          </div>
          <div className="mt-4 text-2xl font-bold text-[#172033] font-numeric">
            {fmt(savings?.balance ?? 0)}
          </div>
          <div className="mt-4 pt-4 border-t border-[#D9E1EA] flex justify-between items-center text-xs">
            <span className="text-[#667085]">Interest Rate: 4.25% p.a.</span>
            <Link to="/app/accounts" className="text-[#0B3A82] font-semibold hover:underline">
              Manage
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Banking Actions */}
      <div>
        <h2 className="text-base font-bold text-[#082A5C] mb-4">
          Quick Banking Services
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="bg-white border border-[#D9E1EA] rounded-lg p-4 hover:border-[#0B3A82] hover:shadow-xs transition-all flex items-start gap-3.5 group"
              >
                <div className="p-2.5 bg-[#EEF2F6] text-[#0B3A82] group-hover:bg-[#0B3A82] group-hover:text-white rounded-lg transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#172033] group-hover:text-[#0B3A82]">
                    {action.label}
                  </div>
                  <div className="text-xs text-[#667085] mt-0.5">
                    {action.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-lg border border-[#D9E1EA] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#D9E1EA] flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-[#082A5C]">
              Recent Account Activity
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Live ledger entries verified under continuous session protection
            </p>
          </div>
          <Link
            to="/app/transactions"
            className="text-xs font-semibold text-[#0B3A82] hover:underline flex items-center gap-1"
          >
            Detailed Ledger <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F7FA] text-xs font-semibold text-[#667085] uppercase tracking-wider border-b border-[#D9E1EA]">
              <tr>
                <th className="py-3 px-5">Date & Time</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E1EA]">
              {(transactions ?? []).slice(0, 6).map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F9FBFC] transition-colors">
                  <td className="py-3.5 px-5 text-xs text-[#667085] whitespace-nowrap">
                    {tx.time}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-[#172033]">
                    {tx.merchant}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#667085]">
                    {tx.category}
                  </td>
                  <td className="py-3.5 px-5 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        tx.amount >= 0
                          ? "bg-emerald-50 text-[#16845B] border border-emerald-200"
                          : "bg-gray-100 text-[#475467] border border-gray-200",
                      )}
                    >
                      {tx.amount >= 0 ? "Credit" : "Debit"}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-3.5 px-5 text-right font-semibold font-numeric",
                      tx.amount >= 0 ? "text-[#16845B]" : "text-[#172033]",
                    )}
                  >
                    {fmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}