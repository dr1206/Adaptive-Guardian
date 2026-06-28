import { useState } from "react";
import { LogIn, ShieldCheck, Send, User, Banknote, KeyRound, LogOut } from "lucide-react";

type Evt = {
  id: string;
  time: string;
  label: string;
  kind: "login" | "verify" | "transfer" | "profile" | "large" | "challenge" | "logout";
  confidence: number;
  risk: number;
  note: string;
};

const ICONS = {
  login: LogIn,
  verify: ShieldCheck,
  transfer: Send,
  profile: User,
  large: Banknote,
  challenge: KeyRound,
  logout: LogOut,
};

const EVENTS: Evt[] = [
  { id: "1", time: "09:14", label: "Sign in", kind: "login", confidence: 96.2, risk: 0.03, note: "Recognized on trusted device. Behavior matched immediately." },
  { id: "2", time: "09:14", label: "Verification", kind: "verify", confidence: 97.1, risk: 0.02, note: "Behavioral signature passed. No OTP needed." },
  { id: "3", time: "09:42", label: "Transfer €240", kind: "transfer", confidence: 98.4, risk: 0.02, note: "Typing rhythm steady. Press-hold completed cleanly." },
  { id: "4", time: "10:18", label: "Profile update", kind: "profile", confidence: 97.8, risk: 0.03, note: "Address change. Behavior consistent with recent sessions." },
  { id: "5", time: "10:52", label: "Transfer €4,800", kind: "large", confidence: 98.9, risk: 0.05, note: "Large amount. Confirmed silently — behavior + device strongly recognized." },
  { id: "6", time: "11:07", label: "Step-up OTP", kind: "challenge", confidence: 99.4, risk: 0.04, note: "Asked one extra proof for new beneficiary. Passed in 4s." },
];

export function SessionRiver() {
  const [active, setActive] = useState<string | null>(null);
  const sel = EVENTS.find((e) => e.id === active);
  return (
    <div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${EVENTS.length}, minmax(0,1fr))` }}>
          {EVENTS.map((e) => {
            const Icon = ICONS[e.kind];
            const tone =
              e.kind === "challenge"
                ? "text-warning"
                : e.kind === "large"
                  ? "text-accent"
                  : "text-success";
            return (
              <li key={e.id} className="flex flex-col items-center">
                <button
                  onClick={() => setActive(active === e.id ? null : e.id)}
                  className="group relative grid place-items-center"
                >
                  <span
                    className="absolute h-12 w-12 rounded-full transition-opacity"
                    style={{
                      background:
                        "radial-gradient(closest-side, oklch(0.715 0.135 215 / 0.35), transparent 70%)",
                      opacity: active === e.id ? 1 : 0,
                    }}
                  />
                  <span
                    className={`relative grid h-10 w-10 place-items-center rounded-full border bg-[oklch(0.225_0.035_264/0.9)] backdrop-blur-xl transition-colors ${
                      active === e.id ? "border-accent/60" : "border-white/10 group-hover:border-white/25"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${tone}`} />
                  </span>
                </button>
                <div className="mt-2 text-center">
                  <div className="font-numeric text-[11px] text-muted-foreground tabular-nums">{e.time}</div>
                  <div className="text-[11.5px] font-medium leading-tight">{e.label}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {sel && (
        <div
          key={sel.id}
          className="mt-6 grid gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 md:grid-cols-[1fr_auto_auto_auto]"
          style={{ animation: "river-pop .35s ease-out" }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent">{sel.time} · Aegis Lens</div>
            <div className="mt-0.5 font-display text-[18px] font-medium">{sel.label}</div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{sel.note}</p>
          </div>
          <Stat k="Confidence" v={`${sel.confidence}%`} tone="success" />
          <Stat k="Risk" v={sel.risk.toFixed(2)} />
          <Stat k="Decision" v="Allowed" tone="success" />
          <style>{`@keyframes river-pop { from { opacity:0; transform: translateY(4px);} to { opacity:1; transform: translateY(0);} }`}</style>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "success" }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-right">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{k}</div>
      <div className={`mt-0.5 font-numeric text-[16px] tabular-nums ${tone === "success" ? "text-success" : "text-foreground"}`}>{v}</div>
    </div>
  );
}
