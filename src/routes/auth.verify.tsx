import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpPucks } from "@/components/auth/otp-pucks";
import { ApertureSpinner } from "@/components/brand/shield";
import { BalanceTile } from "@/components/banking/balance-tile";
import { TransactionRow, sampleTxs } from "@/components/banking/transaction-row";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/auth/verify")({
  validateSearch: search,
  component: VerifyScreen,
});

function VerifyScreen() {
  const { e } = Route.useSearch();
  const nav = useNavigate();
  const [verifying, setVerifying] = useState(false);

  function onComplete(_code: string) {
    setVerifying(true);
    setTimeout(() => nav({ to: "/auth/calibrate", search: { e } }), 900);
  }

  const masked = e ? e.replace(/^(.).+(@.+)$/, "$1•••••$2") : "your inbox";

  return (
    <AuthShell
      step={2}
      preview={
        <div className="grid h-full grid-cols-2 gap-4 p-8">
          <BalanceTile />
          <BalanceTile label="Investments" amount={84210.7} delta="+ 1.12%" />
          {sampleTxs.slice(0, 3).map((t, i) => (
            <div key={i} className="col-span-2">
              <TransactionRow tx={t} />
            </div>
          ))}
        </div>
      }
    >
      <div className="max-w-[480px]">
        <button
          onClick={() => nav({ to: "/auth" })}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Smartphone className="h-3 w-3 text-accent" /> Step 02 · Verify device
        </p>

        <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-tight">
          A six-digit
          <br />
          <span className="text-gradient">code is waiting.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We just sent a one-time code to <span className="text-foreground/90 font-medium">{masked}</span>.
          Enter it below — the pucks will glow in sequence when it's right.
        </p>

        <div className="mt-10">
          <OtpPucks onComplete={onComplete} />
        </div>

        <div className="mt-8 flex items-center justify-between text-[12px] text-muted-foreground">
          <button className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
            Resend in 0:45
          </button>
          <button className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
            Try a different method
          </button>
        </div>

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[11px] text-muted-foreground">
          {verifying ? (
            <>
              <ApertureSpinner size={12} /> Verifying device signal…
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> This device has not been seen before — we'll remember it.
            </>
          )}
        </div>

        {verifying && (
          <div className="mt-8 flex items-center gap-2 text-[13px] text-accent animate-fade-in">
            <ArrowRight className="h-4 w-4" /> Code accepted. Calibrating your behavioral profile…
          </div>
        )}
      </div>
    </AuthShell>
  );
}
