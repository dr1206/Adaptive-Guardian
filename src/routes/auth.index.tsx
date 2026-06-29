import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AtSign, ArrowRight, Lock, Building2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApertureInput } from "@/components/auth/aperture-input";
import { ApertureSpinner } from "@/components/brand/shield";
import { BalanceTile } from "@/components/banking/balance-tile";
import { TransactionRow, sampleTxs } from "@/components/banking/transaction-row";
import { useRegister } from "@/services/hooks";

export const Route = createFileRoute("/auth/")({
  component: IdentityScreen,
});

function deriveDisplayName(em: string) {
  const local = em.split("@")[0] ?? "";
  return (
    local
      .split(/[._-]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ") || "Member"
  );
}

function IdentityScreen() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "validating" | "valid" | "error">("idle");
  const register = useRegister();
  const submitting = register.isPending;
  const error = register.error;

  function checkEmail(v: string) {
    setEmail(v);
    if (!v) return setEmailState("idle");
    setEmailState("validating");
    setTimeout(() => {
      setEmailState(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "valid" : "error");
    }, 500);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await register.mutateAsync({
        email,
        password,
        displayName: deriveDisplayName(email),
        acceptedTerms: true,
      });
      nav({ to: "/auth/verify", search: { e: email } });
    } catch {
      /* surfaced via register.error below */
    }
  }

  return (
    <AuthShell
      step={1}
      preview={
        <div className="grid h-full grid-cols-2 gap-4 p-8">
          <BalanceTile />
          <BalanceTile label="Wealth · Sovereign" amount={2487102.12} delta="+ 0.84%" />
          <div className="col-span-2 space-y-2">
            {sampleTxs.slice(0, 4).map((t, i) => (
              <TransactionRow key={i} tx={t} />
            ))}
          </div>
        </div>
      }
    >
      <div className="max-w-[440px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Step 01 · Identity
        </p>
        <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-tight">
          Welcome to your
          <br />
          <span className="text-gradient">private vault.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          AdaptiveGuard recognizes you by how you type, move, and decide — not just what you
          remember. Begin with your credentials; the AI will quietly do the rest.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <ApertureInput
            label="Work email"
            icon={AtSign}
            type="email"
            value={email}
            onChange={(e) => checkEmail(e.target.value)}
            state={emailState}
            hint={emailState === "error" ? "That doesn't look like a valid address." : undefined}
            whyWeAsk="We use your email only to identify your tenant and notify you of new sessions."
            autoFocus
          />
          <ApertureInput
            label="Password"
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            whyWeAsk="Encrypted at rest with Argon2id. Never logged, never shared."
          />

          <button
            type="submit"
            disabled={!email || !password || submitting}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl gradient-cyber px-6 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <ApertureSpinner size={18} />
            ) : (
              <>
                Continue to verification
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
          {error ? (
            <p className="text-[12px] text-danger" role="alert">
              {error.message}
            </p>
          ) : null}
        </form>

        <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="h-px flex-1 bg-white/8" />
          or
          <span className="h-px flex-1 bg-white/8" />
        </div>

        <button className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-foreground/90 transition-colors hover:border-white/20">
          <Building2 className="h-4 w-4 text-accent" /> Continue with Enterprise SSO
        </button>

        <p className="mt-8 text-[11px] text-muted-foreground">
          By continuing you accept the AdaptiveGuard Trust Charter. Behavioral data is captured
          on-device; only an encrypted vector ever leaves your browser.
        </p>
      </div>
    </AuthShell>
  );
}
