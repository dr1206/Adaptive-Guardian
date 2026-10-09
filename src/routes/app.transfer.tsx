import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState, useRef } from "react";
import { ArrowRight, Search, Check, Shield, ShieldAlert, Loader2, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { PressHoldButton } from "@/components/banking/press-hold-button";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { fmt } from "@/lib/format";
import {
  useAccounts,
  useBeneficiaries,
  useCurrencies,
  useInitiateTransfer,
} from "@/services/hooks";
import { useBehavioralExport } from "@/services/behavioral/BehavioralCollectorProvider";
import type { Beneficiary, Currency, TransferResult } from "@/services/banking/banking.contract";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const { getWindows } = useBehavioralExport();

  const [step, setStep] = useState<Step>(presetTo ? 2 : 0);
  const [sourceId, setSourceId] = useState<string>(presetFrom ?? "primary");
  const [recipientId, setRecipientId] = useState<string | null>(presetTo ?? null);
  const [amount, setAmount] = useState<string>("5000.00");
  const [currency, setCurrency] = useState("INR");
  const [purpose, setPurpose] = useState("Rent");
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step-up Challenge State
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState<string>("");
  const [otpCode, setOtpCode] = useState("");

  // Completed Transfer Details
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  // Idempotency key per transfer attempt
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const accounts = accountsQ.data ?? [];
  const beneficiaries = beneficiariesQ.data ?? [];
  const currencies = currenciesQ.data ?? [];
  const source = accounts.find((a) => a.id === sourceId) ?? accounts[0];
  const recipient = beneficiaries.find((b) => b.id === recipientId);

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => {
    setErrorMsg(null);
    setStep((s) => Math.max(0, s - 1) as Step);
  };

  const getLatestBehavioralFeatures = () => {
    try {
      const windows = getWindows();
      if (windows.length > 0) {
        const { windowId, windowStart, windowEnd, deviceInfo, ...feats } =
          windows[windows.length - 1];
        return feats as Record<string, number>;
      }
    } catch {
      /* ignore */
    }
    return undefined;
  };

  const executeTransfer = (otp?: string, chId?: string) => {
    if (!recipient || !source) return;
    setIsSending(true);
    setErrorMsg(null);

    const numAmount = Number(amount || 0);
    const behavioralFeatures = getLatestBehavioralFeatures();

    transferMutation.mutate(
      {
        fromAccountId: source.id,
        beneficiaryId: recipient.id,
        amount: numAmount,
        currency,
        reference: `${purpose}${note ? ` — ${note}` : ""}`,
        idempotencyKey: idempotencyKeyRef.current,
        behavioralFeatures,
        otpCode: otp,
        challengeId: chId,
      },
      {
        onSuccess: (data) => {
          setIsSending(false);
          if (data.status === "CHALLENGED") {
            setChallengeId(data.challengeId ?? null);
            setChallengeMessage(
              data.message || "Unusual behavioral biometric signals detected. Please verify OTP.",
            );
            setChallengeOpen(true);
            return;
          }
          if (data.status === "BLOCKED") {
            setErrorMsg(
              data.message || "Transfer was declined by real-time risk evaluation engine.",
            );
            toast.error("Transfer Blocked by Risk Controls");
            return;
          }
          // Success
          setChallengeOpen(false);
          setTransferResult(data);
          toast.success("Transfer executed successfully");
          setStep(4);
        },
        onError: (err) => {
          setIsSending(false);
          const msg = err.message || "Failed to execute transfer. Please try again.";
          setErrorMsg(msg);
          toast.error(msg);
        },
      },
    );
  };

  const handleChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    executeTransfer(otpCode.trim(), challengeId ?? undefined);
  };

  const isLoading = accountsQ.isLoading || beneficiariesQ.isLoading || currenciesQ.isLoading;
  const error = accountsQ.error ?? beneficiariesQ.error ?? currenciesQ.error;

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Transfer"
        subtitle="Secure inter-bank and intra-bank funds transfer protected by Aegis ML."
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
                  i < step ? "bg-primary" : i === step ? "bg-primary/80" : "bg-muted",
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

        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Transfer Not Processed</div>
              <div className="mt-0.5 text-foreground/80">{errorMsg}</div>
            </div>
          </div>
        )}

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
                onNext={() => {
                  const val = Number(amount || 0);
                  if (isNaN(val) || val <= 0) {
                    toast.error("Please enter a valid transfer amount greater than 0");
                    return;
                  }
                  if (source && val > source.balance) {
                    toast.error("Insufficient account balance");
                    return;
                  }
                  next();
                }}
              />
            </StepShell>
          )}

          {step === 3 && recipient && source && (
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
              onSend={() => executeTransfer()}
              isSending={isSending}
            />
          )}

          {step === 4 && recipient && (
            <SuccessStage
              amount={`${currency === "INR" ? "₹" : currency} ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              to={recipient.name}
              result={transferResult}
              onAnother={() => {
                idempotencyKeyRef.current = crypto.randomUUID();
                setStep(0);
                setTransferResult(null);
                setErrorMsg(null);
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

      {/* Step-Up Challenge Dialog */}
      <Dialog open={challengeOpen} onOpenChange={setChallengeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-warning" /> Step-Up Security Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-[13px] text-muted-foreground">{challengeMessage}</p>
            <form onSubmit={handleChallengeSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-foreground">
                  Enter 6-Digit SMS / App OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-center font-mono text-[18px] tracking-widest focus:border-primary focus:outline-none"
                />
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setChallengeOpen(false)}
                  className="h-9 rounded-md border border-border px-4 text-[12px] font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Verify & Transfer
                </button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
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
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-[12px] font-bold text-primary">
                  {b.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-foreground">
                    {b.name}
                  </div>
                  <div className="truncate text-[11.5px] text-muted-foreground">
                    {b.bank} · A/C ••{b.last4}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
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
          <span className="text-muted-foreground">₹</span>
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
          Transfer Mode: <span className="font-semibold text-primary">IMPS / NEFT</span> · Charges:{" "}
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
  isSending,
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
  isSending: boolean;
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
            disabled={isSending}
            onClick={onEdit}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-[13px] font-medium text-foreground shadow-xs hover:bg-muted disabled:opacity-50"
          >
            Modify
          </button>
          <PressHoldButton
            label={isSending ? "Authorizing Transfer…" : "Hold to Authorize & Send"}
            onComplete={onSend}
          />
        </div>

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          Biometric session integrity and double-entry ledger balance will be verified upon
          authorization.
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
  result,
  onAnother,
  onDone,
}: {
  amount: string;
  to: string;
  result: TransferResult | null;
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
        Transfer Completed
      </h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Payment of <span className="font-numeric font-bold text-foreground">{amount}</span> to{" "}
        <span className="font-semibold text-foreground">{to}</span> has been debited and posted.
      </p>

      {result && (
        <div className="mt-5 max-w-sm rounded-lg border border-border bg-card p-4 text-left text-[12px] space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction ID:</span>
            <span className="font-mono font-medium text-foreground">{result.transactionId}</span>
          </div>
          {result.riskScore !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Score:</span>
              <span className="font-medium text-success">
                {result.riskScore.toFixed(3)} (Low Risk)
              </span>
            </div>
          )}
          {result.riskDecision && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Decision:</span>
              <span className="font-medium text-foreground">{result.riskDecision}</span>
            </div>
          )}
        </div>
      )}

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
