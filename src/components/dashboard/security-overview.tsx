import {
  Activity,
  Brain,
  CheckCircle2,
  CircleDot,
  Cpu,
  Fingerprint,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const CARDS = [
  { icon: ShieldCheck, title: "Auth confidence", metric: "99.2%", note: "30-day high", status: "pass", action: "View" },
  { icon: Smartphone, title: "Trusted device", metric: "MacBook · Lisbon", note: "Bound 18 days ago", status: "pass", action: "Manage" },
  { icon: Fingerprint, title: "Recent verification", metric: "12 ms ago", note: "Behavioral · silent", status: "pass", action: "View" },
  { icon: Activity, title: "Behavior stability", metric: "Stable", note: "± 0.4σ from signature", status: "pass", action: "View" },
  { icon: CircleDot, title: "Session integrity", metric: "A+", note: "2h 14m active", status: "pass", action: "Re-verify" },
  { icon: Brain, title: "AI monitoring", metric: "Active", note: "LightGBM · OC-SVM", status: "pass", action: "View" },
  { icon: Cpu, title: "Risk assessment", metric: "0.04", note: "Low · normal range", status: "pass", action: "View" },
] as const;

export function SecurityOverview() {
  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 backdrop-blur-xl">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight">Security overview</h3>
          <p className="text-[11px] text-muted-foreground">All systems nominal · Aegis last refreshed 4m ago</p>
        </div>
        <button className="text-[11px] text-accent hover:text-foreground">Open Security Center →</button>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="group rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5 transition-colors hover:border-success/30"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-success/10 text-success">
                  <Icon className="h-4 w-4" />
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {c.title}
              </div>
              <div className="mt-1 font-numeric text-[15px] font-semibold tracking-tight">
                {c.metric}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{c.note}</div>
              <button className="mt-3 text-[11px] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                {c.action} →
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
