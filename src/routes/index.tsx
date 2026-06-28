import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  ChevronRight,
  Cpu,
  Database,
  Eye,
  Fingerprint,
  Github,
  KeyRound,
  Keyboard,
  Layers,
  LineChart,
  Lock,
  Linkedin,
  Mail,
  MapPin,
  MousePointer2,
  Network,
  Play,
  Quote,
  Radar,
  Server,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Workflow,
  Zap,
  CheckCircle2,
  Check,
  ScanFace,
  Gauge,
  AlertTriangle,
  Users,
  FileSearch,
  Boxes,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Section } from "@/components/landing/section";
import { Counter } from "@/components/landing/counter";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdaptiveGuard AI — Continuous Authentication. Invisible Security." },
      {
        name: "description",
        content:
          "Enterprise behavioral biometrics for modern banking. AdaptiveGuard AI continuously verifies identity throughout every session using AI and machine learning.",
      },
      { property: "og:title", content: "AdaptiveGuard AI — Continuous Authentication" },
      {
        property: "og:description",
        content:
          "Protect every session, not just the login. AI-powered behavioral biometrics for enterprise FinTech.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Problem />
      <Solution />
      <AiEngine />
      <PlatformFeatures />
      <HowItWorks />
      <TechStack />
      <Research />
      <Security />
      <Screenshots />
      <Stats />
      <Testimonials />
      <Pricing />
      <FaqSection />
      <Contact />
      <Footer />
    </div>
  );
}

/* ============================================================ HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-44">
      {/* gradient mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.575 0.215 263 / 0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 30%, oklch(0.715 0.135 215 / 0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 20% 40%, oklch(0.635 0.215 295 / 0.15), transparent 60%)",
        }}
      />
      {/* grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.84 0.018 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.84 0.018 250) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] gap-16 px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <div className="glass-card inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            New · Adaptive Learning v2 is now live
            <ChevronRight className="h-3 w-3" />
          </div>

          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[68px]">
            Continuous Authentication
            <br />
            powered by{" "}
            <span className="text-gradient">Artificial Intelligence</span>.
          </h1>

          <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Traditional authentication verifies users only once. AdaptiveGuard AI
            continuously verifies identity using behavioral biometrics, AI, and
            machine learning — protecting every session, not just the login.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              className="hover-lift inline-flex items-center gap-2 rounded-2xl gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Start Demo
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#watch"
              className="glass-card hover-lift inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/15 text-accent">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Watch Demo
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              { v: "99.2%", l: "Accuracy" },
              { v: "50+", l: "Behavior features" },
              { v: "24/7", l: "Monitoring" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-numeric text-2xl font-semibold tracking-tight">
                  {s.v}
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/* ============================================================ TRUSTED BY */
const TECH_BADGES = [
  "CMU Dataset",
  "Behavioral Biometrics",
  "Machine Learning",
  "LightGBM",
  "One-Class SVM",
  "SHAP",
  "SMOTE",
  "mRMR",
  "FastAPI",
  "React",
  "MongoDB",
];

function TrustedBy() {
  return (
    <section className="relative border-y border-border bg-surface/30 py-14">
      <div className="mx-auto w-full max-w-[1400px] px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Research-inspired by — Built on
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {TECH_BADGES.map((b) => (
            <span
              key={b}
              className="glass-card rounded-full px-4 py-2 text-xs font-medium text-foreground/90 transition-colors hover:border-border-hover hover:text-foreground"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ PROBLEM */
const PROBLEMS = [
  {
    icon: KeyRound,
    title: "Password Theft",
    stat: "81%",
    statLabel: "of breaches involve stolen credentials",
    desc: "Static passwords are guessed, phished, or sold on dark markets — and there is no defense once they're leaked.",
  },
  {
    icon: Network,
    title: "Session Hijacking",
    stat: "1 in 4",
    statLabel: "attacks target active sessions",
    desc: "Token theft and cookie replay let attackers ride a verified session without ever facing a login screen.",
  },
  {
    icon: Users,
    title: "Credential Sharing",
    stat: "43%",
    statLabel: "of employees share access",
    desc: "Shared accounts dissolve identity entirely — you no longer know who is acting on the platform.",
  },
  {
    icon: Lock,
    title: "Device Theft",
    stat: "70M+",
    statLabel: "devices lost or stolen each year",
    desc: "A locked screen is a thin line — once bypassed, every cached session becomes available.",
  },
  {
    icon: Eye,
    title: "Insider Attacks",
    stat: "60%",
    statLabel: "of breaches involve insiders",
    desc: "Valid credentials used by the wrong person look identical to legitimate access in legacy systems.",
  },
  {
    icon: AlertTriangle,
    title: "Post-Login Attacks",
    stat: "92%",
    statLabel: "of fraud happens after login",
    desc: "Authentication ends at the login screen. Everything after is a blind spot — until now.",
  },
];

function Problem() {
  return (
    <Section
      id="solutions"
      eyebrow="The Problem"
      title={
        <>
          Why traditional authentication{" "}
          <span className="text-gradient">fails</span>
        </>
      }
      subtitle="A login is a single moment. An attacker only needs one. We verify identity continuously, throughout the entire session."
      alt
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((p) => (
          <div
            key={p.title}
            className="surface-card hover-lift group relative overflow-hidden rounded-3xl p-7"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger/10 text-danger transition-transform group-hover:scale-110">
                <p.icon className="h-5 w-5" />
              </span>
              <div className="text-right">
                <div className="font-numeric text-2xl font-bold tracking-tight text-foreground">
                  {p.stat}
                </div>
              </div>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
            <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              {p.statLabel}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
              style={{ background: "oklch(0.665 0.235 26)" }}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ SOLUTION FLOW */
const FLOW = [
  { icon: UserCheck, title: "Login", desc: "User signs in normally" },
  { icon: Activity, title: "Behavior Monitoring", desc: "Keystroke + mouse capture" },
  { icon: Brain, title: "AI Analysis", desc: "LightGBM + OC-SVM scoring" },
  { icon: Gauge, title: "Risk Score", desc: "Continuous risk computed" },
  { icon: ShieldCheck, title: "Auth Confidence", desc: "Live confidence updated" },
  { icon: Fingerprint, title: "Silent Verification", desc: "Invisible to the user" },
  { icon: ScanFace, title: "OTP When Needed", desc: "Step-up only on anomaly" },
];

function Solution() {
  return (
    <Section
      eyebrow="The Solution"
      title={
        <>
          Introducing{" "}
          <span className="text-gradient">continuous authentication</span>
        </>
      }
      subtitle="Identity is verified at every interaction — not just at the door. The user sees nothing. The AI sees everything."
    >
      <div className="relative">
        {/* connector line */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[44px] hidden h-px lg:block"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.655 0.195 258 / 0.6), oklch(0.715 0.135 215 / 0.6), oklch(0.635 0.215 295 / 0.6), transparent)",
          }}
        />
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-7 lg:gap-3">
          {FLOW.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="surface-card hover-lift relative flex flex-col items-center rounded-3xl p-5 text-center">
                <span className="absolute -top-2 right-3 rounded-full bg-card px-2 py-0.5 font-numeric text-[10px] font-semibold text-muted-foreground">
                  0{i + 1}
                </span>
                <span className="grid h-[88px] w-[88px] place-items-center rounded-2xl gradient-cyber shadow-glow">
                  <s.icon className="h-7 w-7 text-primary-foreground" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ============================================================ AI ENGINE */
const ENGINE = [
  { icon: Activity, title: "Behavior Collector", desc: "Captures keystroke timing, mouse trajectories, scroll patterns at 60Hz." },
  { icon: Layers, title: "Feature Extraction", desc: "Derives 50+ behavioral features in real time per session window." },
  { icon: TrendingUp, title: "LightGBM", desc: "Gradient-boosted classifier scoring legitimate vs anomalous patterns." },
  { icon: Target, title: "One-Class SVM", desc: "Novelty detection identifies behavior outside the user's profile." },
  { icon: FileSearch, title: "SHAP", desc: "Explains every decision — analysts see exactly why a session was flagged." },
  { icon: Brain, title: "Adaptive Learning", desc: "Profile drifts naturally with the user, retrained continuously." },
  { icon: Fingerprint, title: "Behavior Profile", desc: "A living biometric template unique to every individual user." },
  { icon: Radar, title: "Continuous Monitoring", desc: "Every event scored — risk and confidence update second-by-second." },
];

function AiEngine() {
  return (
    <Section
      id="technology"
      eyebrow="AI Engine"
      title={
        <>
          The architecture behind{" "}
          <span className="text-gradient">invisible security</span>
        </>
      }
      subtitle="A layered pipeline of behavioral capture, feature engineering, and explainable models — built for production scale."
      alt
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENGINE.map((c) => (
          <div
            key={c.title}
            className="glass-card hover-lift gradient-border group relative overflow-hidden rounded-3xl p-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-accent transition-colors group-hover:text-foreground">
              <c.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ PLATFORM FEATURES */
const FEATURES = [
  { icon: Fingerprint, title: "Behavioral Biometrics", desc: "Identify users by how they type and move, not what they know." },
  { icon: Zap, title: "Real-Time Authentication", desc: "Sub-second scoring on every behavioral window." },
  { icon: Brain, title: "Adaptive Learning", desc: "Profiles evolve with users — no manual retraining cycles." },
  { icon: Radar, title: "Continuous Monitoring", desc: "Every action evaluated — never a single point of trust." },
  { icon: ScanFace, title: "OTP Challenge", desc: "Step-up authentication triggered only when risk requires it." },
  { icon: FileSearch, title: "Explainable AI", desc: "SHAP-powered transparency for every flagged session." },
  { icon: AlertTriangle, title: "Risk Detection", desc: "Anomalies surfaced as they happen, not in next-day reports." },
  { icon: BarChart3, title: "Enterprise Dashboard", desc: "Operations-grade view of users, sessions, and threats." },
  { icon: LineChart, title: "Live Analytics", desc: "Real-time behavioral and security telemetry." },
  { icon: CheckCircle2, title: "Zero-Friction UX", desc: "Invisible to legitimate users — security without burden." },
  { icon: Workflow, title: "Behavior Drift Detection", desc: "Detect gradual profile shifts versus sudden takeovers." },
  { icon: Eye, title: "Session Monitoring", desc: "Full timeline of every authenticated session." },
];

function PlatformFeatures() {
  return (
    <Section
      id="platform"
      eyebrow="Platform Features"
      title={
        <>
          Everything you need to{" "}
          <span className="text-gradient">protect every session</span>
        </>
      }
      subtitle="A complete continuous authentication platform — from behavioral capture to enterprise reporting."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="surface-card hover-lift group flex items-start gap-4 rounded-2xl p-5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-glow transition-colors group-hover:bg-primary/20">
              <f.icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ HOW IT WORKS */
const STEPS = [
  { n: "01", title: "Register", icon: UserCheck, desc: "Create an account and begin a guided onboarding flow." },
  { n: "02", title: "Behavior Profile Created", icon: Fingerprint, desc: "Initial typing and movement patterns establish a baseline." },
  { n: "03", title: "Login", icon: KeyRound, desc: "Standard credential verification — familiar, frictionless." },
  { n: "04", title: "AI Monitors Behavior", icon: Brain, desc: "Each interaction streamed to the live scoring engine." },
  { n: "05", title: "Risk Analysis", icon: Gauge, desc: "Continuous risk and confidence values updated in real time." },
  { n: "06", title: "Session Protected", icon: ShieldCheck, desc: "Step-up challenges trigger only when anomalies appear." },
];

function HowItWorks() {
  return (
    <Section
      eyebrow="How it works"
      title={
        <>
          From registration to{" "}
          <span className="text-gradient">protected session</span>
        </>
      }
      subtitle="Six steps. Invisible to the user. Always on for the security team."
      alt
    >
      <div className="relative mx-auto max-w-4xl">
        <div
          aria-hidden
          className="absolute left-[27px] top-2 bottom-2 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, oklch(0.655 0.195 258 / 0.6), oklch(0.635 0.215 295 / 0.6), transparent)",
          }}
        />
        <ol className="space-y-5">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <div className="surface-card hover-lift flex items-start gap-5 rounded-2xl p-5 pl-20">
                <span className="absolute left-0 top-5 grid h-14 w-14 place-items-center rounded-2xl gradient-cyber shadow-glow">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-numeric text-xs font-semibold text-accent">
                      Step {s.n}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ============================================================ TECH STACK */
const STACK: { group: string; items: { name: string; icon: typeof Brain }[] }[] = [
  { group: "Frontend", items: [{ name: "React", icon: Boxes }] },
  { group: "Backend", items: [{ name: "FastAPI", icon: Server }] },
  { group: "Database", items: [{ name: "MongoDB", icon: Database }, { name: "Redis", icon: Database }] },
  {
    group: "Machine Learning",
    items: [
      { name: "LightGBM", icon: TrendingUp },
      { name: "One-Class SVM", icon: Target },
      { name: "SHAP", icon: FileSearch },
      { name: "SMOTE", icon: Layers },
      { name: "mRMR", icon: Settings2 },
    ],
  },
  { group: "Deployment", items: [{ name: "Docker", icon: Cpu }] },
];

function TechStack() {
  return (
    <Section
      eyebrow="Technology Stack"
      title={
        <>
          Built on{" "}
          <span className="text-gradient">modern, production-grade</span>{" "}
          infrastructure
        </>
      }
      subtitle="Open standards, battle-tested ML, and a deployment story that scales from research lab to enterprise rollout."
    >
      <div className="space-y-6">
        {STACK.map((g) => (
          <div key={g.group}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {g.group}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {g.items.map((it) => (
                <div
                  key={it.name}
                  className="glass-card hover-lift group flex items-center gap-3 rounded-2xl p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-cyber shadow-glow transition-transform group-hover:scale-110">
                    <it.icon className="h-4 w-4 text-primary-foreground" />
                  </span>
                  <span className="text-sm font-semibold">{it.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ RESEARCH */
const RESEARCH = [
  { date: "2024", title: "Behavioral Biometrics at Scale", topic: "Continuous Authentication", abstract: "Evaluating 50+ behavioral features across 10k sessions for low-friction identity assurance." },
  { date: "2024", title: "Explainable Anomaly Detection", topic: "AI Explainability", abstract: "SHAP-based attribution for one-class SVM decisions in production authentication systems." },
  { date: "2023", title: "Adaptive Profile Learning", topic: "Adaptive Learning", abstract: "Online retraining strategies that follow legitimate behavior drift while resisting takeover attempts." },
  { date: "2023", title: "Post-Login Session Security", topic: "Session Security", abstract: "Quantifying risk reduction from continuous verification versus point-in-time authentication." },
];

function Research() {
  return (
    <Section
      id="research"
      eyebrow="Research"
      title={
        <>
          Grounded in{" "}
          <span className="text-gradient">peer-reviewed research</span>
        </>
      }
      subtitle="The AdaptiveGuard engine builds on published work in behavioral biometrics, machine learning, and explainable AI."
      alt
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {RESEARCH.map((r) => (
          <article
            key={r.title}
            className="surface-card hover-lift group rounded-3xl p-7"
          >
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-numeric font-semibold text-accent">{r.date}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="uppercase tracking-wider">{r.topic}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
              {r.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {r.abstract}
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
              Read paper
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ SECURITY */
const SECURITY = [
  { icon: Lock, title: "End-to-End Security", desc: "TLS 1.3 in transit. AES-256 at rest. Zero plaintext exposure." },
  { icon: KeyRound, title: "JWT Authentication", desc: "Signed, short-lived session tokens with refresh rotation." },
  { icon: ScanFace, title: "OTP Verification", desc: "Step-up challenges issued only when behavioral risk demands it." },
  { icon: Activity, title: "Behavior Analysis", desc: "Live biometric scoring across every authenticated session." },
  { icon: Eye, title: "Session Monitoring", desc: "Full audit trail of risk, confidence, and challenges." },
  { icon: Brain, title: "Adaptive AI", desc: "Models retrain online — your defense compounds over time." },
  { icon: AlertTriangle, title: "Threat Detection", desc: "Anomalies surfaced in real time with explainable signals." },
  { icon: Database, title: "Encrypted Data", desc: "Behavioral templates stored as irreversible feature vectors." },
];

function Security() {
  return (
    <Section
      id="security"
      eyebrow="Security"
      title={
        <>
          Enterprise-grade defense,{" "}
          <span className="text-gradient">end-to-end</span>
        </>
      }
      subtitle="Security is not a feature — it's the foundation. Every layer of the platform is built to protect identity, data, and trust."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl"
            style={{ background: "var(--gradient-cyber)", opacity: 0.25 }}
          />
          <div className="surface-card relative grid aspect-square place-items-center overflow-hidden rounded-[2rem]">
            {/* concentric rings */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                aria-hidden
                className="absolute rounded-full border border-border"
                style={{
                  width: `${i * 22}%`,
                  height: `${i * 22}%`,
                  borderColor: `oklch(0.655 0.195 258 / ${0.5 - i * 0.1})`,
                  animation: `float-soft ${4 + i}s ease-in-out infinite`,
                }}
              />
            ))}
            <div className="relative grid h-28 w-28 place-items-center rounded-3xl gradient-cyber shadow-glow">
              <Shield className="h-10 w-10 text-primary-foreground" strokeWidth={1.8} />
            </div>
            {/* orbiting nodes */}
            {[Fingerprint, KeyRound, Brain, ShieldCheck].map((Icon, i) => (
              <div
                key={i}
                className="glass-card absolute grid h-10 w-10 place-items-center rounded-xl text-accent"
                style={{
                  top: `${20 + Math.sin((i * Math.PI) / 2) * 35 + 30}%`,
                  left: `${20 + Math.cos((i * Math.PI) / 2) * 35 + 30}%`,
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SECURITY.map((s) => (
            <div
              key={s.title}
              className="surface-card hover-lift flex items-start gap-3 rounded-2xl p-5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                <s.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ============================================================ SCREENSHOTS */
const SCREENS = [
  { title: "Banking Dashboard", desc: "Accounts, balances, and quick transfers at a glance." },
  { title: "AI Monitoring", desc: "Live behavioral scoring across every active session." },
  { title: "Authentication Center", desc: "Continuous identity confidence with full session timeline." },
  { title: "Security Center", desc: "Risks, anomalies, and step-up challenges in one view." },
  { title: "Transactions", desc: "Audited, filtered, and exportable financial activity." },
  { title: "SHAP Dashboard", desc: "Explainable AI for every authentication decision." },
];

function Screenshots() {
  return (
    <Section
      eyebrow="The Product"
      title={
        <>
          A platform crafted with{" "}
          <span className="text-gradient">obsessive detail</span>
        </>
      }
      subtitle="From dashboards to the AI engine — every surface is designed to feel premium, secure, and effortless."
      alt
    >
      <div className="-mx-6 overflow-x-auto pb-6">
        <div className="flex gap-5 px-6">
          {SCREENS.map((s, i) => (
            <div
              key={s.title}
              className="surface-card hover-lift relative w-[420px] shrink-0 overflow-hidden rounded-3xl"
            >
              <div className="flex items-center gap-1.5 border-b border-border bg-background/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 text-[11px] text-muted-foreground">
                  adaptiveguard.ai / {s.title.toLowerCase().replace(/\s+/g, "-")}
                </span>
              </div>
              <div className="relative p-5">
                <ScreenMock variant={i} />
                <div className="mt-5">
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ScreenMock({ variant }: { variant: number }) {
  const bars = [60, 80, 45, 90, 55, 75, 65, 85, 50, 95];
  return (
    <div className="h-[200px] rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-2 w-20 rounded-full bg-border" />
          <div className="h-3 w-32 rounded-full bg-card-elevated" />
        </div>
        <div className="h-7 w-16 rounded-lg gradient-primary opacity-80" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card/50 p-2.5">
            <div className="h-1.5 w-10 rounded-full bg-border" />
            <div className="mt-2 h-3 w-14 rounded bg-card-elevated" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-[60px] items-end gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${
              variant % 2 === 0 ? "gradient-cyber" : "gradient-primary"
            } opacity-${i % 3 === 0 ? "100" : "70"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================ STATS */
function Stats() {
  return (
    <Section>
      <div className="surface-card gradient-border relative overflow-hidden rounded-[2rem] p-10 sm:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[600px] -translate-x-1/2 blur-3xl"
          style={{ background: "var(--gradient-cyber)", opacity: 0.18 }}
        />
        <div className="relative grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-5">
          <Stat value={<Counter to={99.2} decimals={1} suffix="%" />} label="Authentication Accuracy" />
          <Stat value={<Counter to={50} suffix="+" />} label="Behavior Features" />
          <Stat value="24/7" label="Monitoring" />
          <Stat value={<Counter to={100} suffix="%" />} label="Session Protection" />
          <Stat value="AI" label="Continuous Authentication" />
        </div>
      </div>
    </Section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="text-gradient">{value}</span>
      </div>
      <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/* ============================================================ TESTIMONIALS */
const TESTIMONIALS = [
  {
    quote:
      "AdaptiveGuard catches takeover attempts that every other layer misses. Continuous authentication is no longer a research idea — it's our production baseline.",
    name: "Dr. Elena Marquez",
    role: "Cybersecurity Researcher",
    org: "Independent",
  },
  {
    quote:
      "We went from reacting to fraud to preventing it mid-session. The SHAP explanations finally gave our analysts a story behind every flag.",
    name: "James Okafor",
    role: "Bank Security Officer",
    org: "Tier-1 European Bank",
  },
  {
    quote:
      "The integration is clean, the ML is modern, and the dashboards feel like a product we'd build ourselves. Rare combination.",
    name: "Priya Raghavan",
    role: "FinTech Architect",
    org: "Series-C Neobank",
  },
  {
    quote:
      "Behavioral biometrics done right — explainable, adaptive, and grounded in solid research. A reference implementation, frankly.",
    name: "Prof. Daniel Hahn",
    role: "Research Professor",
    org: "Applied ML Lab",
  },
];

function Testimonials() {
  return (
    <Section
      eyebrow="Trusted by experts"
      title={
        <>
          What security and{" "}
          <span className="text-gradient">FinTech leaders</span> say
        </>
      }
      alt
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="surface-card hover-lift relative overflow-hidden rounded-3xl p-7"
          >
            <Quote className="h-6 w-6 text-accent/60" />
            <blockquote className="mt-4 text-base leading-relaxed text-foreground/90">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <span className="grid h-10 w-10 place-items-center rounded-full gradient-cyber font-display text-sm font-semibold text-primary-foreground">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.role} · {t.org}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ PRICING */
const PLANS = [
  {
    name: "Academic",
    price: "Free",
    desc: "For research, coursework, and academic evaluation.",
    cta: "Get started",
    features: [
      "Up to 100 users",
      "Behavioral biometrics core",
      "LightGBM + OC-SVM models",
      "SHAP explainability",
      "Community support",
    ],
    highlight: false,
  },
  {
    name: "Research",
    price: "Contact",
    desc: "For research labs and pilot programs at scale.",
    cta: "Start pilot",
    features: [
      "Up to 10,000 users",
      "All Academic features",
      "Adaptive profile retraining",
      "Custom feature engineering",
      "Dedicated research support",
      "Anonymized dataset export",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For banks, FinTechs, and security-critical platforms.",
    cta: "Talk to sales",
    features: [
      "Unlimited users & sessions",
      "All Research features",
      "Single sign-on (SSO)",
      "Custom risk policies",
      "24/7 enterprise SLA",
      "On-premise deployment",
      "Compliance package",
    ],
    highlight: false,
  },
];

function Pricing() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title={
        <>
          Plans built for{" "}
          <span className="text-gradient">every stage of adoption</span>
        </>
      }
      subtitle="From academic exploration to enterprise deployment — choose the tier that matches your scale."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-3xl p-8 ${
              p.highlight
                ? "gradient-border surface-card shadow-glow"
                : "surface-card hover-lift"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-cyber px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">
                Most popular
              </span>
            )}
            <div>
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </div>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold tracking-tight">
                {p.price}
              </span>
              {p.price !== "Free" && p.price !== "Custom" && p.price !== "Contact" && (
                <span className="text-sm text-muted-foreground">/month</span>
              )}
            </div>
            <ul className="mt-7 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`mt-8 inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                p.highlight
                  ? "gradient-primary text-primary-foreground shadow-glow hover-lift"
                  : "border border-border text-foreground hover:bg-card"
              }`}
            >
              {p.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================ FAQ */
const FAQ_ITEMS = [
  {
    q: "How does AdaptiveGuard protect user privacy?",
    a: "We never store raw keystrokes or mouse coordinates. Behavior is converted into irreversible feature vectors at the edge, and all profile data is encrypted at rest with strict access controls.",
  },
  {
    q: "What exactly is tracked as 'behavior'?",
    a: "Aggregate timing patterns — keystroke dwell and flight times, mouse trajectory curvature, scroll cadence. No keystroke content, no screen capture, no document contents are ever collected.",
  },
  {
    q: "Which machine learning models power the engine?",
    a: "A LightGBM gradient-boosted classifier for known patterns and a One-Class SVM for novelty detection, with SHAP providing per-decision explainability for every flagged session.",
  },
  {
    q: "When does the user actually see an OTP challenge?",
    a: "Only when behavioral risk crosses a configurable threshold. Legitimate users see nothing — step-up authentication is reserved for genuine anomalies.",
  },
  {
    q: "How is this more secure than traditional MFA?",
    a: "MFA verifies you once. AdaptiveGuard verifies you continuously — every interaction is scored, so a stolen session is detected in seconds, not at next login.",
  },
  {
    q: "What happens when my behavior naturally changes?",
    a: "Profiles drift with you. Adaptive learning retrains continuously, distinguishing gradual lifestyle drift from sudden takeover attempts.",
  },
];

function FaqSection() {
  return (
    <Section
      eyebrow="FAQ"
      title="Questions, answered"
      subtitle="Everything you need to know about behavioral biometrics, privacy, and continuous authentication."
      alt
    >
      <Faq items={FAQ_ITEMS} />
    </Section>
  );
}

/* ============================================================ CONTACT */
function Contact() {
  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title={
        <>
          Talk to the team behind{" "}
          <span className="text-gradient">AdaptiveGuard AI</span>
        </>
      }
      subtitle="Pilot deployments, research partnerships, or technical deep-dives — we'd love to hear from you."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {[
            { icon: Mail, label: "Email", value: "hello@adaptiveguard.ai" },
            { icon: MapPin, label: "Office", value: "Innovation District · Remote-first" },
            { icon: Github, label: "GitHub", value: "github.com/adaptiveguard-ai" },
            { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/company/adaptiveguard" },
          ].map((c) => (
            <div
              key={c.label}
              className="surface-card hover-lift flex items-center gap-4 rounded-2xl p-5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-cyber shadow-glow">
                <c.icon className="h-4 w-4 text-primary-foreground" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </div>
                <div className="truncate text-sm font-semibold">{c.value}</div>
              </div>
            </div>
          ))}

          <div className="surface-card relative overflow-hidden rounded-3xl p-1">
            <div
              className="relative h-44 rounded-[1.4rem] border border-border"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(0.84 0.018 250 / 0.08) 1px, transparent 1px), linear-gradient(90deg, oklch(0.84 0.018 250 / 0.08) 1px, transparent 1px), radial-gradient(ellipse at center, oklch(0.575 0.215 263 / 0.25), transparent 60%)",
                backgroundSize: "32px 32px, 32px 32px, 100% 100%",
              }}
            >
              <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full gradient-cyber shadow-glow pulse-live">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </span>
            </div>
          </div>
        </div>

        <form className="surface-card space-y-4 rounded-3xl p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" placeholder="Ada Lovelace" />
            <Field label="Work email" placeholder="ada@company.com" type="email" />
          </div>
          <Field label="Company" placeholder="AdaptiveGuard Bank" />
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              How can we help?
            </label>
            <textarea
              rows={5}
              placeholder="Tell us about your use case…"
              className="w-full resize-none rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground ring-focus"
            />
          </div>
          <button
            type="button"
            className="hover-lift inline-flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Send message
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Section>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground ring-focus"
      />
    </div>
  );
}
