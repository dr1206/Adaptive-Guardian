import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { ArrowRight, Search, Calendar, Repeat, Check } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { Shield } from "@/components/brand/shield";
import { SignatureGlyph } from "@/components/brand/signature-glyph";
import { PressHoldButton } from "@/components/banking/press-hold-button";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import {
  useAccounts,
  useBeneficiaries,
  useCurrencies,
  useInitiateTransfer,
} from "@/services/hooks";
import type { Account, Beneficiary, Currency } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";

const search = z.object({ to: z.string().optional(), from: z.string().optional() });

export const Route = createFileRoute("/app/transfer")({
  validateSearch: search,
  component: TransferPage,
});

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS = ["Source", "Recipient", "Amount", "Review", "Done"];

function TransferPage() {
  const { to: presetTo, from: presetFrom } = Route.useSearch();
  const navigate = useNavigate();
  const accountsQ = useAccounts();
  const beneficiariesQ = useBeneficiaries();
  const currenciesQ = useCurrencies();
  const transferMutation = useInitiateTransfer();

  const [step, setStep] = useState<Step>(presetTo ? 2 : 0);
  const [sourceId, setSourceId] = useState<string>(presetFrom ?? "primary");
  const [recipientId, setRecipientId] = useState<string | null>(presetTo ?? null);
  const [amount, setAmount] = useState<string>("5000.00");
  const [currency, setCurrency] = useState("INR");
  const [purpose, setPurpose] = useState("Rent");
  const [note, setNote] = useState("June");
  const [done, setDone] = useState(false);

  const accounts = accountsQ.data ?? [];
  const beneficiaries = beneficiariesQ.data ?? [];
  const currencies = currenciesQ.data ?? [];
  const source = accounts.find((a) => a.id === sourceId) ?? accounts[0];
  const recipient = beneficiaries.find((b) => b.id === recipientId);

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  const isLoading = accountsQ.isLoading || beneficiariesQ.isLoading || currenciesQ.isLoading;
  const error = accountsQ.error ?? beneficiariesQ.error ?? currenciesQ.error;

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Transfer"
        subtitle="A calm, four-step motion. Aegis verifies along the way."
      />

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={accounts.length === 0 || beneficiaries.length === 0 || currencies.length === 0}
        emptyLabel="Transfer setup unavailable."
      >
        {/* Stepper */}
        <div className="mb-8 grid grid-cols-5 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col gap-1.5">
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < step ? "bg-primary" : i === step ? "bg-secondary" : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.12em]",
                  i === step ? "text-primary" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="min-h-[440px]">
          {step === 0 && (
            <StepShell title="Select Debit / Source Account">
              <div className="-mx-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-8 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {accounts
                  .filter((a) => a.type !== "credit")
                  .map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSourceId(a.id);
                        setTimeout(next, 350);
                      }}
                      className={cn(
                        "snap-start w-[270px] shrink-0 rounded-xl border p-4 text-left transition-all duration-200",
                        sourceId === a.id
                          ? "-translate-y-1 border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border bg-card shadow-xs hover:border-primary/40",
                      )}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {a.name} · {a.currency}
                      </div>
                      <div className="mt-2 font-numeric text-[24px] font-bold text-foreground">
                        {fmt(a.balance, "₹", 0)}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        A/C ••{a.iban.slice(-4)}
                      </div>
                    </button>
                  ))}
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Who's it for?">
              <Recipients
                beneficiaries={beneficiaries}
                onPick={(id) => {
                  setRecipientId(id);
                  setTimeout(next, 250);
                }}
                picked={recipientId}
              />
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="How much?">
              <AmountStage
                currencies={currencies}
                amount={amount}
                setAmount={setAmount}
                currency={currency}
                setCurrency={setCurrency}
                purpose={purpose}
                setPurpose={setPurpose}
                note={note}
                setNote={setNote}
                onNext={next}
              />
            </StepShell>
          )}

          {step === 3 && recipient && (
            <ReviewStage
              from={source.name}
              fromIban={source.iban.slice(-4)}
              to={recipient.name}
              toBank={recipient.bank}
              toLast4={recipient.last4}
              amount={`${currency === "INR" ? "₹" : currency} ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              purpose={purpose}
              note={note}
              onEdit={back}
              onSend={() => {
                setDone(true);
                transferMutation.mutate(
                  {
                    fromAccountId: source.id,
                    beneficiaryId: recipient.id,
                    amount: Number(amount || 0),
                    currency,
                    reference: `${purpose}${note ? ` — ${note}` : ""}`,
                  },
                  { onSettled: () => setTimeout(() => setStep(4), 700) },
                );
              }}
              sent={done}
            />
          )}

          {step === 4 && recipient && (
            <SuccessStage
              amount={`${currency === "INR" ? "₹" : currency} ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              to={recipient.name}
              onAnother={() => {
                setStep(0);
                setDone(false);
              }}
              onDone={() => navigate({ to: "/app" })}
            />
          )}
        </div>

        {step > 0 && step < 3 && (
          <div className="mt-6">
            <button
              onClick={back}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

function StepShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-[stage-in_.32s_cubic-bezier(.2,.8,.2,1)]">
      <h2 className="mb-6 font-display text-[22px] font-semibold tracking-tight">{title}</h2>
      {children}
      <style>{`@keyframes stage-in { from { opacity:0; transform: translateX(24px);} to { opacity:1; transform: translateX(0);} }`}</style>
    </div>
  );
}

function Recipients({
  beneficiaries,
  picked,
  onPick,
}: {
  beneficiaries: ReadonlyArray<Beneficiary>;
  picked: string | null;
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () => beneficiaries.filter((b) => b.name.toLowerCase().includes(q.toLowerCase())),
    [beneficiaries, q],
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search beneficiaries by name or account…"
            className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-[13px] text-foreground shadow-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto rounded-xl border border-border bg-card shadow-xs">
          {list.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => onPick(b.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  picked === b.id && "bg-primary/10 text-primary",
                )}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
                  {b.initials}
                </span>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-foreground">{b.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {b.bank} · A/C ••{b.last4}
                  </div>
                </div>
                {b.lastSent && (
                  <span className="font-numeric text-[12px] font-medium text-muted-foreground">
                    {fmt(b.lastSent.amount, "₹", 0)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="rounded-xl border border-border bg-card p-5 shadow-xs">
        {picked ? (
          (() => {
            const b = beneficiaries.find((x) => x.id === picked);
            if (!b) return null;
            return (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-[16px] font-bold text-primary">
                    {b.initials}
                  </span>
                  <div>
                    <div className="font-display text-[16px] font-bold text-foreground">
                      {b.name}
                    </div>
                    <div className="text-[12px] text-muted-foreground">{b.bank}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="text-[10px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
                    Account / IFSC
                  </div>
                  <div className="mt-1 font-numeric text-[13px] font-semibold text-foreground">
                    {b.iban}
                  </div>
                </div>
                <div className="mt-4 text-[12px] font-medium text-muted-foreground">
                  Recent Transactions
                </div>
                <ul className="mt-2 space-y-1.5 text-[12.5px]">
                  {b.lastSent && (
                    <li className="flex justify-between border-b border-border/50 pb-1">
                      <span className="text-muted-foreground">{b.lastSent.date}</span>
                      <span className="font-numeric font-semibold text-foreground">
                        {fmt(b.lastSent.amount, "₹", 0)}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            );
          })()
        ) : (
          <div className="grid h-full place-items-center text-center text-[12.5px] text-muted-foreground">
            Select a verified beneficiary from the list to preview details.
          </div>
        )}
      </aside>
    </div>
  );
}

function AmountStage({
  currencies,
  amount,
  setAmount,
  currency,
  setCurrency,
  purpose,
  setPurpose,
  note,
  setNote,
  onNext,
}: {
  currencies: ReadonlyArray<Currency>;
  amount: string;
  setAmount: (s: string) => void;
  currency: string;
  setCurrency: (s: string) => void;
  purpose: string;
  setPurpose: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  onNext: () => void;
}) {
  const c = currencies.find((x) => x.code === currency) ?? currencies[0];
  const usdC = currencies.find((x) => x.code === "USD") ?? c;
  const value = Number(amount || 0);
  const rate = c ? usdC.rate / c.rate : 1;
  const usd = (value * rate).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-xs">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1 text-[12px] text-foreground">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent font-medium text-foreground focus:outline-none"
          >
            {currencies.map((cc) => (
              <option key={cc.code} value={cc.code} className="bg-card text-foreground">
                {cc.flag} {cc.code}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 font-numeric text-[64px] font-bold tracking-tight text-foreground">
          <span className="text-muted-foreground">
            {currency === "INR" ? "₹" : currency === "USD" ? "$" : ""}
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-[320px] bg-transparent text-center focus:outline-none"
          />
        </div>
        <div className="mt-3 text-[12px] text-muted-foreground">
          Transfer Mode: <span className="font-semibold text-primary">IMPS Instant</span> · Charges:{" "}
          <span className="font-semibold text-success">₹0.00 (Nil)</span>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["1000.00", "5000.00", "10000.00", "25000.00"].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              {fmt(Number(v), "₹", 0)}
            </button>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <article className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="mb-2 text-[11px] uppercase font-bold tracking-[0.16em] text-muted-foreground">
            Indicative FX Conversion
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">
              {currency} equivalent
            </span>
            <span className="font-numeric text-[18px] font-bold text-foreground">${usd} USD</span>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <Labelled label="Payment Purpose">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[
                "Rent",
                "Family Support",
                "Salary",
                "Vendor Payment",
                "Education Fee",
                "Investments",
              ].map((p) => (
                <option key={p} className="bg-card text-foreground">
                  {p}
                </option>
              ))}
            </select>
          </Labelled>
          <Labelled label="Remarks / Note (Optional)">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. June Maintenance"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Labelled>
        </article>

        <button
          onClick={onNext}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-[14px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          Review Transfer{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </aside>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function ReviewStage({
  from,
  fromIban,
  to,
  toBank,
  toLast4,
  amount,
  purpose,
  note,
  onEdit,
  onSend,
  sent,
}: {
  from: string;
  fromIban: string;
  to: string;
  toBank: string;
  toLast4: string;
  amount: string;
  purpose: string;
  note: string;
  onEdit: () => void;
  onSend: () => void;
  sent: boolean;
}) {
  return (
    <div className="grid place-items-center">
      <article className="w-full max-w-[520px] rounded-xl border border-border bg-card p-8 shadow-sm">
        <header className="mb-6 flex items-center justify-between text-[11px]">
          <span className="uppercase font-bold tracking-[0.2em] text-muted-foreground">
            Transfer Confirmation
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            <Shield size={12} /> Behavioral Match Verified
          </span>
        </header>

        <dl className="space-y-3">
          <Row k="From Account" v={`${from} · A/C ••${fromIban}`} />
          <Row k="Beneficiary" v={`${to} · ${toBank} · A/C ••${toLast4}`} />
          <Row k="Transfer Amount" v={amount} big />
          <Row k="Transaction Fee" v="₹0.00 (Free) · Arrives Instantly" />
          <Row k="Purpose" v={purpose} />
          <Row k="Remarks" v={note || "—"} />
        </dl>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={onEdit}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-[13px] font-medium text-foreground shadow-xs hover:bg-muted"
          >
            Modify
          </button>
          <PressHoldButton label="Hold to Authorize & Send" onComplete={onSend} />
        </div>

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          {sent
            ? "Transfer authorized. Submitting to banking gateway…"
            : "Biometric session integrity will be verified upon authorization."}
        </p>
      </article>
    </div>
  );
}

function Row({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2.5 last:border-b-0">
      <dt className="text-[11px] uppercase font-bold tracking-[0.14em] text-muted-foreground">
        {k}
      </dt>
      <dd
        className={cn(
          "font-numeric text-right",
          big
            ? "text-[28px] font-bold text-foreground"
            : "text-[13.5px] font-medium text-foreground",
        )}
      >
        {v}
      </dd>
    </div>
  );
}

function SuccessStage({
  amount,
  to,
  onAnother,
  onDone,
}: {
  amount: string;
  to: string;
  onAnother: () => void;
  onDone: () => void;
}) {
  return (
    <div className="grid place-items-center py-10 text-center">
      <div className="relative grid h-28 w-28 place-items-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </span>
      </div>
      <h2 className="mt-4 font-display text-[26px] font-bold tracking-tight text-foreground">
        Transfer Successful
      </h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Payment of <span className="font-numeric font-bold text-foreground">{amount}</span> to{" "}
        <span className="font-semibold text-foreground">{to}</span> has been processed.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onAnother}
          className="rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-semibold text-foreground shadow-xs hover:bg-muted"
        >
          Transfer Again
        </button>
        <button
          onClick={onDone}
          className="rounded-lg bg-primary px-5 py-2 text-[13px] font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
