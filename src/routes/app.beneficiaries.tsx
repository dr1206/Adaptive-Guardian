import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { BeneficiaryCard } from "@/components/banking/beneficiary-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useBeneficiaries } from "@/services/hooks";
import type { Beneficiary } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/beneficiaries")({
  component: BeneficiariesPage,
});

const CATEGORIES = ["All", "Family", "Business", "Utilities", "Savings", "Recent"] as const;
type Cat = (typeof CATEGORIES)[number];

function BeneficiariesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const { data: beneficiaries, isLoading, error } = useBeneficiaries();

  const list = useMemo<ReadonlyArray<Beneficiary>>(
    () =>
      (beneficiaries ?? [])
        .filter(
          (b) =>
            (cat === "All" || b.category === cat) &&
            (q === "" ||
              b.name.toLowerCase().includes(q.toLowerCase()) ||
              b.bank.toLowerCase().includes(q.toLowerCase())),
        )
        .slice()
        .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite)),
    [beneficiaries, q, cat],
  );

  const letters = useMemo(
    () => Array.from(new Set(list.map((b) => b.name[0].toUpperCase()))).sort(),
    [list],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Beneficiaries"
        subtitle="Your modern rolodex."
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-3 text-[12px] font-medium text-accent">
            <Plus className="h-3.5 w-3.5" /> Add beneficiary
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-4">
          <div>
            <h3 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Categories
            </h3>
            <ul className="space-y-1">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => setCat(c)}
                    className={cn(
                      "w-full rounded-lg px-3 py-1.5 text-left text-[12px] transition-colors",
                      cat === c
                        ? "bg-white/[0.06] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Index
            </h3>
            <div className="flex flex-wrap gap-1 font-numeric text-[11px]">
              {letters.map((l) => (
                <span
                  key={l}
                  className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.04] text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, bank, IBAN…"
              className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-3 text-[13px] focus:border-accent/30 focus:outline-none"
            />
          </div>
          <AsyncBoundary
            isLoading={isLoading}
            error={error}
            isEmpty={list.length === 0}
            emptyLabel="No beneficiaries match your filters."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((b) => (
                <BeneficiaryCard key={b.id} b={b} />
              ))}
            </div>
          </AsyncBoundary>
        </div>
      </div>
    </div>
  );
}
