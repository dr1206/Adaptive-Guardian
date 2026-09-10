import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Fingerprint, ShieldAlert, X } from "lucide-react";
import {
  useBehavioralAuthenticationStatus,
  useChallengeClearedAt,
  useDismissedWarnScore,
  useDismissWarning,
  useMarkChallengeCleared,
} from "@/services/behavioral/BehavioralCollectorProvider";
import { BehavioralChallengeModal } from "./behavioral-challenge-modal";

function formatPct01(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function isNewer(aIso: string | null, bIso: string | null): boolean {
  if (!aIso || !bIso) return false;
  return Date.parse(aIso) > Date.parse(bIso);
}

/**
 * Global behavioral security sentinel — mounted once inside the
 * authenticated /app layout so EVERY app page reacts to WARN/CHALLENGE.
 * ALLOW renders nothing intrusive. Never logs out, never clears tokens.
 */
export function BehavioralSecuritySentinel() {
  const auth = useBehavioralAuthenticationStatus();
  const dismissedWarnScore = useDismissedWarnScore();
  const dismissWarning = useDismissWarning();
  const challengeClearedAt = useChallengeClearedAt();
  const markChallengeCleared = useMarkChallengeCleared();
  const navigate = useNavigate();
  const [challengeOpen, setChallengeOpen] = useState(false);

  const decision = auth?.decision ?? null;
  const activeWarn =
    decision === "WARN" &&
    auth != null &&
    dismissedWarnScore !== auth.fusedScore;
  // CHALLENGE stays active until a real re-verification succeeds AND the
  // clearance timestamp is newer than the latest CHALLENGE result. A NEWER
  // uncleared challenge re-opens the modal.
  const challengeCleared =
    auth != null &&
    decision === "CHALLENGE" &&
    isNewer(challengeClearedAt, auth.authenticatedAt);
  const activeChallenge =
    decision === "CHALLENGE" && auth != null && !challengeCleared;

  // Open the modal exactly once per CHALLENGE episode (no stacked modals).
  // When the user closes it, the persistent pill below keeps the alert
  // reachable — the challenge only clears via real verification.
  useEffect(() => {
    if (activeChallenge) setChallengeOpen(true);
    else setChallengeOpen(false);
  }, [activeChallenge]);

  if (!auth || !decision) return null;

  return (
    <>
      {activeWarn && (
        <div
          role="alert"
          aria-live="assertive"
          data-testid="behavioral-warn-banner"
          className="sticky top-0 z-40 mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-warning/40 bg-warning/[0.08] px-4 py-3 backdrop-blur-xl"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold tracking-wide text-warning">
              BEHAVIORAL VERIFICATION WARNING · Risk score:{" "}
              {formatPct01(auth.fusedScore)}
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Your current interaction pattern differs from your normal
              profile. We&apos;ll continue monitoring your session.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/app/guard" })}
            className="rounded-full border border-warning/40 px-3 py-1.5 text-[12px] font-medium text-warning hover:bg-warning/10"
          >
            Review in Security Center
          </button>
          <button
            type="button"
            onClick={dismissWarning}
            aria-label="Dismiss warning"
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <BehavioralChallengeModal
        open={challengeOpen}
        auth={auth}
        onVerified={() => {
          markChallengeCleared();
          setChallengeOpen(false);
        }}
        onClose={() => setChallengeOpen(false)}
      />

      {activeChallenge && !challengeOpen && (
        <button
          type="button"
          data-testid="behavioral-challenge-pill"
          onClick={() => setChallengeOpen(true)}
          className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/90 px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-xl transition hover:bg-destructive"
        >
          <ShieldAlert className="h-4 w-4" />
          Verification required · {formatPct01(auth.fusedScore)}
          <Fingerprint className="h-4 w-4 opacity-80" />
        </button>
      )}
    </>
  );
}

