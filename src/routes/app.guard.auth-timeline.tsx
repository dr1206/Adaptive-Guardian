import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { SessionRiver } from "@/components/guard/session-river";

export const Route = createFileRoute("/app/guard/auth-timeline")({
  component: AuthTimeline,
});

const DAYS = [
  { label: "Today", events: 6, conf: 98.4 },
  { label: "Yesterday", events: 5, conf: 97.6 },
  { label: "Tue", events: 4, conf: 96.8 },
  { label: "Mon", events: 7, conf: 97.1 },
  { label: "Sun", events: 2, conf: 95.4 },
  { label: "Sat", events: 3, conf: 96.0 },
  { label: "Fri", events: 8, conf: 98.0 },
];

function AuthTimeline() {
  return (
    <>
      <PageHeader
        eyebrow="Identity"
        title="Authentication Timeline"
        subtitle="Every identity moment, in order."
      />
      <SigilCard eyebrow="Today" title="Session river" className="mb-6">
        <SessionRiver />
      </SigilCard>
      <SigilCard eyebrow="Last 7 days" title="Authentication summary">
        <ul className="divide-y divide-white/[0.05]">
          {DAYS.map((d) => (
            <li key={d.label} className="flex items-center gap-4 py-3">
              <div className="w-24 text-[12.5px] font-medium">{d.label}</div>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.conf}%`,
                      background: "linear-gradient(90deg, oklch(0.655 0.195 258), oklch(0.715 0.135 215))",
                    }}
                  />
                </div>
              </div>
              <div className="font-numeric text-[12px] tabular-nums text-muted-foreground w-20 text-right">
                {d.events} events
              </div>
              <div className="font-numeric text-[12.5px] tabular-nums text-success w-16 text-right">
                {d.conf}%
              </div>
            </li>
          ))}
        </ul>
      </SigilCard>
    </>
  );
}
