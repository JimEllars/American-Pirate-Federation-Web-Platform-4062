# APF Design Direction — modern product, retro signal

**Status:** v1 direction, 2026-11-05
**Owner:** Federation brand owner (final say), implemented by the development team
**Scope:** PirateUSA.org frontend

---

## 1. What we are building

A community platform: resources, education, discussion, events, tools, games and
blockchain features. The interface has to carry long-form reading, dense directories,
threads, profiles, dashboards and eventually interactive canvas — not just a landing page.

The current visual language was built as a terminal pastiche: VT323 on almost every
heading, neon glow on every card, scanlines over every surface, uppercase tracking
everywhere. It reads as a costume. It also fights the product: pixel type at body sizes is
hard to read, and glow-on-everything means nothing stands out.

**New rule: the product is modern. The retro is the signal, not the wallpaper.**

Retro elements survive where they mean something — system status, terminal readouts,
hashes, timestamps, the Signal player, small technical labels. They become accents a
visitor notices, not the surface they read through.

---

## 2. Five design principles

1. **Content first.** Type, spacing and contrast exist to make reading and scanning easy.
   No effect may reduce legibility or hide content behind hover.
2. **Neon is a status colour, not decoration.** Violet and emerald mark action, live state
   and system output. One accent per viewport is the target. Glow is reserved for the
   active/live element.
3. **Retro is a voice, not a typeface.** Terminal microcopy (`[ INGRESS: … ]`), monospace
   metadata and the Signal console keep the pirate-transmission character. Headings,
   navigation, body copy and forms do not.
4. **One system.** One card, one button set, one heading scale, one spacing rhythm. Pages
   compose those primitives; they do not invent local styles.
5. **Calm by default, alive on purpose.** Motion is short (150–250 ms) and explains a state
   change. Infinite animation is only for something genuinely live (playing audio,
   degraded connection).

## 3. Foundations

### Type

| Role | Face | Usage |
|---|---|---|
| Display | **Space Grotesk** | h1–h3, hero, section titles, large numbers |
| UI / body | **Inter** | navigation, body copy, forms, tables, buttons |
| Terminal accent | **VT323** | status lines, ingress, hashes, timestamps, ≤12 px technical labels |
| Code | system monospace | addresses, code blocks, JSON |

- Body 16 px / 1.65; long-form 17–18 px, max 68 ch.
- Headings: semibold, tight tracking (`-0.02em` to `-0.03em`), sentence case preferred.
- Uppercase is for labels and terminal lines only — never paragraphs, never navigation.
- **No VT323 headings.** Existing `font-vt323` on h1–h4 is a migration defect.

### Colour

| Token | Value | Use |
|---|---|---|
| `surface-950` | `#07080B` | page background |
| `surface-900` | `#0B0D12` | cards, nav |
| `surface-800` | `#11141B` | raised card, dropdown |
| hairline | `rgba(255,255,255,.07)` | borders and dividers |
| `ink` | `#E7EAF0` | primary text |
| `ink-muted` | `#9AA4B2` | secondary text |
| `ink-dim` | `#6B7480` | metadata |
| `apf-purple` | `#9400D3` | primary action, brand |
| `apf-purpleLight` | `#C084FC` | links, accent text on dark |
| `apf-emerald` | `#10B981` | affirmative / live |
| `signal` | `#00FF66` | terminal-only signal green |
| amber / red | Tailwind defaults | warnings / errors |

- Cards are dark neutral, not tinted. Accent appears in one element per card.
- Text on violet must be white; violet text only on dark surfaces.
- Minimum contrast 4.5:1 for body, 3:1 for large text and UI edges.

### Space, radius, depth

- Container `max-w-7xl` (1280), gutters 16/24/32.
- Section rhythm: 80 px mobile, 96 px desktop. Card padding 20–24.
- Radius: 12 px controls, 16 px cards, 24 px feature panels, full for pills.
- Depth: hairline border + soft shadow. No layered neon glow. Hover = border brightens
  and surface lifts 2 px; that is enough.

### Motion

- 150–250 ms, ease-out. Fade + 8 px translate for entrances.
- No pulsing dots except a genuinely live connection; no glitch text on hover.
- `prefers-reduced-motion` disables non-essential animation globally.

## 4. Components (single source)

| Primitive | Class / component | Notes |
|---|---|---|
| Container | `.apf-container` | one gutter system |
| Card | `.apf-card` + `.apf-card-hover` | 16 px radius, hairline, soft shadow |
| Kicker | `.apf-kicker` | terminal label above a heading |
| Button | `.apf-btn` + `-primary` / `-ghost` | 44 px min target |
| Status strip | `Ticker` | real facts only, terminal voice |
| Terminal panel | `.apf-terminal-panel` | the retro accent: one per page max |
| Section header | kicker + h2 + lede | left-aligned by default |

## 5. Page patterns for what comes next

- **Resources / education:** article list with 16:9 covers, 2–3 line summaries, reading
  time, filter rail. Reading view: 68 ch column, sticky table of contents.
- **Discussions:** thread list (title, author chip, replies, last activity), thread view with
  flat replies, composer pinned at the bottom. Terminal voice only in timestamps.
- **Profiles:** identity header (alias, guild, role), activity tabs, no PII beyond what the
  member publishes.
- **Games:** full-bleed canvas surface with a minimal HUD; the only place a CRT/scanline
  treatment is allowed to cover the viewport.
- **Chain features:** wallet chip and transaction states use the same button/status
  primitives; explorer links in monospace. Read-only treasury stays read-only.

## 6. Migration plan

| Stage | Scope | State |
|---|---|---|
| 1 | Tokens, type, base CSS, navigation, footer, Hero, status strip, Pirate Code, home sections | **shipped 2026-11-05** |
| 2 | Content routes, shared cards, forms and modals | **shipped 2026-11-05** |
| 3 | Content routes: Intelligence, Policies, Signal, Armory, Events, Donate | next |
| 4 | Governance, Calculator, Ledger, Passport | next |
| 5 | Community surfaces (resources, education, discussions, profiles) | with feature work |
| 6 | Games / chain surfaces | with feature work |

### Stage 1 shipped (2026-11-05)

- Space Grotesk display / Inter UI / VT323 terminal, loaded from one Google Fonts request.
- Surface, ink and border tokens; brand violet kept, emerald for affirmative, terminal green
  reserved for the ingress line.
- `.apf-card`, `.apf-btn`, `.apf-kicker`, `.apf-lede`, `.apf-container` primitives.
- Navigation rebuilt: pill states, proper dropdown, Passport as ghost control, one-row
  desktop bar retained.
- Hero: sentence-case display headline, two CTAs, four verifiable facts, one terminal panel
  as the retro accent.
- Status strip is a seamless marquee of real facts only.
- Pirate Code cards always show their text (hover-only content removed) and align footers.
- Home treasury, newsroom and muster form rebuilt on the new primitives; the muster form
  now says "Join the muster roll" and uses plain-language fields.
- The fixed telemetry panel is gone from every page; the observed ingress line and context
  now live in the footer. This removes the overlay that covered content on every route.
- The floating Contribute button is gone; Contribute is inline where it is contextual and
  reachable from Donate in the navigation.
- `prefers-reduced-motion` honoured globally; focus rings on every interactive control.

### Stage 2 shipped (2026-11-05)

- `PageHeader` component: one kicker/title/lede pattern on every route.
- Policies: policy cards rebuilt (baseline bar, notes/history panels, local-signal
  buttons); draft list and revision CTA on the shared card system.
- Intelligence: crew census, readiness count, schematic and ingress panels rebuilt;
  dispatch cards and the AI control modernised.
- Signal: player, transport, classification metadata and episode cards rebuilt; fixed an
  `<audio>` element that fired `error` on mount and announced a broken recording before
  anything was selected.
- Armory: clearance panel, category bar, item cards, requisition history and network gate.
- Events: muster list, empty states and past-muster archive.
- Donate: sidecar split cards and a modern 300×300 Chest (monthly default, statutory
  disclosure still inside the frame).
- Calculator and Ledger: panels, inputs, tables and actions on the new primitives.
- Propose, Passport dialog, toasts, network gate, loading fallback and error boundary.
- 91 `font-vt323` usages reduced to 13, all small terminal accents.

Remaining: community surfaces (resources, education, discussions, profiles, games) are
not built; see `docs/community-platform-roadmap.md`.

Migration rules for every touched file:

1. Headings lose `font-vt323` and `uppercase`; use `font-display`.
2. Card wrappers become `.apf-card`; remove per-card `hover:shadow-[0_0_…]` glow.
3. `font-vt323` is allowed only on `[ … ]` status lines and metadata ≤12 px.
4. Remove `scanlines` from ordinary cards; keep it inside terminal/media panels only.
5. Buttons become `.apf-btn` variants; minimum 44 px height.
6. Facts only: no new counters, no “active users”, no simulated activity.

## 7. Open brand decisions

- Canonical hex set: SOP says `#050505 / #9400D3 / #00FF66`; Tailwind currently ships
  `#0A0A0A / #9400FF / #10B981` (tracked as F11). This direction uses the SOP purple
  `#9400D3` and keeps `#10B981` for UI affirmative, with `#00FF66` reserved for terminal
  signal. Brand owner to confirm.
- Display face: Space Grotesk proposed. Alternative: Inter Display if we want one family.
- Whether the fixed telemetry terminal stays on every page or moves into the footer.
  Proposal: footer on public pages, panel on `/intelligence` only.
