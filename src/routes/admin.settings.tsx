import { createFileRoute } from "@tanstack/react-router";
import { InstrumentPanel } from "@/components/admin/instrument-panel";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const sections = [
  {
    id: "org",
    label: "Organization",
    items: ["Brand profile", "Time zone & locale", "Default currency", "Working hours"],
  },
  {
    id: "auth",
    label: "Authentication",
    items: ["Confidence thresholds", "Challenge policies", "Trusted device window", "Idle timeout"],
  },
  {
    id: "ai",
    label: "AI engine",
    items: ["Active model", "Auto-deploy candidate", "Drift threshold", "Retraining cadence"],
  },
  {
    id: "integ",
    label: "Integrations",
    items: ["Slack", "Email · SMTP", "SIEM webhook", "Bug bounty webhook"],
  },
  {
    id: "retention",
    label: "Retention",
    items: ["Auth logs", "Behavior windows", "Audit chain", "DSR pipeline"],
  },
  {
    id: "appearance",
    label: "Appearance",
    items: ["Theme", "Density", "Reduced motion", "Accessibility"],
  },
];

function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
          Platform · settings
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organization-wide configuration · changes audited
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((s) => (
          <InstrumentPanel key={s.id} eyebrow={s.id} title={s.label}>
            <ul className="divide-y divide-white/[0.04]">
              {s.items.map((it) => (
                <li key={it} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground/90">{it}</span>
                  <button className="text-xs text-cyan-300 hover:text-cyan-200">Configure →</button>
                </li>
              ))}
            </ul>
          </InstrumentPanel>
        ))}
      </div>
    </div>
  );
}
