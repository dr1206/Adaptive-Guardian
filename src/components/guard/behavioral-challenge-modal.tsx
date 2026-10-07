import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  Keyboard,
  Loader2,
  MousePointer2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useVerification,
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
 * Production Indian Banking-style Behavioral Step-Up Verification Modal.
 *
 * Implements strict 6-state lifecycle:
 * 1. CHALLENGE: Displays alert reason, risk breakdown, and "Verify identity" CTA.
 * 2. COLLECTING: User clicked Verify; brand-new isolated window collects fresh keystrokes & mouse dynamics.
 * 3. READY_FOR_VERIFICATION: Minimum data criteria met; user can submit (or triggers automatically).
 * 4. VERIFYING: Running feature extraction, LightGBM + OC-SVM evaluation, and score fusion.
 * 5. SUCCESS: Fused decision == ALLOW. Clears challenge, confirms genuine user, closes modal.
 * 6. FAILED: Fused decision != ALLOW. Challenge remains strictly active. Allows retry.
 * 7. ERROR: Network or model error. Challenge remains active. Never stuck in "Verifying...".
 */
export function BehavioralChallengeModal({
  open,
  auth,
  onVerified,
  onClose,
}: Props) {
  const {
    verification,
    startVerification,
    cancelVerification,
    submitVerification,
  } = useVerification();

  const [typingText, setTypingText] = useState("");
  const autoSubmittedRef = useRef(false);

  // When modal is opened while IDLE, do not start window until user clicks "Verify"
  // If user clicks "Later" or modal closes, cancel active verification attempt cleanly
  const handleClose = () => {
    if (verification.state === "COLLECTING" || verification.state === "READY_FOR_VERIFICATION") {
      cancelVerification();
    }
    setTypingText("");
    onClose();
  };

  const prog = verification.progress;
  const keyCount = prog?.keystrokes ?? 0;
  const mouseMoves = prog?.mouseMoves ?? 0;
  const clickCount = prog?.clicks ?? 0;
  const travelPx = prog?.mouseTravelPx ?? 0;

  // Key requirement thresholds for UI progress
  const keyReady = keyCount >= 4;
  const mouseReady = mouseMoves >= 15 && travelPx >= 20;
  const clickReady = clickCount >= 2;
  const canSubmit = keyReady || mouseReady || clickReady || (prog?.isReady ?? false);

  // Auto-submit when both modalities have been smoothly collected
  useEffect(() => {
    const isSufficientlySampled = (keyReady && (mouseMoves >= 10 || travelPx >= 20)) || (keyCount >= 8 && mouseMoves >= 5);
    if ((verification.state === "READY_FOR_VERIFICATION" || isSufficientlySampled) && !autoSubmittedRef.current && (verification.state === "COLLECTING" || verification.state === "READY_FOR_VERIFICATION")) {
      const timer = setTimeout(() => {
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          submitVerification().then((success) => {
            if (success) {
              setTimeout(() => {
                onVerified();
              }, 1400);
            }
          });
        }
      }, 700);
      return () => clearTimeout(timer);
    }
    if (verification.state !== "READY_FOR_VERIFICATION" && verification.state !== "VERIFYING") {
      autoSubmittedRef.current = false;
    }
  }, [verification.state, keyReady, keyCount, mouseMoves, travelPx, submitVerification, onVerified]);

  const handleStartVerify = () => {
    autoSubmittedRef.current = false;
    setTypingText("");
    startVerification();
  };

  const handleManualSubmit = () => {
    if (!canSubmit) return;
    autoSubmittedRef.current = true;
    submitVerification().then((success) => {
      if (success) {
        setTimeout(() => {
          onVerified();
        }, 1400);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border border-[#D9E1EA] bg-white text-[#172033] shadow-2xl p-6">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            {verification.state === "SUCCESS" ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : verification.state === "FAILED" || verification.state === "ERROR" ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#082A5C]/10 text-[#082A5C]">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
              </div>
            )}

            <div>
              <DialogTitle className="text-base font-bold text-[#082A5C]">
                {verification.state === "SUCCESS"
                  ? "Identity Verified Successfully"
                  : verification.state === "FAILED"
                  ? "Verification Unsuccessful"
                  : verification.state === "ERROR"
                  ? "Verification Service Error"
                  : verification.state === "VERIFYING"
                  ? "Analyzing Behavioral Pattern"
                  : verification.state === "COLLECTING" || verification.state === "READY_FOR_VERIFICATION"
                  ? "Collecting Behavioral Verification Window"
                  : "Additional Verification Required"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#667085]">
                Adaptive Guardian Enterprise Behavioral Security
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* State 1: CHALLENGE (Initial state) */}
        {verification.state === "IDLE" && (
          <div className="space-y-4 my-2">
            <p className="text-xs text-[#475467] leading-relaxed">
              We could not confirm that your recent interaction pattern matches your authorized baseline.
              Your banking session remains secure, but confirmation is required before this security alert clears.
            </p>

            {/* Suspicious Window Risk Telemetry */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                  Fused Risk
                </div>
                <div className="mt-1 font-mono text-base font-bold text-rose-800">
                  {pct(auth.fusedScore)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                  LightGBM
                </div>
                <div className="mt-1 font-mono text-base font-bold text-[#172033]">
                  {pct(auth.lightgbmScore)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                  OC-SVM
                </div>
                <div className="mt-1 font-mono text-base font-bold text-[#172033]">
                  {pct(auth.ocsvmAnomalyScore)}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50/70 border border-blue-200/80 p-3 text-[11.5px] text-[#0B3A82] leading-snug">
              <strong>How it works:</strong> Clicking <strong>Verify Identity</strong> will start a brand-new,
              fresh behavioral sample. Simply interact naturally (type or move your mouse) to verify your genuine profile.
            </div>
          </div>
        )}

        {/* State 2 & 3: COLLECTING / READY_FOR_VERIFICATION */}
        {(verification.state === "COLLECTING" || verification.state === "READY_FOR_VERIFICATION") && (
          <div className="space-y-4 my-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B3A82]">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0B3A82]" />
                  Recording fresh behavioral window...
                </span>
                <span className="font-mono text-[11px] text-[#667085]">
                  {prog?.durationSec ?? 0}s elapsed
                </span>
              </div>
              <p className="mt-1 text-[11.5px] text-[#475467]">
                Please type or move your mouse naturally. We are capturing a fresh behavioral window to verify your identity.
              </p>
            </div>

            {/* Interactive Verification Typing Field */}
            <div className="space-y-1.5 rounded-xl border border-[#CBD5E1] bg-slate-50/70 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#082A5C]">
                <span className="flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5 text-[#0B3A82]" />
                  Interactive Typing Verification
                </span>
                <span className="text-[11px] font-mono font-medium text-[#475467]">
                  {keyCount} / 4 keys
                </span>
              </div>
              <input
                type="text"
                autoFocus
                value={typingText}
                onChange={(e) => setTypingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) {
                    handleManualSubmit();
                  }
                }}
                placeholder="Type here naturally (e.g. verify guardian)..."
                className="w-full rounded-lg border border-[#D9E1EA] bg-white px-3 py-2 text-xs text-[#172033] placeholder-[#94A3B8] shadow-sm focus:border-[#0B3A82] focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
              />
              <p className="text-[11px] text-[#667085]">
                {keyReady ? (
                  <span className="font-medium text-emerald-700">✓ Keystroke rhythm captured! Move your mouse or click Submit below.</span>
                ) : (
                  <span>Type a few characters above so the behavioral model can verify your flight & dwell rhythm.</span>
                )}
              </p>
            </div>

            {/* Fresh Signal Checklist */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#344054]">
                  <Keyboard className="h-4 w-4 text-[#0B3A82]" />
                  Keystroke rhythm ({keyCount} / 4 keys)
                </span>
                {keyReady ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sampled
                  </span>
                ) : (
                  <span className="text-[11px] text-[#667085]">Awaiting typing</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#344054]">
                  <MousePointer2 className="h-4 w-4 text-[#0B3A82]" />
                  Mouse trajectory ({mouseMoves} moves, {travelPx}px)
                </span>
                {mouseReady ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sampled
                  </span>
                ) : (
                  <span className="text-[11px] text-[#667085]">Move mouse</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#344054]">
                  <Timer className="h-4 w-4 text-[#0B3A82]" />
                  Click dynamics ({clickCount} clicks)
                </span>
                {clickReady ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sampled
                  </span>
                ) : (
                  <span className="text-[11px] text-[#667085]">Optional</span>
                )}
              </div>
            </div>

            {verification.error && (
              <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                {verification.error}
              </p>
            )}
          </div>
        )}

        {/* State 4: VERIFYING */}
        {verification.state === "VERIFYING" && (
          <div className="space-y-4 my-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0B3A82]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#082A5C]">
                Evaluating Fresh Behavioral Window
              </h4>
              <p className="mt-1 text-xs text-[#667085]">
                Running LightGBM classifier, One-Class SVM anomaly model, and calibrated risk fusion...
              </p>
            </div>
            <div className="mx-auto max-w-xs rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-[#475467]">
              Window ID: {verification.windowId || "verif-active"}
            </div>
          </div>
        )}

        {/* State 5: SUCCESS */}
        {verification.state === "SUCCESS" && (
          <div className="space-y-3 my-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Identity Confirmed Genuine
              </h4>
              <p className="mt-1 text-xs text-[#475467]">
                Your fresh interaction pattern matches your established behavioral biometric profile.
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs font-mono text-emerald-800">
              Decision: ALLOW · Risk Score: {pct(verification.lastFusedScore)}
            </div>
          </div>
        )}

        {/* State 6: FAILED */}
        {verification.state === "FAILED" && (
          <div className="space-y-3 my-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
              <strong>Verification Not Conclusive:</strong> Your fresh interaction sample did not match
              your genuine profile closely enough (Decision: {verification.lastDecision}, Risk: {pct(verification.lastFusedScore)}).
            </div>
            <p className="text-xs text-[#475467] leading-relaxed">
              Your challenge alert remains active. Please interact naturally and initiate a fresh verification attempt.
            </p>
          </div>
        )}

        {/* State 7: ERROR */}
        {verification.state === "ERROR" && (
          <div className="space-y-3 my-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Service Notice</strong>
                {verification.error || "The behavioral authentication service encountered a temporary error."}
              </div>
            </div>
            <p className="text-xs text-[#475467]">
              Your session is still protected. You can retry the verification check now.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          {verification.state === "IDLE" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#D9E1EA] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-slate-50 transition-colors"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleStartVerify}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B3A82] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#082A5C] shadow-sm"
              >
                <Fingerprint className="h-4 w-4" />
                Verify Identity
              </button>
            </>
          )}

          {(verification.state === "COLLECTING" || verification.state === "READY_FOR_VERIFICATION") && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#D9E1EA] px-3.5 py-2 text-xs font-medium text-[#475467] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B3A82] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#082A5C] disabled:opacity-50 shadow-sm"
              >
                {canSubmit ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Submit Verification Window
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Collecting Signals...
                  </>
                )}
              </button>
            </>
          )}

          {verification.state === "VERIFYING" && (
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B3A82]/60 px-4 py-2 text-xs font-semibold text-white"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Evaluating with LightGBM & OC-SVM...
            </button>
          )}

          {verification.state === "SUCCESS" && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Continue Securely
            </button>
          )}

          {(verification.state === "FAILED" || verification.state === "ERROR") && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#D9E1EA] px-3.5 py-2 text-xs font-medium text-[#475467] hover:bg-slate-50"
              >
                Dismiss for Now
              </button>
              <button
                type="button"
                onClick={handleStartVerify}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B3A82] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082A5C]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
