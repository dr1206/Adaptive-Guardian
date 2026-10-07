# Component Inventory — Storybook Roadmap

Every reusable component shipped across Phases 4A–4D, plus auth/brand primitives. This is the seed list for our internal Storybook (Sprint 2 deliverable). Each component MUST have, before being marked "Storybook-ready":

- **Purpose** — one sentence
- **Props** — TS interface, no `any`
- **States** — default, hover, focus, active, disabled, loading, error, empty
- **Accessibility** — keyboard map, ARIA roles, contrast notes
- **Dependencies** — peer components, hooks, libs
- **Design tokens used** — colors, radii, motion
- **Responsive behavior** — breakpoints, collapse/expand rules

Legend: ✅ Storybook-ready · 🟡 needs stories · 🔴 needs refactor before stories.

## Brand & Identity

| Component      | File                                       | Status | Notes                                                            |
| -------------- | ------------------------------------------ | ------ | ---------------------------------------------------------------- |
| Shield         | `src/components/brand/shield.tsx`          | 🟡     | SVG with idle aperture rotation; reduced-motion variant required |
| SignatureGlyph | `src/components/brand/signature-glyph.tsx` | 🟡     | Deterministic from seed; document seed contract                  |
| Wordmark       | `src/components/brand/wordmark.tsx`        | 🟡     | Sora 700; sizes sm/md/lg                                         |

## Auth

| Component       | File                                       | Status |
| --------------- | ------------------------------------------ | ------ |
| AuthShell       | `src/components/auth/auth-shell.tsx`       | 🟡     |
| ApertureInput   | `src/components/auth/aperture-input.tsx`   | 🟡     |
| OtpPucks        | `src/components/auth/otp-pucks.tsx`        | 🟡     |
| VaultAtmosphere | `src/components/auth/vault-atmosphere.tsx` | 🟡     |

## Banking Primitives

| Component       | File                                           | Status | Notes                                                 |
| --------------- | ---------------------------------------------- | ------ | ----------------------------------------------------- |
| AccountCard     | `src/components/banking/account-card.tsx`      | 🟡     | Variants: obsidian / champagne / iris                 |
| BankCard        | `src/components/banking/bank-card.tsx`         | 🟡     | Freeze overlay, control deck                          |
| BeneficiaryCard | `src/components/banking/beneficiary-card.tsx`  | 🟡     | Deterministic tint from name hash                     |
| CardObject      | `src/components/banking/card-object.tsx`       | 🟡     | 3D perspective; reduce-motion fallback                |
| BalanceTile     | `src/components/banking/balance-tile.tsx`      | 🟡     |                                                       |
| TransactionRow  | `src/components/banking/transaction-row.tsx`   | 🟡     | Expandable detail                                     |
| Sparkline       | `src/components/banking/sparkline.tsx`         | 🟡     | a11y: alt label with trend %                          |
| PressHoldButton | `src/components/banking/press-hold-button.tsx` | 🔴     | Needs keyboard equivalent (Space-hold) before stories |
| InsightCard     | `src/components/banking/insight-card.tsx`      | 🟡     |                                                       |
| EmptyState      | `src/components/banking/empty-state.tsx`       | 🟡     |                                                       |
| PageHeader      | `src/components/banking/page-header.tsx`       | 🟡     |                                                       |
| SecurityStrip   | `src/components/banking/security-strip.tsx`    | 🟡     |                                                       |

## Dashboard

| Component        | File                                             | Status |
| ---------------- | ------------------------------------------------ | ------ |
| VaultRail        | `src/components/dashboard/vault-rail.tsx`        | 🟡     |
| CommandBar       | `src/components/dashboard/command-bar.tsx`       | 🟡     |
| WelcomeHeader    | `src/components/dashboard/welcome-header.tsx`    | 🟡     |
| BalanceHero      | `src/components/dashboard/balance-hero.tsx`      | 🟡     |
| AegisWidget      | `src/components/dashboard/aegis-widget.tsx`      | 🟡     |
| AttentionLane    | `src/components/dashboard/attention-lane.tsx`    | 🟡     |
| ActionDock       | `src/components/dashboard/action-dock.tsx`       | 🟡     |
| WidgetMosaic     | `src/components/dashboard/widget-mosaic.tsx`     | 🟡     |
| TransactionFeed  | `src/components/dashboard/transaction-feed.tsx`  | 🟡     |
| SecurityOverview | `src/components/dashboard/security-overview.tsx` | 🟡     |

## Guard (AI Security Center)

| Component         | File                                          | Status |
| ----------------- | --------------------------------------------- | ------ |
| ConfidenceRing    | `src/components/guard/confidence-ring.tsx`    | 🟡     |
| SigilCard         | `src/components/guard/sigil-card.tsx`         | 🟡     |
| AuroraStrip       | `src/components/guard/aurora-strip.tsx`       | 🟡     |
| WaveformTrace     | `src/components/guard/waveform-trace.tsx`     | 🟡     |
| DecisionWaterfall | `src/components/guard/decision-waterfall.tsx` | 🟡     |
| RiskHeatmap       | `src/components/guard/risk-heatmap.tsx`       | 🟡     |
| DriftBandChart    | `src/components/guard/drift-band-chart.tsx`   | 🟡     |
| SessionRiver      | `src/components/guard/session-river.tsx`      | 🟡     |
| DeviceCard        | `src/components/guard/device-card.tsx`        | 🟡     |
| GuardSubRail      | `src/components/guard/guard-sub-rail.tsx`     | 🟡     |

## Admin (Cockpit)

| Component       | File                                        | Status |
| --------------- | ------------------------------------------- | ------ |
| OpsRail         | `src/components/admin/ops-rail.tsx`         | 🟡     |
| OpsChrome       | `src/components/admin/ops-chrome.tsx`       | 🟡     |
| InstrumentPanel | `src/components/admin/instrument-panel.tsx` | 🟡     |
| MetricCell      | `src/components/admin/metric-cell.tsx`      | 🟡     |
| RiverChart      | `src/components/admin/river-chart.tsx`      | 🟡     |
| HeatGrid        | `src/components/admin/heat-grid.tsx`        | 🟡     |
| RiskGauge       | `src/components/admin/risk-gauge.tsx`       | 🟡     |
| PipelineFlow    | `src/components/admin/pipeline-flow.tsx`    | 🟡     |
| LiveTape        | `src/components/admin/live-tape.tsx`        | 🟡     |
| GeoMap          | `src/components/admin/geo-map.tsx`          | 🟡     |
| OpsTable        | `src/components/admin/ops-table.tsx`        | 🟡     |
| SignalDot       | `src/components/admin/signal-dot.tsx`       | 🟡     |
| AegisConsole    | `src/components/admin/aegis-console.tsx`    | 🟡     |

## Landing

| Component  | File                                     | Status |
| ---------- | ---------------------------------------- | ------ |
| Navbar     | `src/components/landing/navbar.tsx`      | 🟡     |
| HeroVisual | `src/components/landing/hero-visual.tsx` | 🟡     |
| Section    | `src/components/landing/section.tsx`     | 🟡     |
| Counter    | `src/components/landing/counter.tsx`     | 🟡     |
| FAQ        | `src/components/landing/faq.tsx`         | 🟡     |
| Footer     | `src/components/landing/footer.tsx`      | 🟡     |

## Cross-Cutting Story Requirements

- Every story imports tokens from `src/styles.css` — never hex literals.
- Stories include a dark-mode-only frame; light mode is out of scope until ADR-XXXX revises.
- Accessibility addon must show **zero serious or critical** axe violations.
- Motion-reduced variant verified for any component with > 200 ms animation.
