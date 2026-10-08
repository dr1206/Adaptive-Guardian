import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { BeneficiaryCard } from "@/components/banking/beneficiary-card";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useBeneficiaries, useAddBeneficiary } from "@/services/hooks";
import type { Beneficiary } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/beneficiaries")({
  component: BeneficiariesPage,
});

const CATEGORIES = ["All", "Family", "Business", "Utilities", "Savings", "General"] as const;
type Cat = (typeof CATEGORIES)[number];

function BeneficiariesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const { data: beneficiaries, isLoading, error } = useBeneficiaries();
  const addMutation = useAddBeneficiary();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [category, setCategory] = useState("General");

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !iban.trim() || !bank.trim()) {
      toast.error("Please fill in all beneficiary fields");
      return;
    }
    addMutation.mutate(
      {
        name: name.trim(),
        iban: iban.trim().toUpperCase(),
        bank: bank.trim(),
        category,
        currency: "INR",
      },
      {
        onSuccess: (newB) => {
          toast.success(`Beneficiary ${newB.name} added. 24-hr cooling cap active.`);
          setAddOpen(false);
          setName("");
          setIban("");
          setBank("");
          setCategory("General");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to add beneficiary");
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Beneficiaries"
        subtitle="Manage verified payees with automatic cooling period protection."
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add beneficiary
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-4">
          <div>
            <h3 className="mb-2 text-[10px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
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
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-[10px] uppercase font-bold tracking-[0.18em] text-muted-foreground">
              Index
            </h3>
            <div className="flex flex-wrap gap-1 font-numeric text-[11px]">
              {letters.map((l) => (
                <span
                  key={l}
                  className="grid h-6 w-6 place-items-center rounded-md border border-border bg-card text-muted-foreground"
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
              placeholder="Search name, bank, account number…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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

      {/* Add Beneficiary Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Beneficiary</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">Beneficiary Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Account Number / IFSC / IBAN
              </label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="e.g. 50100492817291 or SBIN0001234"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Bank Name</label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                required
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] focus:border-primary focus:outline-none"
              >
                {["General", "Family", "Business", "Utilities", "Savings"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
              ⚠️ In accordance with RBI guidelines, transfers to newly registered beneficiaries are subject to a ₹50,000 cooling limit for the first 24 hours.
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Beneficiary
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
