import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { roles, permissions, rolePermissions } from "@/lib/admin-data";
import { Shield, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/roles")({
  component: RolesPage,
});

function RolesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">People · roles & permissions</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Roles & permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">43 operators across 6 roles · changes are auditable and require 2-person approval</p>
        </div>
        <button className="rounded-xl gradient-primary px-3 py-2 text-xs inline-flex items-center gap-1.5 shadow-glow"><Plus className="size-3.5" />New role</button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {roles.map((r) => (
          <div key={r.id} className={`relative rounded-2xl border border-white/[0.06] p-4 bg-gradient-to-br ${r.color}`}>
            <Shield className="size-4 text-foreground/80" />
            <div className="text-sm font-semibold mt-2">{r.label}</div>
            <div className="text-[11px] font-mono text-muted-foreground mt-1">{r.members} members · {rolePermissions[r.id]?.length ?? 0} perms</div>
          </div>
        ))}
      </div>

      <InstrumentPanel eyebrow="Permission matrix" title="Roles × actions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
                <th className="text-left py-2 px-3 sticky left-0 bg-[oklch(0.215_0.035_264)]">Resource · action</th>
                {roles.map((r) => <th key={r.id} className="px-3 py-2 text-center">{r.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {permissions.flatMap((p) =>
                p.actions.map((a) => (
                  <tr key={`${p.resource}-${a}`} className="border-t border-white/[0.04]">
                    <td className="py-2 px-3 sticky left-0 bg-[oklch(0.215_0.035_264)]">
                      <span className="text-foreground/90">{p.resource}</span>
                      <span className="text-muted-foreground"> · {a}</span>
                    </td>
                    {roles.map((r) => {
                      const has = rolePermissions[r.id]?.includes(`${p.resource}:${a}`);
                      return (
                        <td key={r.id} className="text-center px-3 py-2">
                          <span className={`inline-block size-4 rounded ${has ? "bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/[0.04] border border-white/[0.06]"}`} />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </InstrumentPanel>
    </div>
  );
}
