import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  CreditCard,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BalanceTile } from "@/components/banking/balance-tile";
import { cn } from "@/lib/utils";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/onboarding/")({
  validateSearch: search,
  component: OnboardingScreen,
});

type Step = "welcome" | "profile" | "beneficiary" | "explore";

const STEPS: { key: Step; label: string; icon: typeof ShieldCheck }[] = [
  { key: "welcome", label: "Welcome", icon: Sparkles },
  { key: "profile", label: "Profile", icon: UserCheck },
  { key: "beneficiary", label: "Beneficiary", icon: Users },
  { key: "explore", label: "Explore", icon: Wallet },
];

function OnboardingScreen() {
  const { e } = Route.useSearch();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  function goTo(next: Step) {
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 300);
  }

  function finish() {
    setTransitioning(true);
    setTimeout(() => {
      nav({ to: "/app" });
    }, 400);
  }

  return (
    <AuthShell
      step={stepIdx + 1}
      totalSteps={STEPS.length}
      preview={
        <div className="grid h-full grid-cols-2 gap-4 p-8">
          <BalanceTile />
          <BalanceTile label="Savings" amount={48211.0} delta="+ 0.36%" />
          <div className="col-span-2 flex flex-col items-center justify-center gap-4 rounded-3xl border border-gold/10 bg-gradient-to-b from-card to-surface p-8">
            <ShieldCheck className="h-8 w-8 text-accent" />
            <p className="text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              AES-256 Encrypted · SOC2 Compliant · GDPR Ready
            </p>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-[480px]">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border text-[11px] font-semibold transition-all duration-300",
                  stepIdx >= i
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/8 text-muted-foreground",
                )}
              >
                {stepIdx > i ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : (
                  <s.icon className="h-3.5 w-3.5" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8 rounded transition-colors duration-500",
                    stepIdx > i ? "bg-accent/60" : "bg-white/8",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div
          className={cn(
            "transition-all duration-300",
            transitioning ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          {step === "welcome" && <WelcomeStep onNext={() => goTo("profile")} email={e} />}
          {step === "profile" && (
            <ProfileStep
              displayName={displayName}
              onChange={setDisplayName}
              onNext={() => goTo("beneficiary")}
              onBack={() => goTo("welcome")}
            />
          )}
          {step === "beneficiary" && (
            <BeneficiaryStep
              name={beneficiaryName}
              accountNumber={accountNumber}
              ifsc={ifsc}
              onNameChange={setBeneficiaryName}
              onAccountChange={setAccountNumber}
              onIfscChange={setIfsc}
              onNext={finish}
              onBack={() => goTo("profile")}
            />
          )}
          {step === "explore" && <ExploreStep onFinish={finish} />}
        </div>
      </div>
    </AuthShell>
  );
}

function WelcomeStep({ onNext, email }: { onNext: () => void; email?: string }) {
  const masked = email ? email.replace(/^(.).+(@.+)$/, "$1•••••$2") : "your inbox";

  return (
    <>
      <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-accent">
        <Sparkles className="h-3 w-3" /> Welcome to AdaptiveGuard
      </p>
      <h1 className="mt-5 font-display text-[34px] font-semibold leading-[1.08] tracking-tight">
        Your vault
        <br />
        <span className="text-gradient">is ready.</span>
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Your identity has been verified via <span className="text-foreground/90">{masked}</span>.
        In the next few steps, we'll help you set up your banking profile — it only takes a minute.
      </p>

      <div className="mt-6 space-y-3">
        <TrustRow icon={ShieldCheck} label="AES-256 encrypted vault" />
        <TrustRow icon={Building2} label="Protected by behavioral AI" />
        <TrustRow icon={Landmark} label="SOC2 & GDPR compliant" />
      </div>

      <button
        onClick={onNext}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-[14px] font-semibold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-gold"
      >
        Get started <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

function ProfileStep({
  displayName,
  onChange,
  onNext,
  onBack,
}: {
  displayName: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back
      </button>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <UserCheck className="h-3 w-3 text-accent" /> Step 1 · Your profile
      </p>
      <h2 className="mt-4 font-display text-[28px] font-semibold leading-[1.12] tracking-tight">
        How should we
        <br />
        <span className="text-gradient">address you?</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This name appears on your dashboard, statements, and secure communications. You can change
        it anytime.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Display Name
        </label>
        <input
          value={displayName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none transition-all focus:border-accent/50 focus:shadow-gold"
          autoFocus
        />
      </div>

      <button
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-[14px] font-semibold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-gold"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

function BeneficiaryStep({
  name,
  accountNumber,
  ifsc,
  onNameChange,
  onAccountChange,
  onIfscChange,
  onNext,
  onBack,
}: {
  name: string;
  accountNumber: string;
  ifsc: string;
  onNameChange: (v: string) => void;
  onAccountChange: (v: string) => void;
  onIfscChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back
      </button>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <Users className="h-3 w-3 text-accent" /> Step 2 · Add a contact
      </p>
      <h2 className="mt-4 font-display text-[28px] font-semibold leading-[1.12] tracking-tight">
        Who would you
        <br />
        <span className="text-gradient">like to pay?</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Add someone you trust — a friend, family member, or your other account. This is how
        transfers feel effortless.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Beneficiary Name
          </label>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Priya Mehta"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none transition-all focus:border-accent/50 focus:shadow-gold"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Account Number
          </label>
          <input
            value={accountNumber}
            onChange={(e) => onAccountChange(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="0000 0000 0000 0000"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 font-numeric text-sm outline-none transition-all focus:border-accent/50 focus:shadow-gold"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            IFSC Code
          </label>
          <input
            value={ifsc}
            onChange={(e) => onIfscChange(e.target.value.toUpperCase().slice(0, 11))}
            placeholder="e.g. HDFC0001234"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 font-mono text-sm uppercase outline-none transition-all focus:border-accent/50 focus:shadow-gold"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-[14px] font-semibold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-gold"
      >
        Go to dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

function ExploreStep({ onFinish }: { onFinish: () => void }) {
  return (
    <>
      <p className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <Wallet className="h-3 w-3 text-accent" /> Step 3 · Your dashboard
      </p>
      <h2 className="mt-4 font-display text-[28px] font-semibold leading-[1.12] tracking-tight">
        Everything is
        <br />
        <span className="text-gradient">set up.</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Your vault is secured by AdaptiveGuard's behavioral AI. Explore your dashboard — check your
        balance, make transfers, and more. The system learns as you use it naturally.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <QuickCard icon={CreditCard} label="Accounts" />
        <QuickCard icon={PiggyBank} label="Savings" />
        <QuickCard icon={Users} label="Transfer" />
        <QuickCard icon={ShieldCheck} label="Security" />
      </div>

      <button
        onClick={onFinish}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-6 py-3.5 text-[14px] font-semibold text-accent-foreground transition-all hover:shadow-gold"
      >
        Enter your vault <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

function QuickCard({ icon: Icon, label }: { icon: typeof CreditCard; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-all hover:border-accent/20 hover:bg-accent/[0.03]">
      <Icon className="h-5 w-5 text-accent" />
      <span className="text-[13px] font-medium">{label}</span>
    </div>
  );
}

function TrustRow({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.015] px-4 py-3">
      <Icon className="h-4 w-4 text-success" />
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  );
}
