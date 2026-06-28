# Phase 4A — The Vault Interior

The dashboard is the moment the user crosses the threshold of the vault they just unlocked. Everything we built in auth — the Vault Atmosphere, the Signature Glyph, the Adaptive Shield, the calm AI voice — now becomes the room they live in. This document defines the experience, not the code.

---

## 1. Product Posture

Four feelings, ranked, that every pixel must reinforce:

1. **Wealth** — generous whitespace, tabular numerals, metal-grade surfaces
2. **Intelligence** — AI is ambient, not announced
3. **Security** — visible everywhere, alarming nowhere
4. **Confidence** — one clear next action, never six competing ones

The dashboard answers six questions inside the first viewport, in this order of glance:

```text
1. How much do I have?      → Balance Hero (top-left, 60% width)
2. What changed today?      → Delta chip on the hero + sparkline
3. Am I safe?               → Aegis Ring (top-right corner of hero row)
4. Does AI know me?         → Confidence value inside the ring
5. What needs me?           → Attention Lane (a single horizontal strip)
6. What can I do next?      → Quick Actions dock (below the fold edge)
```

---

## 2. Spatial System

```text
Max canvas        1440 px
Rail collapsed    72 px      Rail expanded    260 px
Command Bar       64 px      Content gutter   32 px
Grid              12 cols × 8px baseline, 24px gap, 32px row rhythm
Card radius       20 px outer, 14 px inner, 28 px hero
Elevation tiers   E0 flat · E1 glass · E2 lifted · E3 floating-modal
```

Three surface tones layered over the Vault Atmosphere:

- **Obsidian** `#0B1120` — page floor
- **Slate Glass** translucent `rgba(255,255,255,0.04)` + 24px backdrop blur — cards
- **Mercury** `rgba(255,255,255,0.08)` with 1px inner light stroke — hero & rail

Accent ladder stays the auth palette: Cyan (primary AI), Iris (wealth), Mint (positive), Amber (attention), Coral (rare — only true risk).

---

## 3. Macro Layout

```text
┌──┬────────────────────────────────────────────────────────┐
│  │  Command Bar  · search · ⌘K · Aegis pill · profile     │
│R ├────────────────────────────────────────────────────────┤
│a │                                                        │
│i │  Welcome Header — "Good morning, Amal"                 │
│l │  Six-stat strip (Available · Δ Today · In · Out · …)   │
│  │                                                        │
│  │  ┌──────────────────────────────┐ ┌──────────────────┐ │
│  │  │  BALANCE HERO  (8 cols)      │ │ AEGIS RING (4)   │ │
│  │  │  account switcher · graph    │ │ confidence · AI  │ │
│  │  └──────────────────────────────┘ └──────────────────┘ │
│  │                                                        │
│  │  ATTENTION LANE — 0–3 chips, dismissable               │
│  │                                                        │
│  │  ┌─────────┬─────────┬─────────┬─────────┐             │
│  │  │ Quick Actions (4 up, scroll on mobile)│             │
│  │  └─────────┴─────────┴─────────┴─────────┘             │
│  │                                                        │
│  │  Widget Mosaic  (Insights · Spend · Cards · Goals)     │
│  │                                                        │
│  │  Transaction Feed   (8)    │  Security Overview  (4)   │
│  │                                                        │
│  │  Footer: Aegis whisper · regulatory line               │
└──┴────────────────────────────────────────────────────────┘
```

---

## 4. Navigation Rail

A floating glass capsule, **24px inset from the viewport edges, top to bottom**. Never touches a screen edge — it hovers like the Signature Card did during enrollment.

**Structure**

- **Crown** — Adaptive Shield + wordmark; click collapses/expands
- **Primary** — Dashboard, Accounts, Cards, Payments, Transfers, Transactions, Investments, Analytics
- **Quiet divider** — 1px hairline at 8% opacity, 24px breathing room
- **Guard** — Security Center, Authentication Center, Devices, Notifications
- **Quiet divider**
- **Personal** — Profile, Settings, Help
- **Role-gated** — Admin appears only when `role:admin`, with a tiny Iris keyhole icon
- **Foot** — Workspace switcher · Theme · Aegis status dot · Sign out

**Item anatomy** (expanded)

```text
[●icon] Label …………………………… ⌘1   [badge]
        ↑hover: 200ms glow halo, label slides 2px right
        active: 3px vertical Iris bar at left edge + soft inner gradient
```

**Collapsed (72px)** — icon-only with a 4px right-edge active indicator. Hover any item to reveal a floating tooltip-card that shows label + shortcut + unread count.

**Expansion animation** — width tween 280ms `cubic-bezier(0.2, 0.8, 0.2, 1)`; labels fade-in on a 120ms delay with a 4px translateX. No layout jank — the content area never reflows because the rail is overlaid, not in flow.

**Aegis status dot** at the foot pulses one slow breath every 4s when confidence ≥ 0.9, holds steady amber if a verification is in progress, never red.

---

## 5. Command Bar

64px high, full content width, sticky at top, glass with a 1px lower hairline that becomes visible only after 12px of scroll.

```text
[≡]  [⌕ Search anything…  ⌘K]   ·   [Aegis 99.2% ▾]  [⌥]  [⌘N]  [🔔3]  [⏱ 14:32]  [Avatar ▾]
```

- **Global search** — instant fuzzy across Transactions, Beneficiaries, Accounts, Settings, Help, Security Events, AI Reports, Recent Pages. Each result is a row with icon + title + secondary line + scope chip. Keyboard-first: ↑↓ navigate, ⏎ open, ⌘⏎ open in new pane.
- **⌘K Command Palette** — full-screen overlay, `scale(0.98)→1` + fade, 180ms. Two zones: Actions (top) and Navigate (bottom). Recent commands persist per user.
- **Aegis pill** — confidence % with a 12px micro-ring. Click opens the Aegis popover (see §8).
- **Quick Transfer** (⌘N) — opens a 480px right drawer, never a modal.
- **Notification bell** — opens the Notification Drawer.
- **Time** is local to the session device, in Space Grotesk tabular.
- **Avatar** — Signature Glyph as the avatar shape, falling back to monogram. Opens profile menu.

---

## 6. Welcome Header

```text
Good morning, Amal.                          Sun · 28 Jun · Lisbon
Session stable · recognized in 12 ms

Available           Today              In (Mo)      Out (Mo)    Savings    Investments
€ 248,902.14        + € 1,420.40 ↑     € 14,230     € 9,184     € 62,400   € 2.48 M
                    +0.57%             ───────      ─────       ─────      ────────
```

- Greeting cycles **Good morning / afternoon / evening / Working late** based on local time.
- Six-stat strip is a single horizontal row on desktop, 2×3 on tablet, vertical stack on mobile. Numbers animate from `0` to value with an easing curve once on mount (250ms, staggered 40ms). Subsequent value changes use a 600ms odometer roll, never a re-mount.
- Each stat has a 24px sparkline below it. Hovering reveals a tooltip with the 30-day high/low.

---

## 7. Balance Hero

The centerpiece. Treat it like the Signature Card from enrollment — same metal, same lighting, same edge bevel — but laid flat and made interactive.

**Anatomy**

```text
┌────────────────────────────────────────────────────────────┐
│  PRIMARY  ·  ▾ switch account                  EUR ▾   👁  │
│                                                            │
│  € 248,902.14                                              │
│  Available · Pending € 1,820.00                            │
│                                                            │
│   ╱╲    ╱╲      ╱╲╱╲                                       │
│  ╱  ╲__╱  ╲____╱    ╲___    (30d area, Iris→Cyan gradient) │
│                                                            │
│  Deposit · Transfer · Pay · Request · Statement · Details  │
└────────────────────────────────────────────────────────────┘
```

- **Account switcher** is a popover stack of mini-cards (Primary · Savings · Investment · Credit). The hero crossfades + the metal tone shifts subtly to indicate the new context (silver → champagne for Savings, obsidian for Credit).
- **Currency selector** is a small inline dropdown with the ISO code; FX rate appears as a 10px caption when a non-base currency is chosen.
- **Hide balance (👁)** replaces digits with `••• ••• ,••` using the same monospace width. State persists per device.
- **Area graph** is interactive — hover shows a vertical guide and a glass tooltip pinned above the cursor with date + value + delta.
- **Quick Actions row** lives inside the hero, secondary buttons (ghost on glass). The primary `Transfer` keeps the gradient fill.

---

## 8. The Aegis Widget (signature element)

The dashboard's emotional anchor. Always visible, always calm.

```text
┌────────────────────────┐
│        ◯ 99.2          │   ← confidence ring, Cyan
│        Recognized       │
│                         │
│  Trust          High    │
│  Session        02:14   │
│  Device         Trusted │
│  Behavior       Stable  │
│  Risk           0.04    │
│                         │
│  "Everything looks      │
│   normal." — Aegis      │
└────────────────────────┘
```

- **Confidence ring** is a 160px SVG ring with a soft inner glow. Stroke draws once on mount (900ms), then breathes (±1% scale) every 6s.
- **Color logic** — Cyan ≥ 90, Iris 75–89, Amber 50–74, Coral < 50. Coral is reserved; the demo will never show it.
- **Behavior trend** appears on hover as a 7-day micro-sparkline beneath the ring.
- **Aegis whisper** rotates through a curated set of one-liners every 30s with a 400ms crossfade. Examples: "Session stable.", "You're recognized.", "Behavior matches your signature.", "Encryption refreshed 4 min ago."
- Click the ring → opens the **Security Center deep-view** (Phase 4B), not a modal.

---

## 9. Attention Lane

A single horizontal strip beneath the hero row. **At most three chips**, dismissable, in priority order: Security → Money → Admin.

```text
[ 🛡 New device verified — Lisbon, MacBook  · Acknowledge ]
[ 📅 Rent due in 2 days — €1,420            · Pay now    ]
```

If empty, the lane shows a single faded Aegis line: *"Nothing needs you right now."* Never collapses to zero height — keeps rhythm.

---

## 10. Quick Actions Dock

Four cards on desktop, horizontally scrollable on mobile, each 200×120.

```text
Transfer · Pay Bills · Scan QR · Add Beneficiary
View Statements · Freeze Card · Exchange · Security
```

Each card: small line illustration top-left, label bottom-left, keyboard shortcut bottom-right in mono. On hover the illustration animates (e.g. Freeze Card grows a tiny frost vignette; Scan QR pulses a reticle). Pressing shows a 60ms inset shadow.

---

## 11. Widget Mosaic

Adaptive cards, all share the same card constitution but vary in span (4, 6, 8, 12 cols). Order on first load:

1. **Financial Insights** (8) — three AI insight cards in a horizontal carousel, each with a tiny chart inline
2. **Spending Analytics** (4) — category donut + legend
3. **Cards** (4) — stacked Signature Cards (Primary, Credit), tap to flip
4. **Cash Flow** (8) — 30-day in/out area chart, dual line
5. **Savings Goal** (4) — ring + amount + ETA
6. **Investment Portfolio** (4) — mini allocation bar + day Δ
7. **Currency Exchange** (4) — three pairs, live ticks
8. **Favorite Beneficiaries** (12) — horizontal avatar rail, tap to start transfer

All widgets are **resizable-ready** but not draggable in 4A. Each carries a 3-dot menu with: Hide, Resize, Refresh, Open full view.

---

## 12. Transaction Feed

Revolut-grade, timeline-grouped.

```text
TODAY · 28 JUN
🍔  Wolt                           Food · 13:02     − € 18.40
🅿︎  EasyPark                      Transport · 10:11 − € 4.50
↘  Salary · Banco Atlântico      Income · 09:00    + € 6,400.00

YESTERDAY
…
```

- **Row anatomy**: 40px merchant glyph (auto-generated from merchant initials on a tinted disc when no logo exists) · merchant name (Sora 15) · category chip · timestamp · amount (Space Grotesk tabular, sign-colored).
- **Expand row** — chevron rotates 90°, row grows to reveal: full merchant address, payment method (with card last-4), category editor, attach receipt, dispute, split, notes. 220ms ease.
- **Filters bar** above the feed: Search · Date · Category · Account · Amount range · Status. Filters chip-style, removable.
- **Grouping** by day, with sticky day-headers when scrolling within the feed container.
- **Export** dropdown: CSV, PDF statement, JSON.

---

## 13. Spending Analytics Section

Two-column: 60/40.

- **Left** — stacked area chart of last 6 months income vs expense, with savings rate as a thin line overlay. Hover snaps to month with a glass tooltip.
- **Right** — category donut. Legend below with category, %, and absolute. Click a slice to filter the Transaction Feed.

Charts are drawn once with a 600ms staggered path animation. Reduced-motion users see them appear instantly with a fade.

---

## 14. Security Overview Section

Seven cards arranged 4+3.

```text
Auth Confidence · Trusted Device · Recent Verification · Behavior Stability
Session Integrity · AI Monitoring · Risk Assessment
```

Each card: status icon (◯ pass · ◐ in progress · △ attention), one-line description, micro-metric, primary action ("View", "Re-verify", "Manage"). No exclamation marks, no red defaults. The whole section is one tap away from the Security Center.

---

## 15. Session Widget & Notification Drawer

**Session Widget** lives in the Aegis popover (opens from the Command Bar pill):

```text
Current Session · started 14:18, Lisbon · Safari 17 · macOS · MacBook Pro
Behavior confidence  99.2%
Session score        A+
[ Sign out other devices ]   [ View history ]
```

**Notification Drawer** — right-hand 420px overlay, glass, segmented tabs (All · Banking · Security · Transfers · Investments · AI · System). Notifications grouped by day. Each item: 32px category glyph, title, secondary line, time, swipe-left to archive. Bulk actions: Mark all read, Filter, Search, Archive. Empty tab shows the empty-state pattern (§16).

---

## 16. Empty & Loading States

**Empty pattern** — center-aligned: 96px illustration (line-art in the Vault Atmosphere palette) · headline (Sora 18) · one-line explanation (Inter 14, muted) · single primary action.

Catalogue:

```text
No Transactions     — "Your ledger is quiet."          [ Make a transfer ]
No Investments      — "Begin your portfolio."          [ Explore funds ]
No Notifications    — "All clear. Aegis is watching."  [ Notification settings ]
No Beneficiaries    — "Add someone to pay."            [ Add beneficiary ]
No Security Events  — "Nothing to report."             [ View security log ]
No Devices          — "No other devices signed in."    [ Manage devices ]
No Insights         — "Insights appear after a week."  [ Learn more ]
```

**Loading vocabulary** — no spinners outside the Aperture brand mark.

- **Skeletons** — card-shaped, with a slow 1.6s shimmer running left-to-right at 12% opacity.
- **Chart placeholder** — faint grid + a dashed baseline pulse.
- **Number placeholder** — three monospace blocks `▮▮▮ ▮▮▮.▮▮` shimmering.
- **Aegis** — the brand Aperture spinner, used sparingly for cross-page transitions.
- **AI Mesh** — a 2×3 dotted constellation that breathes; used only for AI insight cards while generating.

---

## 17. Motion Language (continuity with auth)

| Moment              | Curve                        | Duration |
| ------------------- | ---------------------------- | -------- |
| Page entrance       | `cubic-bezier(.2,.8,.2,1)`   | 480ms, stagger 60ms |
| Balance odometer    | `cubic-bezier(.4,0,.2,1)`    | 600ms |
| Card stagger        | same                         | 80ms apart |
| Chart draw          | `cubic-bezier(.6,.05,.2,1)`  | 700ms |
| Transaction reveal  | ease-out                     | 220ms |
| Sidebar expand      | `cubic-bezier(.2,.8,.2,1)`   | 280ms |
| Widget hover lift   | ease-out                     | 160ms, +2px y, +shadow |
| Button press        | ease-in                      | 60ms, scale .98 |
| Search / drawer in  | spring-ish ease              | 240ms |
| Aegis ring breathe  | sine                         | 6s loop, ±1% |

All motion respects `prefers-reduced-motion`: opacity-only, no transforms, no loops longer than one cycle.

---

## 18. Vault Continuity

Reused verbatim from Phase 3:

- Vault Atmosphere background layer (aurora + grain + vignette)
- Signature Glyph as avatar shape and decorative accents in widget headers
- Adaptive Shield as the Aegis ring center mark
- Glass language, lighting, type ramp (Sora / Inter / Space Grotesk)
- Aegis voice — calm, brief, present tense, ≤ 6 words preferred

Result: zero perceptual jump between the success screen and the dashboard. The Signature Card simply becomes the Balance Hero.

---

## 19. AI Presence Rules

- AI never opens dialogs.
- AI never uses red.
- AI never uses exclamation marks.
- AI speaks in **observations**, not commands. ("Session stable." not "Stay alert.")
- AI surfaces in three places only: Aegis ring whisper, Insight cards, Attention Lane.
- Insights are dismissable; once dismissed they don't return for 24h.

---

## 20. Accessibility

- AAA contrast for all body text on glass (≥ 7:1 against Obsidian fallback).
- Every interactive element has a visible focus ring (2px Cyan, 4px offset, rounded to surface).
- Full keyboard map: `⌘K` palette, `⌘1–9` rail jump, `⌘N` quick transfer, `⌘/` shortcut cheat-sheet, `g s` go-to-security, `g t` go-to-transactions, `?` help.
- Charts have a "View as table" toggle in the 3-dot menu.
- Skeletons announce `aria-busy`; live regions announce balance changes politely.
- Touch targets ≥ 44×44 on tablet/mobile.
- Reduced-motion mode disables all loops and replaces transforms with opacity.

---

## 21. Responsive Choreography

| Breakpoint | Rail              | Hero               | Mosaic                | Feed            |
| ---------- | ----------------- | ------------------ | --------------------- | --------------- |
| ≥ 1280     | Floating, expanded option | Hero 8 + Aegis 4 | 12-col mosaic      | 8 + 4 side      |
| 1024–1279  | Collapsed (72)    | Hero 8 + Aegis 4   | 8-col mosaic         | 8 stacked       |
| 768–1023   | Bottom drawer trigger; opens overlay | Hero full, Aegis collapses into hero header strip | 2-col mosaic | Single column |
| < 768      | Bottom tab bar (5 essentials) + ⋯ overflow | Stacked, Aegis pill in command bar | 1-col | Single column, sticky filters |

Mobile is **designed**, not scaled — the Quick Actions become a horizontal snap-rail, the Transaction Feed becomes the dominant surface, and the Aegis ring shrinks to a 28px pill in the command bar that taps open the full Security sheet.

---

## 22. Component Inventory (reusable kit)

Foundational primitives Phase 4B will build against. Names use the established conventions.

```text
Layout            : VaultRail · CommandBar · WelcomeHeader · StatStrip
                    AttentionLane · ActionDock · WidgetCard · MosaicGrid

Hero & Account    : BalanceHero · AccountSwitcher · CurrencyChip
                    HideBalanceToggle · QuickActionRow

Security          : AegisRing · AegisPopover · SecurityCard
                    SessionPanel · DeviceRow · TrustBadge

Data              : AreaChart · DonutChart · Sparkline · Odometer
                    TabularNumber · DeltaChip · CategoryChip

Feed              : TransactionRow (extends Phase 3) · TransactionGroupHeader
                    FilterBar · ExpandPanel · ExportMenu

Notification      : NotificationDrawer · NotificationItem · SegmentedTabs

Empty & Load      : EmptyState · CardSkeleton · ChartSkeleton
                    NumberSkeleton · ApertureSpinner (reused) · AiMesh

Overlay           : CommandPalette · QuickTransferDrawer · ContextMenu
                    Popover · Tooltip

AI                : InsightCard · AegisWhisper · ConfidenceMeter
```

---

## 23. First-Load Choreography (the cinematic 1.2 seconds)

```text
0 ms     Vault Atmosphere fades from auth-success state (no cut)
80 ms    Rail slides in from left (overlay, doesn't push)
160 ms   Command Bar fades + 4px down→0
240 ms   Welcome greeting types in (character stagger, 12ms)
320 ms   Stat strip odometers roll
400 ms   Balance Hero metal panel rises 8px + fades; area chart draws
600 ms   Aegis ring strokes around to 99.2%
720 ms   Widget mosaic staggers in (80ms apart)
1100 ms  Transaction feed reveals
1200 ms  Aegis whisper appears: "Welcome back, Amal. Session stable."
```

After this, the dashboard is calm. No more entrance motion until the user acts.

---

## 24. Out of Scope for 4A (handed to 4B+)

- Drag-to-rearrange widgets
- Deep Security Center page
- Investments sub-app
- Notification settings page
- Admin workspace
- Real-time websocket plumbing

---

## 25. What "done" looks like

A user who finishes enrollment lands here and, without reading a single label, knows: their balance, that it grew today, that Aegis recognizes them, and what one action to take next. They feel they are inside the vault, not on a webpage about a vault.

When you're ready, approve this and I'll start building 4A — beginning with the VaultRail, CommandBar, WelcomeHeader, BalanceHero, and AegisWidget as the foundational stack, then layering the mosaic and feed.