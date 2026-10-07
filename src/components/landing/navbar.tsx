import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Menu, X, ArrowRight } from "lucide-react";

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Technology", href: "#technology" },
  { label: "Security", href: "#security" },
  { label: "Research", href: "#research" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`flex w-full max-w-[1400px] items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 ${
          scrolled ? "glass-panel border-border/60 shadow-lg" : "border-transparent bg-transparent"
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5 pl-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Shield className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-[16px] font-bold tracking-tight text-foreground">
            Adaptive Guardian{" "}
            <span className="text-primary font-normal text-xs uppercase tracking-widest pl-1">
              Bank
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="hidden rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted md:inline-flex"
          >
            Admin Portal
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Banking Login
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass-panel absolute inset-x-4 top-20 rounded-2xl p-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
