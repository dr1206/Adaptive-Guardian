import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignatureCard } from "@/components/banking/card-object";
import { BalanceTile } from "@/components/banking/balance-tile";
import { TransactionRow, sampleTxs } from "@/components/banking/transaction-row";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/auth/signature")({
  validateSearch: search,
  component: SignatureScreen,
});

function SignatureScreen() {
  const { e } = Route.useSearch();
  const seed = e ?? "guest";
  const name = e ? deriveName(e) : "Member";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AuthShell
      step={4}
      glyphSeed={seed}
      glyphFilled
      preview={
        <div className="grid h-full grid-cols-2 gap-4 p-8">
          <BalanceTile />
          <BalanceTile label="Wealth · Sovereign" amount={2487102.12} delta="+ 0.84%" />
          {sampleTxs.slice(0, 4).map((t, i) => (
            <div key={i} className="col-span-2">
              <TransactionRow tx={t} />
            </div>
          ))}
        </div>
      }
    >
      <div className="max-w-[540px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-success">
          <Check className="h-3 w-3" /> Step 04 · Profile forged
        </p>

        <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.02] tracking-tight">
          Your signature is
          <br />
          <span className="text-gradient">unmistakable.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          AdaptiveGuard has woven your keystroke cadence and mouse curvature
          into a single behavioral filament. From now on, every session is
          continuously verified — silently, on-device, with zero added friction.
        </p>

        <div className="mt-10 mx-auto lg:mx-0">
          <SignatureCard name={name} tier="Wealth" glyphSeed={seed} reveal={revealed} />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Confidence" value="99.2%" />
          <Stat label="Risk" value="0.04" />
          <Stat label="Latency" value="12 ms" />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/app"
            search={{ e: seed }}
            className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl gradient-cyber px-6 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:translate-y-[-1px]"
          >
            Enter the vault
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-5 text-sm transition-colors hover:border-white/20">
            <ShieldCheck className="h-4 w-4 text-accent" /> View security charter
          </button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          Your behavioral vector is stored encrypted in the EU.
          You can recalibrate or revoke it anytime from Settings → Identity.
        </p>
      </div>
    </AuthShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="font-numeric mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function deriveName(email: string) {
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ") || "Member";
}
