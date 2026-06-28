import { Shield, Github, Linkedin, Twitter, Mail } from "lucide-react";

const COLS: { title: string; links: string[] }[] = [
  { title: "Platform", links: ["Overview", "Dashboard", "Auth Center", "AI Monitoring", "SHAP"] },
  { title: "Technology", links: ["AI Engine", "Behavioral Biometrics", "LightGBM", "OC-SVM", "SHAP"] },
  { title: "Research", links: ["CMU Dataset", "Publications", "Whitepapers", "Methodology"] },
  { title: "Resources", links: ["Documentation", "API Reference", "Changelog", "Status"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface/40">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 opacity-20 blur-3xl"
        style={{ background: "var(--gradient-cyber)" }}
      />
      <div className="relative mx-auto w-full max-w-[1400px] px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl gradient-cyber">
                <Shield className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </span>
              <span className="font-display text-base font-semibold">
                AdaptiveGuard <span className="text-gradient">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Continuous authentication powered by behavioral biometrics — invisible
              security for modern banking and enterprise platforms.
            </p>

            <form className="mt-6 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground ring-focus"
              />
              <button
                type="button"
                className="rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover-lift"
              >
                Subscribe
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2">
              {[Github, Linkedin, Twitter, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-border-hover hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {COLS.map((c) => (
              <div key={c.title}>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                  {c.title}
                </div>
                <ul className="space-y-2">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} AdaptiveGuard AI. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
