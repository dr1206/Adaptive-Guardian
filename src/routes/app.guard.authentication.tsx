import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { SignatureGlyph } from "@/components/brand/signature-glyph";
import { Sparkline } from "@/components/banking/sparkline";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/app/guard/authentication")({
  component: AuthCenter,
});

const METHODS = [
  { name: "Behavioral biometrics", status: "Active", last: "now", contribution: 62 },
  { name: "Device binding", status: "Active", last: "2h ago", contribution: 22 },
  { name: "Password", status: "On-demand", last: "yesterday", contribution: 10 },
  { name: "Step-up OTP", status: "Standby", last: "3h ago", contribution: 6 },
];

const RECENT = [
  { t: "11:07", w: "Step-up OTP · new beneficiary", c: 99.4 },
  { t: "10:52", w: "Transfer €4,800 · silent", c: 98.9 },
  { t: "10:18", w: "Profile update · silent", c: 97.8 },
  { t: "09:42", w: "Transfer €240 · silent", c: 98.4 },
  { t: "09:14", w: "Sign in · recognized", c: 96.2 },
];

function AuthCenter() {
  return (
    <>
      <PageHeader
        eyebrow="Identity"
        title="Authentication Center"
        subtitle="The proofs that say you are you, right now."
      />

      <SigilCard className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <SignatureGlyph seed="aegis" size={56} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[20px] font-medium">Alex Mendes</div>
            <div className="mt-0.5 inline-flex items-center gap-3 text-[12px] text-muted-foreground">
              <span>MacBook Pro · Safari</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Lisbon, PT
              </span>
              <span>Authenticated since 09:14</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Trust</div>
            <div className="font-numeric text-[28px] font-semibold">9.4<span className="text-[14px] text-muted-foreground">/10</span></div>
          </div>
          <ConfidenceRing value={98.4} size="md" />
        </div>
      </SigilCard>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {METHODS.map((m) => (
          <SigilCard key={m.name} eyebrow={m.status} title={m.name}>
            <div className="flex items-end justify-between">
              <div className="font-numeric text-[36px] font-semibold tabular-nums">
                {m.contribution}<span className="text-[14px] text-muted-foreground">%</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Last · {m.last}</span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${m.contribution}%`,
                  background: "linear-gradient(90deg, oklch(0.655 0.195 258), oklch(0.715 0.135 215))",
                }}
              />
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">Contribution to current confidence.</p>
          </SigilCard>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <SigilCard className="lg:col-span-7" eyebrow="Now" title="Current authentication window">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Mini label="Confidence" value="98.4%" spark={[88, 92, 94, 96, 97, 98, 98.4]} />
            <Mini label="Risk" value="0.03" spark={[0.1, 0.08, 0.05, 0.04, 0.03, 0.03, 0.03]} />
            <Mini label="Behavior" value="96%" spark={[85, 88, 90, 92, 94, 95, 96]} />
            <Mini label="Device" value="99%" spark={[95, 96, 97, 98, 98, 99, 99]} />
          </div>
        </SigilCard>
        <SigilCard className="lg:col-span-5" eyebrow="Last 10" title="Recent authentications" to="/app/guard/auth-timeline">
          <ul className="space-y-2">
            {RECENT.map((r, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                <span className="font-numeric text-[11px] tabular-nums text-muted-foreground w-10">{r.t}</span>
                <span className="flex-1 text-[12.5px]">{r.w}</span>
                <span className="font-numeric text-[12px] tabular-nums text-success">{r.c}%</span>
              </li>
            ))}
          </ul>
        </SigilCard>
      </section>
    </>
  );
}

function Mini({ label, value, spark }: { label: string; value: string; spark: number[] }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-numeric text-[22px] font-semibold tabular-nums">{value}</div>
      <div className="mt-1"><Sparkline points={spark} width={120} height={22} /></div>
    </div>
  );
}
