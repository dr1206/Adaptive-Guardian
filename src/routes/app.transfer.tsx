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
import type {
  Account,
  Beneficiary,
  Currency,
} from "@/services/banking/banking.contract";
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
  const [amount, setAmount] = useState<string>("1250.00");
  const [currency, setCurrency] = useState("EUR");
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
      <PageHeader eyebrow="Money" title="Transfer" subtitle="A calm, four-step motion. Aegis verifies along the way." />

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
                "h-1 rounded-full transition-all duration-500",
                i < step
                  ? "bg-gradient-to-r from-accent to-purple"
                  : i === step
                    ? "bg-accent shadow-[0_0_12px_oklch(0.715_0.135_215/0.6)]"
                    : "bg-white/[0.08]",
              )}
            />
            <span className={cn("text-[10px] uppercase tracking-[0.16em]", i === step ? "text-accent" : "text-muted-foreground/60")}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[440px]">
        {step === 0 && (
          <StepShell title="Pick a source account">
            <div className="-mx-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-8 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {accounts.filter((a) => a.type !== "credit").map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSourceId(a.id);
                    setTimeout(next, 350);
                  }}
                  className={cn(
                    "snap-start w-[260px] shrink-0 rounded-[20px] border p-4 text-left transition-all duration-300",
                    sourceId === a.id
                      ? "-translate-y-2 border-accent/60 bg-gradient-to-br from-accent/15 to-purple/10 shadow-[0_20px_60px_-20px_oklch(0.715_0.135_215/0.5)]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15",
                  )}
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{a.name} · {a.currency}</div>
                  <div className="mt-2 font-numeric text-[22px] font-semibold">{fmt(a.balance)}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">IBAN ••{a.iban.slice(-4)}</div>
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
            amount={`${currency === "EUR" ? "€" : currency} ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            purpose={purpose}
            note={note}
            onEdit={back}
            onSend={() => {
              setDone(true);
              transferMutation.mutate(
                {
                  sourceAccountId: source.id,
                  beneficiaryId: recipient.id,
                  amount: Number(amount || 0),
                  currency,
                  purpose,
                  note,
                },
                { onSettled: () => setTimeout(() => setStep(4), 700) },
              );
            }}
            sent={done}
          />
        )}

        {step === 4 && recipient && (
          <SuccessStage
            amount={`${currency === "EUR" ? "€" : currency} ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
          <button onClick={back} className="text-[12px] text-muted-foreground hover:text-foreground">
            ← Back
          </button>
        </div>
      )}
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

function Recipients({ picked, onPick }: { picked: string | null; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const list = BENEFICIARIES.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search beneficiaries…"
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-3 text-[13px] focus:border-accent/30 focus:outline-none"
          />
        </div>
        <ul className="max-h-[420px] divide-y divide-white/[0.04] overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {list.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => onPick(b.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
                  picked === b.id && "bg-accent/10",
                )}
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-semibold"
                  style={{ background: `oklch(0.355 0.08 ${b.tint} / 0.7)`, color: `oklch(0.95 0.04 ${b.tint})` }}
                >
                  {b.initials}
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{b.name}</div>
                  <div className="text-[10px] text-muted-foreground">{b.bank} · ••{b.last4}</div>
                </div>
                {b.lastSent && (
                  <span className="font-numeric text-[11px] text-muted-foreground">{fmt(b.lastSent.amount, "€", 0)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        {picked ? (
          (() => {
            const b = BENEFICIARIES.find((x) => x.id === picked)!;
            return (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-full font-display text-[16px] font-semibold"
                    style={{ background: `oklch(0.355 0.08 ${b.tint} / 0.7)`, color: `oklch(0.95 0.04 ${b.tint})` }}
                  >
                    {b.initials}
                  </span>
                  <div>
                    <div className="font-display text-[16px] font-semibold">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground">{b.bank}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">IBAN</div>
                  <div className="mt-1 font-numeric text-[12px]">{b.iban}</div>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">Recent transfers</div>
                <ul className="mt-1 space-y-1 text-[12px]">
                  {b.lastSent && <li className="flex justify-between"><span>{b.lastSent.date}</span><span className="font-numeric">{fmt(b.lastSent.amount)}</span></li>}
                </ul>
              </div>
            );
          })()
        ) : (
          <div className="grid h-full place-items-center text-center text-[12px] text-muted-foreground">
            Select a beneficiary to preview.
          </div>
        )}
      </aside>
    </div>
  );
}

function AmountStage({
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
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const value = Number(amount || 0);
  const usd = (value * (CURRENCIES.find((x) => x.code === "USD")!.rate / c.rate)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-[11px] text-muted-foreground">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent text-foreground focus:outline-none"
          >
            {CURRENCIES.map((cc) => (
              <option key={cc.code} value={cc.code} className="bg-background">
                {cc.flag} {cc.code}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 font-numeric text-[72px] font-semibold tracking-tight">
          <span className="text-muted-foreground">{currency === "EUR" ? "€" : currency === "USD" ? "$" : ""}</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-[360px] bg-transparent text-center focus:outline-none"
          />
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          Fee <span className="text-success">Free</span> · Arrives <span className="text-foreground">Today · 14:32</span>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["500.00", "1250.00", "2000.00"].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {fmt(Number(v))}
            </button>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
          <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live FX</h3>
          <div className="flex items-center justify-between">
            <span className="text-[13px]">{currency} → USD</span>
            <span className="font-numeric text-[18px] font-semibold">${usd}</span>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Rate <span className="font-numeric">{(CURRENCIES.find((x) => x.code === "USD")!.rate / c.rate).toFixed(4)}</span> · spread 0.42%
          </div>
        </article>

        <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 space-y-3">
          <Labelled label="Purpose">
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] focus:outline-none">
              {["Rent", "Salary", "Gift", "Goods", "Services", "Family support"].map((p) => (
                <option key={p} className="bg-background">{p}</option>
              ))}
            </select>
          </Labelled>
          <Labelled label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] focus:outline-none" />
          </Labelled>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <button className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 hover:bg-white/[0.08]"><Calendar className="h-3 w-3" /> Schedule</button>
            <button className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 hover:bg-white/[0.08]"><Repeat className="h-3 w-3" /> Repeat</button>
          </div>
        </article>

        <button
          onClick={onNext}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent/30 to-purple/25 px-5 py-3 font-display text-[14px] font-semibold text-accent transition-all hover:from-accent/40 hover:to-purple/35"
        >
          Review <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </aside>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function ReviewStage({
  from, fromIban, to, toBank, toLast4, amount, purpose, note, onEdit, onSend, sent,
}: {
  from: string; fromIban: string; to: string; toBank: string; toLast4: string; amount: string;
  purpose: string; note: string; onEdit: () => void; onSend: () => void; sent: boolean;
}) {
  return (
    <div className="grid place-items-center">
      <article className="w-full max-w-[520px] rounded-[28px] border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent p-8 backdrop-blur-xl">
        <header className="mb-6 flex items-center justify-between text-[11px]">
          <span className="uppercase tracking-[0.2em] text-muted-foreground">Transfer ticket</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-accent">
            <Shield size={12} /> Aegis ready
          </span>
        </header>

        <dl className="space-y-3">
          <Row k="From" v={`${from} · ••${fromIban}`} />
          <Row k="To" v={`${to} · ${toBank} · ••${toLast4}`} />
          <Row k="Amount" v={amount} big />
          <Row k="Fee" v="Free · Arrives 14:32" />
          <Row k="Purpose" v={purpose} />
          <Row k="Note" v={note || "—"} />
        </dl>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button onClick={onEdit} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-[12px] text-muted-foreground hover:text-foreground">
            Edit
          </button>
          <PressHoldButton label="Hold to send" onComplete={onSend} />
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {sent ? "Sent. Verifying with Aegis…" : "Press and hold. Your session remains secure."}
        </p>
      </article>
    </div>
  );
}

function Row({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.04] pb-2 last:border-b-0">
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
      <dd className={cn("font-numeric text-right", big ? "text-[28px] font-semibold" : "text-[13px]")}>{v}</dd>
    </div>
  );
}

function SuccessStage({ amount, to, onAnother, onDone }: { amount: string; to: string; onAnother: () => void; onDone: () => void }) {
  return (
    <div className="grid place-items-center py-10 text-center">
      <div className="relative grid h-44 w-44 place-items-center">
        <div className="absolute inset-0 rounded-full bg-success/15 blur-2xl" />
        <SignatureGlyph seed={to} size={160} />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success text-background shadow-[0_0_20px_oklch(0.71_0.155_165/0.6)]">
            <Check className="h-6 w-6" strokeWidth={3} />
          </span>
        </span>
      </div>
      <h2 className="mt-6 font-display text-[28px] font-semibold tracking-tight">Sent.</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {to} will receive <span className="font-numeric text-foreground">{amount}</span> by 14:32.
      </p>
      <div className="mt-8 flex items-center gap-2">
        <button onClick={onAnother} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[12px] hover:text-foreground">Send another</button>
        <button onClick={onDone} className="rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-4 py-2 text-[12px] font-medium text-accent">Done</button>
      </div>
    </div>
  );
}
