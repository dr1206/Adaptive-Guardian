import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/banking/page-header";
import { Shield } from "@/components/brand/shield";
import { useSession } from "@/services/hooks";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = useSession();

  const participantId = session?.userId?.slice(0, 8).toUpperCase() ?? "USER_001";
  const displayName = session?.displayName ?? "Test User";
  const email = session?.email ?? "user@example.com";

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your participant information." />

      <div className="mx-auto mt-8 max-w-lg">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/20 text-[22px] font-semibold text-accent">
              {displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div>
              <h2 className="font-display text-[20px] font-semibold">{displayName}</h2>
              <p className="text-[13px] text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Participant ID" value={participantId} />
            <Field label="Name" value={displayName} />
            <Field label="Email" value={email} />
            <Field label="Age Group" value="18-25" />
            <Field label="Occupation" value="Student" />
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <Shield size={20} live />
              <div className="text-[12px] leading-relaxed text-muted-foreground">
                <span className="text-foreground">Privacy note:</span> This profile stores only
                research-participant metadata. No Aadhaar, PAN, or sensitive financial information
                is collected or stored.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium">{value}</span>
    </div>
  );
}
