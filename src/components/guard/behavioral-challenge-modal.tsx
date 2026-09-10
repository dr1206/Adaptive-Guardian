import { useEffect, useRef, useState } from "react";
import { Fingerprint, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAuthenticateNow,
  useBehavioralAuthenticating,
  type BehavioralAuthenticationState,
} from "@/services/behavioral/BehavioralCollectorProvider";

function pct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

interface Props {
  open: boolean;
  auth: BehavioralAuthenticationState;
  /** Called only after a REAL re-verification returns ALLOW. */
  onVerified: () => void;
  onClose: () => void;
}

/**
 * CHALLENGE step-up modal. The session and tokens are NEVER touched —
 * the challenge clears only when the behavioral ML pipeline re-verifies
 * the user as genuine (fused decision ALLOW). Dismissing the dialog does
 * not clear the challenge; a persistent pill lets the user re-open it.
 */
export function BehavioralChallengeModal({
  open,
  auth,
  onVerified,
  onClose,
}: Props) {
  const authenticateNow = useAuthenticateNow();
  const isAuthenticating = useBehavioralAuthenticating();
  const [rechecking, setRechecking] = useState(false);
  const verifiedRef = useRef(false);

  // Watch for the ALLOW that follows a user-initiated re-check.
  useEffect(() => {
    if (!rechecking || !auth) return;
    if (auth.decision === "ALLOW" && !verifiedRef.current) {
      verifiedRef.current = true;
      setRechecking(false);
      onVerified();
    }
  }, [rechecking, auth, onVerified]);

  function startRecheck() {
    verifiedRef.current = false;
    setRechecking(true);
    authenticateNow();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border-white/[0.08] bg-[oklch(0.17_0.02_264/0.97)] backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg tracking-tight">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Additional verification required
          </DialogTitle>
          <DialogDescription>
            We could not verify you are the genuine user. Your session stays
            open, but confirmation is needed before this alert clears.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Fused risk
            </div>
            <div className="mt-1 font-display text-lg font-semibold text-destructive">
              {pct(auth.fusedScore)}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              LightGBM
            </div>
            <div className="mt-1 font-display text-lg font-semibold">
              {pct(auth.lightgbmScore)}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              OC-SVM
            </div>
            <div className="mt-1 font-display text-lg font-semibold">
              {pct(auth.ocsvmAnomalyScore)}
            </div>
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Continue interacting naturally (typing and moving the mouse), then
          re-run the check. Verification succeeds only when the behavioral
          models confirm your genuine pattern.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/[0.08] px-4 py-2 text-[12.5px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
          >
            Later
          </button>
          <button
            type="button"
            onClick={startRecheck}
            disabled={isAuthenticating}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-destructive/90 disabled:opacity-60"
          >
            <Fingerprint className="h-4 w-4" />
            {isAuthenticating || rechecking ? "Verifying…" : "Verify identity"}
          </button>
        </DialogFooter>

        {rechecking && !isAuthenticating && (
          <p className="flex items-center gap-2 text-[12px] text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Waiting for your next interaction window…
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
