# Phase 4B — The Banking Module

The dashboard is the vault's atrium. Phase 4B is everything behind the doors: the accounts, the cards, the rails along which money actually moves. Every workflow is engineered to **generate natural behavioral signal** — typing rhythm in the amount field, mouse curvature when selecting a beneficiary, dwell time on review screens — so Aegis can verify the user continuously without ever asking them to prove anything.

You will not see a single CAPTCHA, OTP, or "are you sure?" modal in this module. The AI is the friction.

---

## 1. Module Posture

Five feelings, ranked:

1. **Effortless** — any task in ≤ 3 clicks, ≤ 12 keystrokes
2. **Premium** — metal, glass, tabular numerals, generous rhythm
3. **Confident** — Aegis is present on every page as a 12px ring; never a banner
4. **Continuous** — same Vault Atmosphere, same Signature Glyph, same motion
5. **Intelligent** — insights appear in flow, never in popups

The promise: **the user transfers €10,000 and never once feels "verified."**

---

## 2. Information Architecture

```text
/app                    Dashboard (4A)
/app/accounts           Account command center
/app/accounts/$id       Account workspace (Overview · Transactions · Analytics · Statements · Scheduled · Security · Documents)
/app/cards              Card gallery + controls
/app/cards/$id          Card detail (flip, limits, travel mode, history)
/app/transactions       Global ledger
/app/transactions/$id   Transaction detail
/app/transfer           Transfer flow (multi-step)
/app/payments           Recurring · bills · subscriptions (calendar + timeline)
/app/beneficiaries      Directory
/app/statements         Statement vault
/app/investments        Portfolio
/app/loans              Loan overview + repayment schedule
/app/exchange           Currency converter
/app/savings            Goals
/app/budgets            Budget envelopes
/app/insights           AI financial insights stream
/app/activity           Unified activity timeline
```

VaultRail (4A) gets the new entries with the same anatomy: icon, label, `⌘`-shortcut, optional unread dot. Sections group as **Money** (Accounts, Cards, Transactions, Transfer, Payments, Beneficiaries, Statements), **Grow** (Investments, Savings, Budgets, Loans, Exchange), **Intelligence** (Insights, Activity).

---

## 3. Reused Constitution

Nothing is re-invented. Phase 4B composes on top of the 4A kit:

```text
Surfaces      Obsidian floor · Slate Glass cards · Mercury hero (4A §2)
Radii         20 outer · 14 inner · 28 hero · 999 pill
Type          Sora (display) · Inter (body) · Space Grotesk (numeric)
Motion        Page entrance 480/60 · odometer 600 · chart draw 700 (4A §17)
AI voice      ≤ 6 words, observation not command, never red, never !
Brand         VaultAtmosphere · SignatureGlyph · AdaptiveShield · Aegis ring
```

Any new pattern below must reuse one of these or it doesn't ship.

---

## 4. Accounts — `/app/accounts`

A command center for every pot of money.

**Layout** — single column of horizontal account groups (Current · Savings · Investment · Business · Fixed Deposit · Credit). Each group has a tiny pill header with count and total; below, a horizontal-snap rail of **Account Cards** (320×200).

**Account Card anatomy**

```text
┌──────────────────────────────────────────┐
│  Primary · EUR              IBAN ••3491  │
│                                          │
│  € 248,902.14                  ↑ 0.57%   │
│  ─── 30-day sparkline ───                │
│                                          │
│  ◯ Active · refreshed 14:32              │
│  Transfer · Statement · ⋯                │
└──────────────────────────────────────────┘
```

- Card finish shifts per type: Primary obsidian, Savings champagne, Investment iris, Credit graphite, Business platinum, Fixed Deposit deep emerald.
- Today's Δ as a chip; sparkline auto-scales.
- Long-press / right-click → context menu: View · Transfer · Statement · Freeze · Rename · Copy IBAN · Set primary.
- Drag horizontally to reorder (persists per user — generates mouse curvature signal).

**Empty group** → a single dashed-edge "Open a Savings account" tile with one CTA.

---

## 5. Account Workspace — `/app/accounts/$id`

Tabbed workspace, hero on top, content below.

**Hero strip (sticky)**

```text
[Primary ▾]   € 248,902.14   ↑ 0.57% today   ·   IBAN PT50 …  📋
              Available · Pending €1,820                    [Transfer] [⋯]
```

The `▾` is the AccountSwitcher from 4A — switching mutates the URL `$id` without remount.

**Tabs** (single row, underline-on-active, ⌘1–7)

- **Overview** — cash-flow chart (90d), 4 KPI tiles (In, Out, Net, Savings rate), top categories, upcoming payments mini-list, two AI insight cards.
- **Transactions** — Transaction Feed (§8) scoped to this account.
- **Analytics** — stacked monthly area, category donut, savings-rate line, income-vs-expense compare, weekday heatmap.
- **Statements** — Statement Vault (§13) scoped.
- **Scheduled** — list of standing orders, direct debits, future transfers; calendar peek button.
- **Security** — account-scoped Aegis: last 5 verification events, trusted devices that touched this account, freeze-account control, transaction risk timeline.
- **Documents** — KYC, account opening, tax statements, certificates. Card grid with type-icon + date + download.

---

## 6. Cards — `/app/cards`

A gallery, not a list.

**Carousel** — full-bleed horizontal snap, one card centered, neighbors at 70% scale + 40% opacity. Cards rendered with the 4A `CardObject` primitive (3D metal, signature etching). Subtle parallax tilt follows pointer (≤ 6°). Mobile = swipe.

**Center card** shows: type (Primary / Virtual / Credit / Travel), masked PAN (•••• 4912), holder, expiry, network mark, current status pill (Active / Frozen / Travel mode).

Below the carousel, a **Control Deck** for the selected card:

```text
┌─ Controls ──────────────────┐ ┌─ Limits ────────────┐ ┌─ Insights ─┐
│ Freeze        [toggle]      │ │ Daily   € 2,000 ▮▮▯ │ │ Spent this │
│ Contactless   [toggle]      │ │ Monthly € 18,000 ▮▯ │ │ month      │
│ Online        [toggle]      │ │ ATM     € 400  ▮▯▯  │ │ € 1,284    │
│ International [toggle]      │ │ Edit limits         │ │ ───sparkline│
│ Travel mode   [toggle ▸]    │ └─────────────────────┘ └─────────────┘
│ View PIN  · Replace · Term. │
└─────────────────────────────┘
```

**Card flip** — `R` or tap the card → 600ms 3D Y-axis flip exposes back with CVV (revealed on press-and-hold, auto-hides after 8s; press-and-hold itself is excellent behavioral signal).

**Freeze** → card frosts over (CSS filter blur + cyan tint sweep), status pill morphs to "Frozen", control deck dims appropriate toggles. No modal, no confirmation — undoable for 30s via a glass toast.

**Virtual card creation** — opens a 480px right drawer with a live-rendering card preview; user picks finish, label, and limits — the card on screen mints in real time as they type. Then a single primary `Mint card` button.

**Transaction history** sits beneath, filtered to this card.

---

## 7. Transfer Money — `/app/transfer`

The signature flow. Engineered to feel like one continuous motion across four screens, each generating distinct behavioral telemetry.

```text
1. Source   →   2. Recipient   →   3. Amount   →   4. Review   →   ✓ Success
```

A single horizontal progress hairline at the top (4 segments), Aegis pill in the top-right always visible.

### 7.1 Source — accounts as a horizontal rail
The user's account cards from §4 in a snap-rail; tap to select, the chosen card rises 12px and gains a 2px Cyan stroke. Auto-advance after 400ms. (Mouse-curve signal: how they hover before committing.)

### 7.2 Recipient
Two-column inside a single screen:

- **Left** — search-first field (`/` focuses). Real-time filtered list of beneficiaries with avatar, nickname, bank, last-sent, favorite star. Categories as chips above the list (Family · Business · Utilities · Savings · Recent).
- **Right** — empty state morphs into a recipient preview as soon as one is picked: avatar, full name, bank, IBAN, last 3 transfers to them. Inline `Edit` and `Add new` actions.

Keyboard-first: ↑↓ navigate, ⏎ pick, `+` opens new-beneficiary drawer. (Keystroke cadence signal.)

### 7.3 Amount
The hero of the flow. Massive 96pt Space Grotesk numeric input, currency selector left, live FX panel right.

```text
            EUR  €  1,250.00          ↔  USD $1,347.62
                                          rate 1.0781 · ~0.4% spread
            Fee  Free  ·  Arrives  Today
            ────────────────────────────────
            Purpose [Rent ▾]   Note [optional]
            Send  Now  ·  Schedule  ▾   Repeat  ▾
```

- Digits roll in with the 4A odometer curve as the user types.
- Currency chip click → glass dropdown of currencies with flag glyphs and current rate.
- FX panel updates in real time; spread shown honestly.
- Arrival estimate is a chip ("Today · 14:32 local") that updates with route changes.
- Below: a quiet row of suggested amounts based on history (e.g. last rent paid was €1,250).
- Schedule → 7-day mini-calendar popover. Repeat → frequency stepper.

(Behavioral signal: typing rhythm on numerals, hesitation, correction count.)

### 7.4 Review
A single glass "transfer ticket" card centered on screen:

```text
        From   Primary · ••3491
          To   Marta Silva · BPI · ••8821
      Amount   € 1,250.00
       Today   Free · Arrives 14:32
     Purpose   Rent
        Note   June

  [ Edit ]                          [ Hold to send ]
```

- The primary CTA is a **press-and-hold-to-send** button (1.1s). The hold time is real and is itself behavioral signal; visually a Cyan progress ring sweeps around the button. Releasing early aborts gracefully.
- Aegis pill in the corner shows confidence ticking up as the screen is dwelled on, ending at "Verified" before the user even completes the hold.
- The reassuring line beneath the button: *"Your session remains secure."* — rotates among Aegis whispers.

### 7.5 Success
- Vault Atmosphere brightens 6% for 800ms.
- A Signature-Glyph-shaped checkmark draws (700ms).
- "Sent. Marta will receive €1,250.00 by 14:32."
- Three after-actions: `Send another` · `View transaction` · `Done`.
- A receipt card slides in from the bottom-right for 4s (dismissable), with `Save PDF` and `Share` mini-actions.

**Mobile** — each step is a full screen; the progress hairline becomes 4 dots. Amount uses a custom numeric pad (44px keys, haptic on tap).

---

## 8. Transactions — `/app/transactions`

Global ledger. Same TransactionRow primitive as 4A's feed, scaled up.

**Top bar** (sticky, glass)

```text
[⌕ search…  /]   [Date ▾]  [Category ▾]  [Account ▾]  [Amount ▾]  [Status ▾]  ·  [Export ▾]
```

Filters render as removable chips just under the bar. `Saved views` dropdown on the right preserves combinations.

**Body** — day-grouped timeline with sticky day-headers, 56px rows. Virtualized for 10k+ rows. Hovering a row reveals a subtle 1px Iris underline; arrow keys move selection; ⏎ opens detail.

**Expand row** (chevron rotates 90°, row grows to 220px):

```text
 🍔  Wolt                          Food · 13:02     − € 18.40
 ────────────────────────────────────────────────────────────
 Merchant address · payment method (Visa ••4912)
 Category editor  ·  Tags  ·  Attach receipt  ·  Split  ·  Dispute
 Notes …………………………………………
 Aegis: verified at 13:02 · confidence 99.4%
```

**Bulk select** with `Shift+click` and `⌘A`. Bulk actions appear as a floating glass bar bottom-center: Tag · Categorize · Export · Dispute.

**Export menu**: CSV · PDF statement · JSON · QIF · OFX.

---

## 9. Transaction Detail — `/app/transactions/$id`

A right-side **deep panel** (520px) overlay rather than a route change — keeps the user in context. Hard-link `?tx=$id` shareable.

```text
 🍔  Wolt Delivery                       − € 18.40
     Lisbon, PT  ·  Tue 23 Jun  13:02

 ┌─ Map preview (160px, dark mapbox-style) ──────┐
 └────────────────────────────────────────────────┘

 Method      Visa ••4912 (Primary)
 Reference   WLT-9F3K-AAB2
 Category    Food  [Edit]
 Tags        rent-month · with-marta  [+]
 Receipt     [Attach receipt]
 Tax         VAT €1.41 (estimate)

 Aegis check    ✓ verified at 13:02
 Confidence     99.4%
 Risk score     0.02
 Device         MacBook Pro · Lisbon

 Related       3 transactions with Wolt this month
 Merchant      View Wolt insights →

 [ Export PDF ]  [ Dispute ]  [ Split ]
```

Aegis block is descriptive, never alarming. Dispute opens a 3-step inline form (Reason → Evidence → Submit), not a modal.

---

## 10. Beneficiaries — `/app/beneficiaries`

A modern Rolodex.

**Layout** — left sidebar with alphabetical index (A · B · C …) and category chips; main canvas as a 3-column card grid.

**Beneficiary card**

```text
┌──────────────────────────────┐
│  ◉ MS    Marta Silva    ★    │
│          BPI · ••8821        │
│  Last sent  €1,250 · 23 Jun  │
│  [ Transfer ]  Edit  ⋯       │
└──────────────────────────────┘
```

- Avatar = initials on a deterministic tinted disc, or uploaded photo.
- Star toggles favorite; favorites pin to the top.
- Categories: Family · Business · Utilities · Savings · Recent · Hidden.
- Search is instant fuzzy (name, IBAN, bank, tag).
- `+ Add beneficiary` opens a right drawer with IBAN auto-validation that reveals the bank name as soon as 8 valid digits are typed (delight moment + behavioral signal).

---

## 11. Payments — `/app/payments`

Two-view toggle in the page header: **Timeline** · **Calendar**.

**Timeline** — chronological list of upcoming and recurring payments, grouped This week / Next 30 days / Later. Each row: merchant glyph · name · category · next date · amount · status chip (Auto / Manual / Paused). Row actions: Pay now · Pause · Edit · Cancel.

**Calendar** — monthly grid with payment dots colored by category; click a day to reveal a popover list. Drag-to-reschedule a payment within the calendar (mouse curvature signal).

**Sidebar** — Reminder settings, total committed this month, ratio of fixed vs variable, an AI insight card ("Your subscriptions grew €12 this month — Netflix increased.").

---

## 12. Statements — `/app/statements`

A statement vault.

**Left** — year accordion (2026 ▸ 2025 ▸ 2024). Inside each year, months as 12 glass tiles in a 4×3 grid; each tile shows month name + size + page count.

**Right** — when a month is selected, a PDF-style preview pane (rendered as styled HTML, not an iframe) with the bank's letterhead, account summary, transaction list. Toolbar above: Download · Print · Share · Bookmark · Highlight · Export CSV.

Search bar searches across all statement contents. Bookmarks and highlights persist per user.

---

## 13. Investments — `/app/investments`

**Hero** — portfolio value with day Δ and lifetime Δ, plus a 1D/1W/1M/3M/1Y/ALL chart toggle. Beneath: allocation as a horizontal bar (Stocks · ETFs · Funds · Crypto · Cash) with hover legend.

**Tabs** — Holdings · Watchlist · Orders · Insights · Research.

**Holdings table** — instrument · units · avg cost · price · day Δ · value · weight · sparkline. Click a row → instrument detail drawer with chart, news, fundamentals, transaction history with this instrument, and a `Buy / Sell` ticket.

**Risk score** — a small ring widget in the hero corner using the Aegis ring primitive but in Iris, with a calm interpretation ("Balanced · 4 / 10").

**AI Recommendations** — InsightCard carousel: rebalancing nudges, dividend opportunities, concentration warnings. Always observational ("Tech is 42% of your portfolio.").

---

## 14. Savings — `/app/savings`

**Goal card grid**. Each card:

```text
┌──────────────────────────────┐
│  ✈  Lisbon → Tokyo            │
│                               │
│         ◯  62%                │
│      saved € 3,100 of € 5,000 │
│                               │
│  ETA   12 Sep 2026            │
│  Contribute €420 / mo         │
│  [ Add funds ]  History  ⋯    │
└──────────────────────────────┘
```

Progress ring uses the Aegis ring primitive in Mint. Card finish keyed to category (Travel iris, Emergency cyan, Car graphite, Education champagne, Home obsidian, Retirement platinum).

**Detail view** — contribution history bar chart, forecast curve, motivational AI line ("At this pace, you'll arrive 18 days early."), edit goal, pause, complete.

**Create goal** wizard — 3 steps (Purpose → Target & date → Funding source), all on one screen with auto-advance.

---

## 15. Budgets — `/app/budgets`

Envelope-style monthly budgets per category.

- Grid of category envelopes (Food, Transport, Subscriptions, …). Each shows budget, spent, remaining, with a horizontal progress bar that morphs from Mint → Iris → Amber as utilization climbs.
- Click an envelope → drawer with the contributing transactions, trend, and adjust-budget slider.
- Header KPIs: Total budget · Total spent · Pace (ahead/behind) · Days left.

---

## 16. Loans — `/app/loans`

**Loan card** per loan: principal, remaining, rate, next EMI date and amount, progress bar, status pill.

**Detail page** — amortization schedule (table + stacked area of interest vs principal over time), payment history, documents, EMI calculator, prepayment calculator (slider that re-runs the schedule live).

Calm AI line: "Prepay €2,000 today and you'll save €184 in interest."

---

## 17. Currency Exchange — `/app/exchange`

A two-pane interactive converter.

```text
You send                You receive
EUR ▾  €  1,000.00      USD ▾  $ 1,078.10
                        rate 1.0781 · spread 0.42% · arrives instantly

[ Chart 1D · 1W · 1M · 1Y ]   ── live tick line, Cyan ──

Favorites  EUR/USD  EUR/GBP  EUR/CHF  USD/JPY      [+]
Popular    EUR/USD  EUR/GBP  USD/JPY  EUR/BRL  GBP/INR
```

Swap button between fields with a 180° icon rotation. Live ticks animate the chart every 3s (paused under reduced-motion). AI suggestion chip: "EUR/USD is 1.2% above 30-day avg."

`Exchange now` button is the same press-and-hold mechanism as Transfer §7.4.

---

## 18. Financial Insights — `/app/insights`

A stream of AI insight cards, infinite scroll, with filters (All · Spending · Saving · Income · Subscriptions · Security · Investments).

Card patterns:

```text
↘  Dining down 18% this month
   You spent €212 vs €258 last month. Top reduction: weekday lunches.
   [ See transactions ]  Dismiss

📈 A subscription increased
   Netflix went from €13.99 to €17.99 on 4 Jun.
   [ Review ]  Keep  Cancel

🏦 Rent is due Wednesday
   €1,250 to Marta Silva, scheduled. No action needed.
   [ View ]

🛡  Your behavior is stable
   30 days, 0 anomalies. Aegis confidence average 98.7%.
```

Each card carries a small chart or pill, a one-line headline (Sora 16), a body sentence (Inter 14), and 0–2 actions. Dismissed insights vanish for 24h. Never red, never `!`.

---

## 19. Activity Timeline — `/app/activity`

A unified ledger of *everything* that happened on the account: transactions, transfers, payments, logins, security events, settings changes, card actions, AI verifications.

- Day-grouped, same row primitive as transactions, with type glyph.
- Filter chips: Banking · Security · Auth · Cards · Payments · Investments · Settings.
- Each row expandable to its native detail.
- Used as the canonical place to answer "what happened on my account on June 14?"

---

## 20. Banking-Wide Security Skin

Every banking page carries a **Security Strip** in the page footer (16px tall, glass):

```text
◯ Aegis 99.2  ·  Trusted device  ·  Session 02:14  ·  Behavior stable
```

Click anywhere on it → opens the Aegis popover from 4A. Strip turns Iris briefly (1s) every time Aegis re-verifies in the background — a subtle visual heartbeat that builds trust over weeks.

Page-level signals:
- **Transfer** screens show an additional 12px Aegis ring next to the primary CTA.
- **Card** controls that change risk posture (Freeze, International on, Limits up) trigger a 600ms Cyan halo and a one-line Aegis confirmation.
- **Statements / Documents** downloads log to the Activity timeline with a "verified by Aegis" badge.

No banking page ever surfaces a red color, an exclamation mark, or a modal warning unless real risk is detected (and the demo will never trigger it).

---

## 21. Universal Banking Search (⌘K extension)

The 4A Command Palette gains banking scopes. Results group:

```text
Accounts          Primary · Savings · Investment …
Beneficiaries     Marta Silva · Banco Atlântico …
Transactions      "wolt" → 14 results · "rent" → 6
Merchants         Wolt · EasyPark · Spotify
Cards             Visa Primary · Virtual Travel · Credit
Statements        June 2026 · May 2026 …
Payments          Rent · Netflix · Insurance
Actions           Transfer · Freeze card · Exchange · Add beneficiary
Pages             Investments · Savings · Loans …
```

Each result row: type glyph · title · secondary line · scope chip · keyboard shortcut. Fuzzy ranking. `⏎` opens, `⌘⏎` opens in a drawer, `⌥⏎` copies a deep link.

---

## 22. Behavioral Signal Map (by surface)

For Aegis tuning — every banking surface intentionally captures specific telemetry without UX cost.

```text
Transfer · Amount field        keystroke cadence, dwell, correction count
Transfer · Press-and-hold      hold duration variance
Transfer · Beneficiary list    mouse curvature, hover dwell, scroll bursts
Cards · Carousel               swipe velocity, tilt response, hover targeting
Cards · Reveal PIN             press-and-hold cadence
Accounts · Reorder drag        drag path curvature
Payments · Calendar drag       drag distance + drop precision
Investments · Buy ticket       same-as-transfer signals
Statements · Scroll            scroll burst pattern, dwell per page
Search ⌘K                      typing rhythm, backspace count
Logout / sensitive screens     idle time before action
```

None of this is exposed to the user. Aegis reports on the dashboard remain abstract: confidence, stability, recognized.

---

## 23. Component Inventory (additions to 4A kit)

```text
Accounts        AccountCard · AccountGroupRail · AccountSwitcherInline · IbanChip
Cards           CardCarousel · CardControlDeck · CardLimitRow · CardFlip · VirtualCardMintDrawer
Transfer        TransferStepper · SourceRail · RecipientPicker · AmountStage · FxPanel · ReviewTicket · PressHoldButton · SuccessGlyph · ReceiptToast
Tx              TxFilterBar · TxBulkBar · TxDetailDrawer · MerchantMap · DisputeForm
Benef           BeneficiaryCard · BeneficiaryDrawer · IbanField (auto-bank-detect)
Payments        PaymentRow · PaymentCalendar · ReminderSheet
Statements      StatementYearAccordion · StatementTile · StatementPreviewPane · HighlightLayer
Invest          PortfolioHero · AllocationBar · HoldingsTable · InstrumentDrawer · OrderTicket · RiskRing
Savings         GoalCard · GoalRing · GoalWizard · ForecastChart
Budgets         EnvelopeCard · UtilizationBar · BudgetSlider
Loans           LoanCard · AmortizationChart · PrepayCalculator
Exchange        FxConverter · FxChart · PairChip
Insights        InsightCardLarge · InsightStream · InsightFilterBar
Activity        ActivityRow · ActivityFilterChips
Cross-cutting   SecurityStrip · SavedViewsDropdown · ExportMenu · BulkActionBar
```

All inherit the 4A WidgetCard constitution and motion language.

---

## 24. Motion Additions

| Moment                     | Curve                          | Duration |
| -------------------------- | ------------------------------ | -------- |
| Card flip                  | `cubic-bezier(.4,.0,.2,1)`     | 600ms    |
| Card freeze (frost sweep)  | ease-out                       | 700ms    |
| Transfer step transition   | `cubic-bezier(.2,.8,.2,1)`     | 320ms, x-slide 24px |
| Press-and-hold ring sweep  | linear                         | 1100ms   |
| Success glyph draw         | `cubic-bezier(.6,.05,.2,1)`    | 700ms    |
| Receipt toast in           | spring-ish                     | 260ms    |
| IBAN bank reveal           | fade + 4px y                   | 200ms    |
| FX rate tick               | sine                           | 3s loop  |
| Calendar drag drop         | ease-out                       | 220ms    |
| Allocation bar settle      | `cubic-bezier(.2,.8,.2,1)`     | 700ms staggered |

Reduced-motion: card flip → crossfade; press-and-hold ring → static fill; FX ticks → static value.

---

## 25. Empty States

```text
No transactions          "Your ledger is quiet."          [ Make a transfer ]
No cards                 "Mint your first card."          [ Create virtual card ]
No beneficiaries         "Add someone to pay."            [ Add beneficiary ]
No statements            "Statements appear monthly."     [ Notify me ]
No loans                 "No loans on file."              [ Explore lending ]
No goals                 "Set your first goal."           [ Create goal ]
No investments           "Begin your portfolio."          [ Explore funds ]
No insights              "Insights appear after a week."  [ Learn more ]
No payments              "Nothing scheduled."             [ Schedule a payment ]
No documents             "Nothing here yet."              [ Upload document ]
```

Pattern from 4A §16: 96px line-art illustration in Vault palette, Sora 18 headline, Inter 14 sub, one primary action.

---

## 26. Responsive

| Breakpoint | Accounts          | Cards                  | Transfer                | Transactions     |
| ---------- | ----------------- | ---------------------- | ----------------------- | ---------------- |
| ≥ 1280     | 3-col rails       | Full carousel + deck   | 2-col where useful      | Full filters + bulk |
| 1024–1279  | 2-col rails       | Carousel narrows       | Same flow, 1-col Amount | Filters collapse to chips |
| 768–1023   | Single column     | Single card + deck below | Step-per-screen       | Drawer for detail |
| < 768      | Vertical stack    | Single card swipe      | Full-screen steps, native num pad, bottom-sheet recipient | Sticky filter sheet, swipe-row actions |

Mobile primitives: BottomSheet (recipient picker, filters, detail), SwipeRow (archive, favorite, dispute), thumb-zone primary CTAs anchored to the bottom-safe-area.

---

## 27. Accessibility

- All press-and-hold actions have a keyboard equivalent: `Space` to hold, `Enter` to commit short-press fallback after focus + confirm dialog only for keyboard users.
- All carousels expose `←/→` keys, focus order matches visual order.
- Charts have a `View as table` toggle in the 3-dot menu.
- Color is never the sole carrier of meaning — every status pill has text.
- Form fields have visible labels (no placeholder-as-label).
- Drag interactions have a keyboard alternative (reorder via menu).
- Reduced-motion swaps all transforms for opacity, disables loops > 1 cycle.

---

## 28. Build Order (when you greenlight 4B)

```text
1. Foundations  : VaultRail entries · SecurityStrip · ⌘K banking scopes
2. Accounts     : AccountCard · /app/accounts · /app/accounts/$id (Overview, Tx tab)
3. Cards        : CardCarousel · ControlDeck · flip · freeze
4. Transactions : Global feed + DetailDrawer + filters + export
5. Transfer     : The full 5-screen flow (the marquee build)
6. Beneficiaries: Directory + Add drawer with IBAN auto-bank
7. Payments     : Timeline + Calendar
8. Statements   : Vault + preview
9. Investments  : Hero + Holdings + Drawer
10. Savings · Budgets · Loans · Exchange
11. Insights · Activity
12. Empty states + mobile pass + reduced-motion pass
```

Each tranche merges with its own QA checklist: behavior-signal coverage, motion timing, AAA contrast, keyboard map, reduced-motion fallback.

---

## 29. Out of Scope for 4B

- Real provider integrations (Plaid, Stripe Treasury, etc.)
- Real KYC document upload pipeline
- Crypto trading execution
- Loan origination flow
- Admin / back-office views
- Multi-currency consolidated balance math beyond display

---

## 30. Definition of "Done"

A user can:
1. Glance at `/app/accounts` and know where every euro lives.
2. Mint a virtual card, freeze it, unfreeze it — without a single modal.
3. Send €1,250 to a saved beneficiary in under 18 seconds, never once asked to "verify."
4. Find any transaction in `⌘K` in under 4 keystrokes.
5. Set a savings goal and see, that evening, an AI insight about their pace.
6. Look at the Security Strip and feel — without thinking — that Aegis is awake.

When all six are true and the module shares zero perceptual seams with 4A, Phase 4B is done.

---

Approve this and I'll start building 4B in the order in §28 — beginning with the SecurityStrip + ⌘K extension, then Accounts, then the marquee Transfer flow.
