import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, CreditCard, ArrowLeftRight, Send, Settings as Cog, LineChart } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
});

type Ev = { id: string; ts: string; type: "tx" | "auth" | "card" | "transfer" | "settings" | "invest"; title: string; sub: string };
const EVENTS: Ev[] = [
  { id: "e1", ts: "2026-06-28 14:32", type: "auth", title: "Aegis re-verified", sub: "Confidence 99.4% · MacBook Pro · Lisbon" },
  { id: "e2", ts: "2026-06-28 13:02", type: "tx", title: "Wolt · €18.40", sub: "Visa ••4912 · Food" },
  { id: "e3", ts: "2026-06-28 09:00", type: "tx", title: "Salary inbound · €6,400", sub: "Banco Atlântico" },
  { id: "e4", ts: "2026-06-27 22:48", type: "card", title: "Travel card frozen", sub: "MC ••6645 · by you" },
  { id: "e5", ts: "2026-06-26 12:00", type: "transfer", title: "Sent €1,250 to Marta Silva", sub: "Verified · 1.1s hold" },
  { id: "e6", ts: "2026-06-25 16:22", type: "tx", title: "British Airways · €1,284", sub: "Visa ••4912 · Travel" },
  { id: "e7", ts: "2026-06-25 09:12", type: "settings", title: "International payments enabled", sub: "MC ••3340" },
  { id: "e8", ts: "2026-06-24 14:18", type: "auth", title: "New session", sub: "Lisbon · Safari 17" },
  { id: "e9", ts: "2026-06-23 11:00", type: "invest", title: "Bought VWCE × 5", sub: "@ €123.40 · €617.00" },
];

const FILTERS = ["All", "Banking", "Security", "Auth", "Cards", "Payments", "Investments", "Settings"];

const ICONS: Record<Ev["type"], React.ReactNode> = {
  tx: <ArrowLeftRight className="h-3.5 w-3.5" />,
  auth: <ShieldCheck className="h-3.5 w-3.5" />,
  card: <CreditCard className="h-3.5 w-3.5" />,
  transfer: <Send className="h-3.5 w-3.5" />,
  settings: <Cog className="h-3.5 w-3.5" />,
  invest: <LineChart className="h-3.5 w-3.5" />,
};

function ActivityPage() {
  const [f, setF] = useState("All");
  return (
    <div>
      <PageHeader eyebrow="Intelligence" title="Activity" subtitle="Everything that touched your account." />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((x) => (
          <button
            key={x}
            onClick={() => setF(x)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] transition-colors",
              f === x ? "border-accent/40 bg-accent/15 text-accent" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground",
            )}
          >
            {x}
          </button>
        ))}
      </div>
      <ul className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
        {EVENTS.map((e) => (
          <li key={e.id} className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent">{ICONS[e.type]}</span>
            <div className="flex-1">
              <div className="text-[13px] font-medium">{e.title}</div>
              <div className="text-[10px] text-muted-foreground">{e.sub}</div>
            </div>
            <span className="font-numeric text-[11px] text-muted-foreground">{e.ts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
