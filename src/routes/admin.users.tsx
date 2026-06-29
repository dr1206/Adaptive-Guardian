import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { OpsTable } from "@/components/admin/ops-table";
import { SignalDot } from "@/components/admin/signal-dot";
import { signalTone } from "@/lib/admin-signal";
import { useAdminUsers } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Lock,
  Unlock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const usersQ = useAdminUsers();
  const adminUsers = usersQ.data ?? [];
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | "high-risk" | "enrolling" | "locked">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = adminUsers.filter((u) => {
    if (q && !`${u.name} ${u.email} ${u.id}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (view === "high-risk") return u.risk > 0.4;
    if (view === "enrolling") return u.status === "enrolling";
    if (view === "locked") return u.status === "locked";
    return true;
  });

  const user = adminUsers.find((u) => u.id === selected) ?? null;

  return (
    <AsyncBoundary isLoading={usersQ.isLoading} error={usersQ.error as Error | null}>
      <div className="space-y-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              People · users
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {adminUsers.length} enrolled · 4 locked · 6 enrolling
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] px-3 py-2 text-xs inline-flex items-center gap-1.5">
              <Download className="size-3.5" />
              Export
            </button>
            <button className="rounded-xl gradient-primary px-3 py-2 text-xs inline-flex items-center gap-1.5 shadow-glow">
              <UserPlus className="size-3.5" />
              Invite user
            </button>
          </div>
        </header>

        {/* Saved views + filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "high-risk", "enrolling", "locked"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors capitalize ${view === v ? "border-cyan-400/40 bg-cyan-500/[0.08] text-cyan-100" : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12]"}`}
            >
              {v.replace("-", " ")} ·{" "}
              {v === "all"
                ? adminUsers.length
                : adminUsers.filter((u) => (v === "high-risk" ? u.risk > 0.4 : u.status === v))
                    .length}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 w-80">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name · email · id…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] px-3 py-1.5 text-xs inline-flex items-center gap-1.5">
            <Filter className="size-3.5" />
            Filters
          </button>
        </div>

        <OpsTable
          rows={filtered}
          rowKey={(r) => r.id}
          onRow={(r) => setSelected(r.id)}
          columns={[
            {
              key: "user",
              label: "User",
              width: "1.8fr",
              render: (r) => (
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 border border-white/10 flex items-center justify-center text-[11px] font-mono">
                    {r.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                      {r.email}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "id",
              label: "ID",
              width: "0.8fr",
              render: (r) => (
                <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
              ),
            },
            {
              key: "tier",
              label: "Tier",
              width: "0.8fr",
              render: (r) => <span className="text-xs">{r.tier}</span>,
            },
            {
              key: "status",
              label: "Status",
              width: "0.8fr",
              render: (r) => {
                const colors: Record<string, string> = {
                  active: "text-emerald-300 bg-emerald-500/10",
                  locked: "text-rose-300 bg-rose-500/10",
                  enrolling: "text-cyan-300 bg-cyan-500/10",
                  dormant: "text-muted-foreground bg-white/[0.04]",
                };
                return (
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${colors[r.status]}`}
                  >
                    {r.status}
                  </span>
                );
              },
            },
            {
              key: "devices",
              label: "Devices",
              width: "0.6fr",
              render: (r) => (
                <span data-numeric className="text-xs">
                  {r.devices}
                </span>
              ),
            },
            {
              key: "trust",
              label: "Trust",
              width: "0.7fr",
              render: (r) => (
                <span data-numeric className="text-xs">
                  {r.trust.toFixed(2)}
                </span>
              ),
            },
            {
              key: "risk",
              label: "Risk",
              width: "0.8fr",
              render: (r) => {
                const tone = signalTone[r.signal];
                return (
                  <span className="flex items-center gap-1.5">
                    <SignalDot signal={r.signal} pulse={false} size={6} />
                    <span data-numeric className={`text-xs ${tone.fg}`}>
                      {r.risk.toFixed(2)}
                    </span>
                  </span>
                );
              },
            },
            {
              key: "country",
              label: "Geo",
              width: "0.5fr",
              render: (r) => (
                <span className="font-mono text-[11px] text-muted-foreground">{r.country}</span>
              ),
            },
            {
              key: "last",
              label: "Last seen",
              width: "0.8fr",
              align: "right",
              render: (r) => (
                <span className="text-[11px] font-mono text-muted-foreground">{r.lastSeen}</span>
              ),
            },
          ]}
        />

        {/* User workspace drawer */}
        {user && (
          <>
            <div
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
            />
            <aside className="fixed right-0 top-0 bottom-0 w-[min(900px,75vw)] z-50 bg-[oklch(0.18_0.03_264/0.98)] backdrop-blur-2xl border-l border-white/[0.08] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-y-auto animate-in slide-in-from-right duration-300">
              <header className="sticky top-0 z-10 bg-[oklch(0.18_0.03_264)] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 border border-white/10 flex items-center justify-center text-sm font-mono">
                    {user.initials}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{user.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {user.id} · {user.email}
                    </div>
                  </div>
                  <span
                    className={`ml-3 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded ${signalTone[user.signal].bg} ${signalTone[user.signal].fg}`}
                  >
                    {user.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Close ✕
                </button>
              </header>

              <nav className="flex gap-1 px-6 py-3 border-b border-white/[0.06] overflow-x-auto text-xs">
                {[
                  "Profile",
                  "Accounts",
                  "Devices",
                  "Auth history",
                  "Behavior",
                  "Security timeline",
                  "Challenges",
                  "Risk",
                  "Permissions",
                  "Notes",
                ].map((t, i) => (
                  <button
                    key={t}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${i === 0 ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </nav>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <InstrumentPanel
                    dense
                    eyebrow="Trust"
                    title={<span data-numeric>{user.trust.toFixed(2)}</span>}
                  />
                  <InstrumentPanel
                    dense
                    eyebrow="Risk"
                    title={<span data-numeric>{user.risk.toFixed(2)}</span>}
                  />
                  <InstrumentPanel
                    dense
                    eyebrow="Devices"
                    title={<span data-numeric>{user.devices}</span>}
                  />
                  <InstrumentPanel dense eyebrow="Tier" title={user.tier} />
                </div>

                <InstrumentPanel eyebrow="Continuous authentication" title="Confidence · last 24h">
                  <div className="h-32 grid grid-cols-24 gap-1 items-end">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h =
                        30 + Math.sin(i * 0.7 + user.id.charCodeAt(2)) * 30 + Math.random() * 30;
                      return (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-cyan-500/30 to-cyan-400/80 rounded-sm"
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>
                </InstrumentPanel>

                <div className="grid grid-cols-2 gap-3">
                  <InstrumentPanel eyebrow="Recent events" title="Security timeline">
                    <ul className="space-y-2.5 text-sm">
                      {[
                        "Logged in · MacBook Pro",
                        "Confidence dipped to 0.84",
                        "OTP challenge issued · passed",
                        "Added trusted device · iPhone 15",
                        "Behavior baseline updated",
                      ].map((e, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="size-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm">{e}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {i * 27 + 3}m ago
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </InstrumentPanel>
                  <InstrumentPanel eyebrow="Notes" title="Operator notes">
                    <textarea
                      className="w-full h-32 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-sm outline-none focus:border-cyan-400/40"
                      placeholder="Internal notes about this account…"
                    />
                  </InstrumentPanel>
                </div>
              </div>

              <footer className="sticky bottom-0 bg-[oklch(0.18_0.03_264)] border-t border-white/[0.06] px-6 py-3 flex items-center gap-2">
                <button className="rounded-xl border border-rose-400/30 text-rose-300 hover:bg-rose-500/10 px-3 py-2 text-xs inline-flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  Lock account
                </button>
                <button className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 text-xs inline-flex items-center gap-1.5">
                  <Unlock className="size-3.5" />
                  Unlock
                </button>
                <button className="rounded-xl border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 text-xs inline-flex items-center gap-1.5">
                  <RefreshCw className="size-3.5" />
                  Reset enrollment
                </button>
                <button className="rounded-xl border border-amber-400/30 text-amber-200 hover:bg-amber-500/10 px-3 py-2 text-xs inline-flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5" />
                  Force re-auth
                </button>
                <div className="flex-1" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  all actions audited · 2-person approval on destructive
                </span>
              </footer>
            </aside>
          </>
        )}
      </div>
    </AsyncBoundary>
  );
}
