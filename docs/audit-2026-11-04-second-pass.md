# Recurring Maintenance Audit — 2026-11-04 (second pass)

**Repository:** `JimEllars/American-Pirate-Federation-Web-Platform-4062`
**Branch:** `fix/ground-truth-and-edge-hardening` (PR #123, open, green before and after this pass)
**Auditor:** Development Specialist, APF internal dev team
**Method:** independent re-verification of the previous pass's live claims, a fresh sweep of
the UI for unearned assertions, local production build + build verifier, the full Playwright
suite, and read-only PostgREST queries against the live Supabase project
(`xzdgytloaczpzmtflenl`) with the `anon` key already published in the production bundle.
**No production writes, no schema changes, no CMS writes, no deployments.**

---

## 0. Executive summary

This pass closed **the last family of theatre in the product shell**: three places where the
interface asserted an operational or security fact that no code had ever checked.

- The telemetry terminal printed `[ INGRESS: CLOUDFLARE_EDGE_ACTIVE ]` as a literal on
  every page, whether or not a byte had been sent — while the ingress function itself
  carries a comment instructing the client not to present a 200 as "recorded".
- Every page footer read `SECURE NODE ESTABLISHED.`, an unverified claim about transport.
- The wallet control's pending state read `[ INITIALIZING ENCRYPTION... ]`. Connecting a
  wallet initialises no encryption.

All three are now derived from something real: the observed outcome of the last POST to
`/api/telemetry`, the browser's own `isSecureContext`, and the actual operation's name.
`AiActionModal` — the last unreachable component with a signed-nothing button and an 800 ms
sleep — is deleted.

**Nothing about the platform's blocking problems changed.** Production still serves the
2026-10-25 bundle, `policy_consensus` is still drifted 14/14, and every operational table
still holds zero rows. Re-verified today, not assumed. Those items need a merge, a
service-role credential, and a content owner respectively — none of which an agent sandbox
holds. They are restated in §4 with the evidence.

---

## 1. Live state, independently re-verified (2026-11-04, 19:05–19:15 UTC)

The previous pass's claims were treated as unproven and re-measured. All of them hold.

| Check | Result |
|---|---|
| Entry bundle (`curl https://pirateusa.org/`) | `assets/index-CXPQaP1L.js` — unchanged since 2026-10-25 |
| `connect-src` | `https://*.supabase.co wss://*.supabase.co` **and** `https://api.emailit.com` |
| `img-src` | `https://*` |
| `object-src` / `base-uri` / `frame-ancestors` | absent from the live policy |
| `Access-Control-Allow-Origin` | `*` |
| `members`, `proposals`, `votes`, `ledger`, `events`, `event_signals`, `transmissions`, `armory_inventory`, `requisitions` | **0 rows each** |
| `policy_consensus` | 14 rows, still drifted (`APF-001` = "Direct Democracy Architecture", 94.5) |
| `policy_consensus.provenance` | `42703 column … does not exist` |

The in-repo `public/_headers` is already correct and strict; production is simply not built
from it. That is a deployment gap (F26), not a source defect.

---

## 2. Fixed in this pass

| # | Sev | Finding | Fix |
|---|---|---|---|
| F46 | S3 | **The shell asserted states the client cannot know.** `Layout.jsx` printed `[ INGRESS: CLOUDFLARE_EDGE_ACTIVE ]` unconditionally — including on a build with no Supabase project configured, and including when every transmission had failed. The copy was contradicted by `functions/api/telemetry.js`, whose own comment says there is no durable sink and the client "must not treat a 200 here as 'analytics recorded'". The footer printed `SECURE NODE ESTABLISHED.` on every route without checking anything. | `useAppStore` now holds `ingressStatus` (`idle`/`accepted`/`rejected`/`unreachable`, last event count, last HTTP status), written by `reportIngress()` in `telemetry.js` from the actual `fetch` outcome in both `flushTelemetryQueue` and `processBatch`. The terminal renders one of five honest lines, e.g. `[ INGRESS: EDGE ACCEPTED 12 EVENT(S) // NO SINK ]`, `[ INGRESS: EDGE UNREACHABLE // 3 QUEUED ]`, `[ INGRESS: DISABLED — NO PROJECT CONFIGURED ]`, or `[ INGRESS: NO TRANSMISSION THIS SESSION ]`. The footer renders `[ CONTEXT: SECURE ]` / `[ CONTEXT: NOT SECURE ]` from `window.isSecureContext`. Ingress state is deliberately **not** persisted: a reading from a previous session is not a reading. |
| F47 | S3 | **Three controls claimed encryption they were not performing.** The wallet button's pending state read `[ INITIALIZING ENCRYPTION... ]` in both the desktop bar and the drawer (a wallet connection initialises no encryption). The route-chunk fallback read `[ ESTABLISHING SECURE CONNECTION... ]` while it was loading a JavaScript module. The `/intelligence` AI control read `[ TRANSMITTING SECURE CONTEXT... ]` before any transport was established or any response known. | `[ CONNECTING WALLET... ]`, `[ LOADING MODULE... ]`, `[ TRANSMITTING CONTEXT... ]` respectively. |
| F15 | S3 | **`AiActionModal` was unreachable dead code with a fake execution path.** It rendered on every page but `setPendingAiAction` was called from nowhere, so it could never open; its "AUTHORIZE & SIGN" button signed nothing and awaited an 800 ms sleep to simulate work. | Deleted (`src/components/ui/AiActionModal.jsx`, −177 lines), along with its import/render in `App.jsx` and the orphaned `pendingAiAction` / `setPendingAiAction` / `clearPendingAiAction` store keys. `parseAICommand` and `executePirateCommand` are untouched: the former is still used by `usePirateAI` on `/intelligence`. |

---

## 3. Verification performed

| Gateway | Command | Result |
|---|---|---|
| 1 — Static analysis | `npm run lint` | **0 errors, 0 warnings** (exit 0) |
| 2 — Production build | `npm run build` | success in **32.1 s**; **0** `.map` files in `dist/` |
| 2b — Build verifier | `npm run verify:build` | passes; initial payload **759.0 kB** gzip (was 760.5 kB); CSP invariants intact; no secrets in `dist/` |
| 3 — Playwright smoke | `npx playwright test` | **35 passed** (2 added this pass) |
| 4 — Secret scan | `grep -rnE "sk_live\|sk_test\|EMAILIT_API_KEY\|STRIPE_SECRET\|SERVICE_ROLE\|AI_API_SECRET" src/ dist/` | clean |
| 4b — Client env surface | `grep -rhoE "VITE_[A-Z_]+" src/` | 8 public vars only; no private value carries the prefix |
| 4c — Working tree | `git status --short` | 8 modified + 1 deleted; no patch scripts, bundles or test artifacts |
| Database | PostgREST `anon`, read-only | unchanged: 0 operational rows, 14 drifted policies, `provenance` absent |
| Dependencies | `npm audit --omit=dev` | **57 advisories — 12 low, 17 moderate, 28 high**, unchanged (all transitive in thirdweb → wagmi → walletconnect → reown) |

New assertions:

- `the shell reports only ingress and context states it actually observed` — asserts
  `CLOUDFLARE_EDGE_ACTIVE` is absent, the ingress line matches only the five states the
  client can genuinely be in, `SECURE NODE ESTABLISHED` is absent, and a context line is
  present.
- `no control claims encryption is being initialised` — asserts `INITIALIZING ENCRYPTION`
  appears nowhere.

Environment note: Node **v22.23.4** against `.node-version`/`.nvmrc` **20**; CI remains the
authority for the pinned version. The earlier 6–7 minute build wall time (host I/O wait) did
not reproduce — this build took 32 s, consistent with it being environmental rather than a
bundler regression.

---

## 4. Open items — unchanged, and why

These are carried forward deliberately. Each needs something an agent sandbox does not have;
restating them is more useful than quietly re-listing them as "watched".

| # | Sev | Item | What it actually needs |
|---|---|---|---|
| F26 | S1 | Production serves the 2026-10-25 build with the wildcard `connect-src`, `img-src https://*` and `ACAO: *`. | **Merge PR #123 and let Cloudflare Pages deploy.** The PR is `MERGEABLE`/`CLEAN` with all checks green. This is the single highest-value action available and it needs no credential anyone is missing. |
| F25 | S1 | `policy_consensus` drifted 14/14; the repair migration (`20261102120000_policy_consensus_seed_integrity.sql`) is committed but unapplied. | A **service-role** credential (`supabase db push` or the dashboard SQL editor). Not present in this environment, and deliberately not obtainable from the client bundle. |
| F35 | S1 | The CMS holds no real dispatches; the seven WordPress starter posts (including `hello-world`) are the entire archive. | A WordPress administrator (content owner). |
| F10 | S3 | Initial payload **759.0 kB** gzip vs the 200 kB SOP target; `web3-*.js` (623.8 kB) is still `modulepreload`ed from `index.html`. | The wallet-layer extraction designed in `docs/audit-2026-11-02.md` §3. Serviceable as its own PR; not a config change. |
| F11 | S3 | Design tokens differ from SOP §4 (`#0A0A0A`/`#9400FF`/`#10B981` vs `#050505`/`#9400D3`/`#00FF66`). | A brand-owner decision on which hex set is canonical. Then one sweep commit. |
| F13 | S3 | 57 advisories, 28 high, all transitive under thirdweb. | A dedicated dependency-upgrade cycle to `thirdweb@5.100.2`+ with wallet smoke tests; the bump is breaking. |
| F16 | S2 | `useAPFWrite` still builds Safe-incompatible ABIs; the Safe signer threshold is unpublished. | Contract-level treasury work. `MusterRoll`, `PolicyCard` and `FleetMuster` no longer call the invented methods. |
| F45 | S3 | `/intelligence` still merges CMS posts with `transmissions` and publishes scaffolding. | Content owner, same as F35. |
| F44 | — | Shell copy asserting unobserved state. | **Closed this pass as F46/F47.** |

---

## 5. Recommended next actions, in order

1. **Merge PR #123 and deploy.** Three maintenance passes, 40+ commits and a green check
   suite are stacked behind a production bundle that is now twelve days old and serving the
   exact CSP the SOP forbids. No further code work improves the platform as much as this
   one administrative step.
2. **Create the first member.** Sign in with a real mailbox, file a muster entry, confirm one
   row appears in `members` with `role = Deckhand`. This is the only end-to-end check of the
   identity path that no sandbox can perform.
3. **Apply the `policy_consensus` repair migration** with a service-role credential (F25).
4. **Fix the CMS** (F35/F45): delete `hello-world`, replace the six starter posts.
5. Set `STRIPE_SECRET_KEY`, `EMAILIT_API_KEY` and `SITE_URL` in the Pages environment, or
   `/api/donate` and `/api/subscribe` correctly return 503.
6. Decide F11 (brand hex) — one page of decision, unblocks a sweep commit.
7. Schedule the F10 wallet extraction as its own PR.
