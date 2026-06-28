import { CreditCard, QrCode, Receipt, Send, Snowflake, UserPlus } from "lucide-react";

const ACTIONS = [
  { icon: Send, label: "Transfer", kbd: "⌘N", tone: "accent" },
  { icon: Receipt, label: "Pay bills", kbd: "⌘B", tone: "purple" },
  { icon: QrCode, label: "Scan QR", kbd: "⌘Q", tone: "accent" },
  { icon: UserPlus, label: "Add beneficiary", kbd: "⌘P", tone: "purple" },
  { icon: Snowflake, label: "Freeze card", kbd: "⌘F", tone: "warning" },
  { icon: CreditCard, label: "New card", kbd: "⌘C", tone: "accent" },
];

export function ActionDock() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const tone =
          a.tone === "warning"
            ? "text-warning bg-warning/10"
            : a.tone === "purple"
              ? "text-purple bg-purple/10"
              : "text-accent bg-accent/10";
        return (
          <button
            key={a.label}
            className="group relative flex h-[112px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]"
          >
            <span className={`grid h-9 w-9 place-items-center rounded-xl transition-transform group-hover:scale-110 ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex items-end justify-between">
              <span className="text-[12px] font-medium leading-tight">{a.label}</span>
              <kbd className="font-numeric text-[10px] text-muted-foreground/60">{a.kbd}</kbd>
            </div>
          </button>
        );
      })}
    </div>
  );
}
