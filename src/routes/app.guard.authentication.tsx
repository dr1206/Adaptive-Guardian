import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { SigilCard } from "@/components/guard/sigil-card";
import { ConfidenceRing } from "@/components/guard/confidence-ring";
import { Sparkline } from "@/components/banking/sparkline";
import { MapPin, ShieldCheck, UserCheck } from "lucide-react";
import { useSession, useAegisSnapshot } from "@/services/hooks";

export const Route = createFileRoute("/app/guard/authentication")({
  component: AuthCenter,
});

const METHODS = [
  { name: "Behavioral biometrics", status: "Active", last: "now", contribution: 62 },
  { name: "Device binding", status: "Active", last: "recent", contribution: 22 },
  { name: "Password authentication", status: "Verified", last: "session start", contribution: 10 },
  { name: "Step-up OTP", status: "Standby", last: "standby", contribution: 6 },
];

const RECENT = [
  { t: "11:07", w: "Step-up OTP · new beneficiary verification", c: 99.4 },
  { t: "10:52", w: "Transfer ₹45,000 · behavioral match confirmed", c: 98.9 },
  { t: "10:18", w: "Profile inspection · continuous score high", c: 97.8 },
  { t: "09:42", w: "Transfer ₹2,400 · continuous auth verified", c: 98.4 },
  { t: "09:14", w: "Secure sign-in · biometric baseline matched", c: 96.2 },
];

function AuthCenter() {
  const { data: session } = useSession();
  const { data: snapshot } = useAegisSnapshot();

  const userName = session?.displayName || "Authorized User";
  const email = session?.email || "user@adaptiveguardian.dev";
  const confidenceScore = snapshot?.confidence ? (snapshot.confidence * 100).toFixed(1) : "98.4";
  const riskScore = snapshot?.risk != null ? snapshot.risk.toFixed(2) : "0.03";

  return (
    <>
      <PageHeader
        eyebrow="Continuous Security"
        title="Authentication Center"
        subtitle="Live authentication factors and behavioral confidence verification."
      />

      <SigilCard className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserCheck className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[20px] font-semibold text-foreground">{userName}</div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">{email}</span>
              <span>•</span>
              <span>Web Banking Portal</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Secure Client Session
              </span>
              <span>•</span>
              <span className="text-success font-medium">Continuously Verified</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Security Trust Score
            </div>
            <div className="font-numeric text-[28px] font-semibold text-primary">
              {Number(confidenceScore) > 90 ? "9.4" : "8.2"}
              <span className="text-[14px] text-muted-foreground">/10</span>
            </div>
          </div>
          <ConfidenceRing value={Number(confidenceScore)} size="md" />
        </div>
      </SigilCard>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {METHODS.map((m) => (
          <SigilCard key={m.name} eyebrow={m.status} title={m.name}>
            <div className="flex items-end justify-between">
              <div className="font-numeric text-[36px] font-semibold tabular-nums">
                {m.contribution}
                <span className="text-[14px] text-muted-foreground">%</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Last · {m.last}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${m.contribution}%`,
                }}
              />
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              Contribution to current confidence.
            </p>
          </SigilCard>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <SigilCard
          className="lg:col-span-7"
          eyebrow="Real-Time Window"
          title="Current authentication metrics"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Mini
              label="Confidence"
              value={`${confidenceScore}%`}
              spark={[88, 92, 94, 96, 97, 98, Number(confidenceScore)]}
            />
            <Mini
              label="Risk Score"
              value={riskScore}
              spark={[0.1, 0.08, 0.05, 0.04, 0.03, 0.03, Number(riskScore)]}
            />
            <Mini label="Behavioral Match" value="96%" spark={[85, 88, 90, 92, 94, 95, 96]} />
            <Mini label="Device Trust" value="99%" spark={[95, 96, 97, 98, 98, 99, 99]} />
          </div>
        </SigilCard>
        <SigilCard
          className="lg:col-span-5"
          eyebrow="Audit Trail"
          title="Recent authentication events"
          to="/app/guard/auth-timeline"
        >
          <ul className="space-y-2">
            {RECENT.map((r, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground"
              >
                <span className="font-numeric text-[11px] tabular-nums text-muted-foreground w-10">
                  {r.t}
                </span>
                <span className="flex-1 text-[12.5px] font-medium">{r.w}</span>
                <span className="font-numeric text-[12px] font-semibold tabular-nums text-success">
                  {r.c}%
                </span>
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
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-[10px] uppercase font-semibold tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-numeric text-[22px] font-bold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1">
        <Sparkline points={spark} width={120} height={22} />
      </div>
    </div>
  );
}
