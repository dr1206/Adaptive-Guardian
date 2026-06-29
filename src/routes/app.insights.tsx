import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { InsightCard } from "@/components/banking/insight-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useInsights } from "@/services/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/insights")({
  component: InsightsPage,
});

const FILTERS = ["All", "Spending", "Saving", "Income", "Subscriptions", "Security", "Investments"];

function InsightsPage() {
  const [f, setF] = useState("All");
  const { data: insights, isLoading, error } = useInsights();
  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        title="Insights"
        subtitle="Aegis observations, never interruptions."
      />
      <div className="mb-6 flex flex-wrap gap-1.5">
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
      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!insights || insights.length === 0}
        emptyLabel="Aegis has no observations right now."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(insights ?? []).map((i) => (
            <InsightCard key={i.id} tone={i.tone} title={i.title} body={i.body} action={i.action} />
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
}
