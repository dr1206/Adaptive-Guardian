import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArrowRight, Keyboard, MousePointer2, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApertureSpinner } from "@/components/brand/shield";
import { BalanceTile } from "@/components/banking/balance-tile";
import { SignatureGlyph } from "@/components/brand/signature-glyph";
import { useSubmitEnrollment } from "@/services/hooks";
import type { EnrollmentSample } from "@/services";
import { cn } from "@/lib/utils";

const search = z.object({ e: z.string().optional() });

export const Route = createFileRoute("/auth/calibrate")({
  validateSearch: search,
  component: CalibrateScreen,
});

const PHRASES = [
  "the quiet vault recognizes its owner",
  "adaptive intelligence keeps watch",
  "trust is built, not declared",
];

function CalibrateScreen() {
  const { e } = Route.useSearch();
  const nav = useNavigate();
  const enroll = useSubmitEnrollment();

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [kbStrokes, setKbStrokes] = useState(0);
  const [mouseDist, setMouseDist] = useState(0);
  const [mousePts, setMousePts] = useState<Array<[number, number]>>([]);
  const [finalizing, setFinalizing] = useState(false);

  const keyTimings = useRef<number[]>([]);
  const lastKeyAt = useRef<number | null>(null);

  const padRef = useRef<HTMLDivElement>(null);
  const lastPt = useRef<[number, number] | null>(null);

  const phrase = PHRASES[phraseIdx];
  const kbProgress = Math.min(1, kbStrokes / 90); // ~3 phrases
  const mouseProgress = Math.min(1, mouseDist / 2200);
  const combined = (kbProgress + mouseProgress) / 2;
  const ready = kbProgress >= 1 && mouseProgress >= 1;

  useEffect(() => {
    if (ready && !finalizing) {
      setFinalizing(true);
      const samples: EnrollmentSample[] = [
        {
          kind: "keystroke",
          features: keyTimings.current.slice(-64),
          capturedAt: new Date().toISOString(),
        },
        {
          kind: "mouse",
          features: mousePts.flatMap(([x, y]) => [x, y]).slice(-128),
          capturedAt: new Date().toISOString(),
        },
      ];
      enroll
        .mutateAsync(samples)
        .catch(() => null)
        .finally(() => nav({ to: "/auth/signature", search: { e } }));
    }
  }, [ready, finalizing, nav, e, enroll, mousePts]);

  function onType(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTyped(v);
    const now = performance.now();
    if (lastKeyAt.current != null) {
      keyTimings.current.push(Math.min(2000, now - lastKeyAt.current));
    }
    lastKeyAt.current = now;
    setKbStrokes((s) => s + 1);
    if (v.length >= phrase.length) {
      setTimeout(() => {
        setTyped("");
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
      }, 220);
    }
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = padRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (lastPt.current) {
      const dx = x - lastPt.current[0];
      const dy = y - lastPt.current[1];
      setMouseDist((d) => d + Math.hypot(dx, dy));
    }
    lastPt.current = [x, y];
    setMousePts((p) => [...p.slice(-160), [x, y]]);
  }

  return (
    <AuthShell
      step={3}
      preview={
        <div className="grid h-full grid-cols-2 gap-4 p-8">
          <BalanceTile />
          <BalanceTile label="Allocation" amount={48211.0} delta="+ 0.36%" />
          <div className="col-span-2 surface-card rounded-[20px] p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Constellation · live</div>
            <ConstellationPreview />
          </div>
        </div>
      }
    >
      <div className="max-w-[540px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" /> Step 03 · Calibration
        </p>

        <h1 className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-tight">
          Teach the AI
          <br />
          <span className="text-gradient">your signature.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Type the phrase below in your natural rhythm, and let your cursor
          wander across the canvas. We're capturing cadence and curvature —
          on this device only. The vector that leaves your browser cannot be reversed into you.
        </p>

        {/* Keyboard module */}
        <div className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5 text-accent" /> Keystroke cadence
            </div>
            <span className="font-numeric text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {Math.round(kbProgress * 100)}%
            </span>
          </div>
          <ShimmerBar value={kbProgress} />
          <div className="mt-4 select-none rounded-2xl bg-black/30 p-4 font-mono text-sm">
            <Phrase phrase={phrase} typed={typed} />
          </div>
          <input
            value={typed}
            onChange={onType}
            placeholder="Type the phrase above…"
            className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm outline-none transition-colors focus:border-accent/50 focus:shadow-glow-cyan"
            autoFocus
            disabled={finalizing}
          />
        </div>

        {/* Mouse module */}
        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
              <MousePointer2 className="h-3.5 w-3.5 text-accent" /> Mouse curvature
            </div>
            <span className="font-numeric text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {Math.round(mouseProgress * 100)}%
            </span>
          </div>
          <ShimmerBar value={mouseProgress} />
          <div
            ref={padRef}
            onMouseMove={onMove}
            className="relative mt-4 h-44 cursor-crosshair overflow-hidden rounded-2xl border border-white/8 bg-black/30"
          >
            <MeshGrid />
            <FilamentTrail points={mousePts} />
            {!mousePts.length && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Move your cursor here
              </div>
            )}
          </div>
        </div>

        {/* Combined */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="text-[12px] text-muted-foreground">
            Combined profile strength
          </div>
          <div className="flex items-center gap-3">
            <span className="font-numeric text-sm text-foreground">{Math.round(combined * 100)}%</span>
            {finalizing ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-accent">
                <ApertureSpinner size={14} /> Forging signature
              </span>
            ) : ready ? (
              <span className="inline-flex items-center gap-1 text-[12px] text-success">
                Ready <ArrowRight className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

function Phrase({ phrase, typed }: { phrase: string; typed: string }) {
  return (
    <div className="leading-relaxed tracking-wide">
      {phrase.split("").map((ch, i) => {
        const t = typed[i];
        const ok = t === ch;
        return (
          <span
            key={i}
            className={cn(
              t === undefined
                ? "text-muted-foreground/50"
                : ok
                  ? "text-foreground"
                  : "text-danger underline decoration-danger/60",
            )}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

function ShimmerBar({ value }: { value: number }) {
  return (
    <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="absolute inset-y-0 left-0 gradient-cyber transition-all duration-300"
        style={{ width: `${value * 100}%` }}
      >
        <div
          className="absolute inset-y-0 right-0 w-12 bg-white/40 blur-md"
          style={{ animation: "bar-head 1.4s linear infinite" }}
        />
      </div>
      <style>{`
        @keyframes bar-head { 0% { opacity:0.2 } 50% { opacity:0.8 } 100% { opacity:0.2 } }
      `}</style>
    </div>
  );
}

function MeshGrid() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-30">
      <defs>
        <pattern id="mesh" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M 22 0 L 0 0 0 22" stroke="oklch(1 0 0 / 0.06)" strokeWidth="0.5" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh)" />
    </svg>
  );
}

function FilamentTrail({ points }: { points: Array<[number, number]> }) {
  if (points.length < 2) return null;
  const d = "M " + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  return (
    <svg className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.715 0.135 215 / 0)" />
          <stop offset="100%" stopColor="oklch(0.715 0.135 215)" />
        </linearGradient>
      </defs>
      <path d={d} stroke="url(#trail)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="3.5"
        fill="oklch(0.715 0.135 215)"
      />
    </svg>
  );
}

function ConstellationPreview() {
  return (
    <div className="relative mt-3 h-32">
      <SignatureGlyph seed="preview" size={120} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}
