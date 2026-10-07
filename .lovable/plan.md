## Batch 4 — Responsive & Accessibility (Production Polish)

Scope is large (60+ routes), so the plan is **shell-first**: lifting the layout chrome, primitives, and global concerns covers ~80% of every route at once. Per-route surgical fixes follow, targeted only at routes that don't conform after the shell upgrade.

### 1. Global a11y foundation

- `__root.tsx`: add `lang="en"` enforcement, `<a href="#main">Skip to content</a>` skip link, `prefers-reduced-motion` CSS var, single `<main id="main">` audit.
- `styles.css`: add `@media (prefers-reduced-motion: reduce)` block neutering `animate-*`, `transition-*`, `transform` motion; add visible `:focus-visible` ring token (`--ring-focus`) applied globally on interactive elements; raise muted text contrast token to meet AA on dark surfaces.
- `tailwind` arbitrary `text-[10px]` / `text-[11px]` sweeps → bumped to `text-xs` (12px min) where they're body-readable text (kept for monospace meta labels with aria-hidden where decorative).

### 2. Responsive layout shells

- **`app.tsx` (Vault shell)**: rail becomes drawer on `<lg` via shadcn `Sheet`; persistent rail only `lg+`. Main padding collapses `ml-[300px]` → `ml-0 lg:ml-[300px]`, `pr-8` → `px-4 sm:px-6 lg:pr-8`. Add top mobile bar with menu + brand + ⌘K trigger. `SecurityStrip` becomes compact on mobile.
- **`admin.tsx` (Ops shell)**: `OpsRail` → drawer on `<xl`. Main `ml-[268px]` → responsive. `OpsTopBar` wraps; `OpsStatusBar` hidden `<md` (replaced by collapsed pill).
- **`app.guard.tsx`**: `GuardSubRail` switches to horizontal scroll tab strip on `<md`.
- **`auth.tsx`**: split-screen stacks single-column on `<md`; vault artifact hidden `<sm`, smaller on tablet.
- **`index.tsx` (landing)**: verify nav collapses (already has mobile menu), grid sections `md:grid-cols-2 lg:grid-cols-3` audit, hero visual `aspect-*` + responsive scale, pricing 3-up → stack, FAQ width.

### 3. Responsive primitives

- **`OpsTable`**: add `responsive` prop. `<md`: each row renders as stacked card (label/value pairs from columns), preserving `onRow` click. `md+`: existing grid table. Adds `role="table"`, `<caption>` slot, `scope="col"` headers, `aria-sort` hooks.
- **`AsyncBoundary` skeletons**: already added in Batch 3 — verify mobile variants don't overflow; add `min-w-0` defensively.
- **`PageHeader`** (`banking/page-header.tsx`): grid-cols fix per responsive-layout-patterns rule (`grid-cols-[minmax(0,1fr)_auto]` → `sm:flex`), `truncate` on heading.
- **Cards** (account-card, bank-card, balance-tile, insight-card, sigil-card): enforce `min-w-0`, `truncate`, fluid `text-` ramps `text-2xl sm:text-3xl`, `aspect-[1.586/1]` for card art.
- **Charts** (`river-chart`, `heat-grid`, `risk-gauge`, `sparkline`, `waveform-trace`, `drift-band-chart`, `decision-waterfall`, `session-river`, `confidence-ring`): wrap in `ResponsiveContainer`-equivalent (`width=100%`, `viewBox`-based SVG), `aria-label` + `<title>`/`<desc>`, `role="img"`; offer text fallback via `<span class="sr-only">` summary.
- **Dialogs/Sheets**: audit Radix-based shadcn (already good); confirm `aria-labelledby`, ensure `DialogTitle` present even when visually hidden (use `VisuallyHidden` wrapper). Add to `CommandBar` (⌘K).
- **Forms** (`auth.index`, `auth.verify`, `auth.calibrate`, `app.transfer`): every `Input` has associated `<Label htmlFor>`; required fields use `aria-required` + `aria-invalid` + `aria-describedby` for errors; OTP pucks get `aria-label="One-time code digit N"`.
- **Touch targets**: shadcn `Button size="icon"` default 36 → patched variant `min-h-11 min-w-11 sm:min-h-9 sm:min-w-9`; rail item `py-2` → `py-2.5 sm:py-2`; row click areas verified ≥44px on touch.

### 4. Motion consistency

- Standardize easing token `--ease-emphasized: cubic-bezier(.2,.8,.2,1)` and `--ease-standard: cubic-bezier(.4,0,.2,1)`; durations `--dur-fast:160ms / --dur-base:240ms / --dur-slow:360ms`. Replace ad-hoc `duration-[280ms]` etc.
- All custom `@keyframes` (`rail-pulse`, `pulse-live`, `float-soft`, `shimmer`, aurora) wrapped behind `@media (prefers-reduced-motion: no-preference)`.
- Remove layout-shift animations (height auto → fixed where applicable; framer-style `transform`/`opacity` only).

### 5. Performance

- Lazy-load heavy admin/guard routes via TanStack `lazyRouteComponent` for `admin.ai.*`, `admin.behavior`, `admin.risk`, `admin.infra`, `app.guard.*` (split bundles).
- Memoize chart row generators (`mulberry32` series) at module scope; wrap heavy components (`HeatGrid`, `RiverChart`, `RiskGauge`) in `React.memo` with stable props.
- Image strategy: landing hero visual is SVG/DOM (no image); add `loading="lazy"` + `decoding="async"` to any future `<img>` (audit only — none currently bundled as bitmaps).
- React Query: confirm `staleTime: 60_000` default in service hooks; mark list queries with `gcTime: 5 * 60_000`.
- Bundle: ensure `vite` `manualChunks` not needed (let Vite split per route); verify no barrel re-exporting fixtures into client bundle (already moved into services).

### 6. Per-route sweep (targeted only)

After shells/primitives land, walk routes and apply fixes only where layout still breaks:

- `app.transactions` filters → wrap chips with `overflow-x-auto` scroll-snap on mobile.
- `app.transfer` 4-step → ensure stepper goes vertical on `<sm`.
- `app.cards` 3D card object → scale `0.7` on mobile, disable tilt under reduced motion.
- `app.exchange` → number inputs `inputMode="decimal"`.
- `admin.ai.live` live tape → horizontal scroll container.
- `admin.geo-map` → `aspect-[16/9]`.
- Guard pages with split charts → stack on `<lg`.

### 7. Verification

- `bunx tsgo --noEmit`
- `bun run lint`
- `bun run build`
- Playwright screenshots at 375×812 (iPhone), 768×1024 (iPad portrait), 1280×800, 1920×1080 for: `/`, `/app`, `/app/transactions`, `/app/guard`, `/admin`, `/admin/ai/live`, `/auth`.
- Manual a11y check: tab through `/app` shell, `/auth`, `/admin` — every interactive reachable, focus ring visible.

### Deliverables

A written report at the end with: responsive issues found and fixed, a11y issues found and fixed, perf improvements, remaining warnings, TS/ESLint/build status.

### Notes / non-goals

- Visual identity unchanged — same palette, fonts, glass aesthetic.
- No new dependencies expected beyond what's installed.
- Backend untouched.
- 60+ routes are not individually rewritten; the shell + primitive upgrades lift them. The per-route sweep is surgical.

Approve and I'll start executing top-to-bottom.
