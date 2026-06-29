import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  CreditCard,
  ArrowLeftRight,
  Send,
  Settings as Cog,
  LineChart,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useActivity } from "@/services/hooks";
import { asyncStateFromQuery } from "@/lib/async-state";
import type { ActivityEventType } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
});

const FILTERS = [
  "All",
  "Banking",
  "Security",
  "Auth",
  "Cards",
  "Payments",
  "Investments",
  "Settings",
];

const ICONS: Record<ActivityEventType, ReactNode> = {
  tx: <ArrowLeftRight className="h-3.5 w-3.5" />,
  auth: <ShieldCheck className="h-3.5 w-3.5" />,
  card: <CreditCard className="h-3.5 w-3.5" />,
  transfer: <Send className="h-3.5 w-3.5" />,
  settings: <Cog className="h-3.5 w-3.5" />,
  invest: <LineChart className="h-3.5 w-3.5" />,
};

function ActivityPage() {
  const [f, setF] = useState("All");
  const eventsQ = useActivity();
  const events = eventsQ.data ?? [];
  const state = asyncStateFromQuery(eventsQ, (d) => d.length === 0);

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        title="Activity"
        subtitle="Everything that touched your account."
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((x) => (
          <button
            key={x}
            onClick={() => setF(x)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] transition-colors",
              f === x
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground",
            )}
          >
            {x}
          </button>
        ))}
      </div>
      <AsyncBoundary state={state} variant="timeline" emptyLabel="No activity yet.">
        <ul className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent">
                {ICONS[e.type]}
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-medium">{e.title}</div>
                <div className="text-[10px] text-muted-foreground">{e.sub}</div>
              </div>
              <span className="font-numeric text-[11px] text-muted-foreground">{e.ts}</span>
            </li>
          ))}
        </ul>
      </AsyncBoundary>
    </div>
  );
}
