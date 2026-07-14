import { useEffect, useState } from "react";
import { Search, Bell, Plus, Command as CmdIcon } from "lucide-react";
import { SignatureGlyph } from "@/components/brand/signature-glyph";
import { useAegisSnapshot, useDashboardNotifications } from "@/services/hooks";
import { cn } from "@/lib/utils";

export function CommandBar({ glyphSeed = "guest" }: { glyphSeed?: string }) {
  const [time, setTime] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { data: snapshot } = useAegisSnapshot();
  const { data: notifFeed } = useDashboardNotifications();

  const confidence = snapshot?.confidence != null ? Math.round(snapshot.confidence * 1000) / 10 : 99.2;
  const unreadCount = notifFeed?.unreadCount ?? 0;

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const i = setInterval(tick, 30_000);
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearInterval(i);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 transition-all",
        scrolled
          ? "border-b border-white/[0.06] bg-[oklch(0.13_0.025_264/0.7)] backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="flex h-16 items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-[520px]">
          <label htmlFor="app-search" className="sr-only">
            Search transactions, beneficiaries, settings
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="app-search"
            placeholder="Search…"
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-12 sm:pr-16 text-[13px] placeholder:text-muted-foreground/70 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
          <kbd
            aria-hidden
            className="absolute right-3 top-1/2 hidden sm:inline-flex h-5 -translate-y-1/2 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 font-numeric text-[10px] text-muted-foreground"
          >
            <CmdIcon className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Aegis pill */}
          <button
            aria-label={`Aegis security · ${confidence.toFixed(1)}% confidence`}
            className="group inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 transition-colors hover:border-accent/30"
          >
            <MicroRing value={confidence} />
            <span className="font-numeric text-[12px] font-medium">{confidence.toFixed(1)}%</span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">Aegis</span>
          </button>

          {/* Quick transfer */}
          <button
            aria-label="New transfer"
            className="hidden md:inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> New
            <kbd aria-hidden className="ml-1 font-numeric text-[10px] opacity-60">
              ⌘N
            </kbd>
          </button>

          {/* Bell */}
          <button
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] transition-colors hover:border-white/15"
          >
            <Bell className="h-4 w-4" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] font-semibold text-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Time */}
          <div
            aria-hidden
            className="hidden lg:flex h-11 items-center rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 font-numeric text-[12px] text-muted-foreground"
          >
            {time}
          </div>

          {/* Avatar */}
          <button
            aria-label="Account menu"
            className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-accent/40"
          >
            <SignatureGlyph seed={glyphSeed} size={36} animated={false} />
          </button>
        </div>
      </div>
    </header>
  );
}

function MicroRing({ value }: { value: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg viewBox="0 0 20 20" width="18" height="18">
      <circle cx="10" cy="10" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="2" fill="none" />
      <circle
        cx="10"
        cy="10"
        r={r}
        stroke="oklch(0.715 0.135 215)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 10 10)"
      />
    </svg>
  );
}
