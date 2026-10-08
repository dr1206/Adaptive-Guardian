import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { InstrumentPanel } from "@/components/admin/instrument-panel";
import { signalTone } from "@/lib/admin-signal";
import { useAdminIncidents, useAdminNotificationGroups } from "@/services/hooks";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Bell, BellOff, AlertOctagon } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [group, setGroup] = useState("security");
  const groupsQ = useAdminNotificationGroups();
  const incidentsQ = useAdminIncidents();
  const notifGroups = groupsQ.data ?? [];
  const incidents = incidentsQ.data ?? [];
  const filteredIncidents =
    notifGroups.length > 0 && group === notifGroups[0].id
      ? incidents
      : incidents.filter((i) => i.source.toLowerCase().includes(group.toLowerCase()));
  return (
    <AsyncBoundary
      isLoading={groupsQ.isLoading || incidentsQ.isLoading}
      error={(groupsQ.error ?? incidentsQ.error) as Error | null}
    >
      <div className="space-y-6">
        <header>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
            Defense · notifications
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grouped inbox · mute, snooze, route by channel
          </p>
        </header>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-3 space-y-1">
            {notifGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setGroup(g.id)}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                  group === g.id
                    ? "border-cyan-400/40 bg-cyan-500/[0.06]"
                    : "border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bell className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">{g.label}</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${signalTone[g.signal].bg} ${signalTone[g.signal].fg}`}
                >
                  {g.count}
                </span>
              </button>
            ))}
          </aside>

          <div className="col-span-9">
            <InstrumentPanel
              eyebrow={`Group · ${group}`}
              title="Inbox"
              actions={
                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      toast.success("Notifications muted", {
                        description: "This alert channel is muted for 8 hours",
                      })
                    }
                    className="rounded-md border border-white/[0.06] hover:border-white/[0.12] px-2.5 py-1 text-[11px] inline-flex items-center gap-1"
                  >
                    <BellOff className="size-3" />
                    Mute
                  </button>
                  <button
                    onClick={() =>
                      toast.success("Snoozed for 1 hour", {
                        description:
                          "Notifications will resume at " +
                          new Date(Date.now() + 3600000).toLocaleTimeString(),
                      })
                    }
                    className="rounded-md border border-white/[0.06] hover:border-white/[0.12] px-2.5 py-1 text-[11px]"
                  >
                    Snooze 1h
                  </button>
                  <button
                    onClick={() =>
                      toast.info("Slack routing", {
                        description:
                          "Configure Slack webhook in Settings → Integrations to enable routing",
                      })
                    }
                    className="rounded-md border border-white/[0.06] hover:border-white/[0.12] px-2.5 py-1 text-[11px]"
                  >
                    Route to Slack
                  </button>
                </div>
              }
            >
              <div className="space-y-2">
                {filteredIncidents.map((i) => {
                  const tone = signalTone[i.severity];
                  return (
                    <div
                      key={i.id}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.05] p-3 hover:bg-white/[0.03] transition-colors"
                    >
                      <div
                        className={`size-8 rounded-lg ${tone.bg} flex items-center justify-center shrink-0`}
                      >
                        <AlertOctagon className={`size-4 ${tone.fg}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-muted-foreground">{i.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${tone.bg} ${tone.fg} uppercase tracking-wider`}
                          >
                            {tone.label}
                          </span>
                          <span className="text-muted-foreground">· {i.source}</span>
                        </div>
                        <div className="text-sm mt-1">{i.title}</div>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                        {i.age} ago
                      </span>
                    </div>
                  );
                })}
              </div>
            </InstrumentPanel>
          </div>
        </div>
      </div>
    </AsyncBoundary>
  );
}
