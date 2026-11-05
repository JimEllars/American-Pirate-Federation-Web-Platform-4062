# Recurring Maintenance Audit — 2026-11-03 (second pass)

**Repository:** `JimEllars/American-Pirate-Federation-Web-Platform-4062`
**Branch:** `fix/ground-truth-and-edge-hardening` (PR #123, open, green at `c5af70c` before this pass)
**Auditor:** Development Specialist, APF internal dev team
**Method:** static review against SOP v1.0.0, local production build + build verifier, read-only
PostgREST queries against the live Supabase project (`xzdgytloaczpzmtflenl`) with the `anon`
key already published in the production bundle, and manual route verification in a headless
browser. **No production writes, no schema changes, no CMS writes.**

---

## 0. Executive summary

This pass fixes **six defects of one family: controls and states that assert something the
system does not do.**

Two of them matter beyond hygiene:

- **`/podcast` published a live broadcast that was not happening** (F30). Pressing play on any
  dispatch set `isPlaying`, rendered `BROADCASTING_LIVE` and animated a 40-bar equaliser —
  whether or not an audio file existed. None does: no WordPress post carries an audio field and
  `transmissions` is empty. Every visitor who pressed play was told a broadcast was live while
  hearing silence. This is the same failure the ticker, the readiness index and the news
  fallbacks were removed for, on a primary navigation route.
- **`/shop` and `/propose` had no working exit from their wrong-network gate** (F29). Both
  rendered a full-page `[ SECURE CHANNEL: ARBITRUM NETWORK CONNECTION REQUIRED ]` block whose
  only control called `const switchChain = () => {}`. A visitor whose wallet sat on any other
  chain was locked out of the armory and the proposal floor by a button that did nothing and
  said nothing.

Both are now real, and both are covered by assertions.

One **new open item needs the content owner, not engineering** (F35): the headless WordPress at
`piratefederation.org` is publishing **seven posts, every one of them scaffolding** — the
WordPress default `hello-world` post and six site-starter posts written within 30 seconds of
each other on 2026-03-27. The frontend publishes them faithfully as Federation dispatches and
news. Neither `Law 1` nor a sprint of CSS fixes that: the CMS has no content in it.

Production is still serving the **2026-10-25** bundle, and PR #123 is still unmerged
(F26). Every CSP and ground-truth fix in this branch remains unenforced on the public site.

---

## 1. Live state (verified 2026-11-03, 19:06–19:20 UTC)

### 1.1 Production has not moved

| Check | Result |
|---|---|
| Entry bundle | `assets/index-CXPQaP1L.js` — unchanged since the 2026-10-25 deploy |
| `connect-src` | still `https://*.supabase.co wss://*.supabase.co` **and** `https://api.emailit.com` |
| `img-src` | still `https://*` |
| `object-src` / `base-uri` / `frame-ancestors` | absent |
| `Access-Control-Allow-Origin` | `*` on the HTML response |

Identical to the first pass today. The branch's `_headers` rework is not in force.

### 1.2 `policy_consensus` is still drifted 14/14

`select=provenance` still returns `42703 column policy_consensus.provenance does not exist` —
direct evidence that `20261102120000_policy_consensus_seed_integrity.sql` has never run. The
table still holds APF-001 … APF-014 under another organisation's titles ("Direct Democracy
Architecture", "Net Neutrality Restoration", …) and scores. `/policies` publishes doctrine and
reports the disagreement rather than rendering it, so the public page is correct — the database
is not.

### 1.3 Operational tables are still empty

`members`, `proposals`, `votes`, `ledger`, `events`, `event_signals`, `transmissions`,
`armory_inventory`, `requisitions`: no row readable with the `anon` key. Unchanged.

### 1.4 The CMS is scaffolding, and the site publishes it

`GET https://piratefederation.org/wp-json/wp/v2/posts` returns **7 posts, status `publish`**:

| ID | Date (UTC) | Slug |
|---|---|---|
| 24 | 2026-03-27 19:45:16 | `membership-benefits-of-the-federation` |
| 21 | 2026-03-27 19:45:10 | `adventure-awaits-with-the-federation` |
| 18 | 2026-03-27 19:45:05 | `nautical-themes-in-our-community` |
| 15 | 2026-03-27 19:44:59 | `the-bold-style-of-american-pirates` |
| 12 | 2026-03-27 19:44:54 | `events-at-the-american-pirate-federation` |
| 9 | 2026-03-27 19:44:48 | `join-the-american-pirate-federation` |
| 1 | 2026-03-27 03:37:28 | `hello-world` |

Six of these were created inside 30 seconds — site-starter copy, not operations. ID 1 is the
WordPress default post, still live: *"Welcome to WordPress. This is your first post. Edit or
delete it, then start writing!"* It appears on `/intelligence` today as a Federation dispatch,
and the readiness card counts it ("7 Intel Reports On File"). This is F35.

---

## 2. Fixed in this pass

| # | Sev | Finding | Fix |
|---|---|---|---|
| F29 | S2 | **The wrong-network gate was a dead end.** `Armory.jsx` and `Propose.jsx` each declared `const switchChain = () => {}` and wired the gate's only button to it. A wallet on any chain other than 42161 could not reach `/shop` or `/propose` at all, and the button that offered to fix it did nothing — no request to the wallet, no error, no toast. `Layout` already performed the real switch via `useSwitchActiveWalletChain()`. | New `src/components/web3/SwitchNetworkButton.jsx` performs the real switch, reports rejection (`[ NET_OPS: CHAIN SWITCH REJECTED … ]`) instead of swallowing it, and shows a busy state. Both pages use it, so the two gates cannot drift from `Layout` again. `isMismatched` now also accepts Sepolia (421614), the pair `Layout` treats as in-network, so a test-chain build is not hard-blocked. |
| F30 | S1 | **`/podcast` fabricated a live broadcast.** `togglePlay()` set `isPlaying` on any card click; the player then rendered `BROADCASTING_LIVE` and animated an equaliser regardless of whether an audio source existed. The code said so out loud: `// Fallback to visualizer-only simulation mode`. Additionally, `audio_url` was read from a view model that exposes `audioUrl`, so a real `transmissions` recording would never have played; `date: t.date \|\| new Date().toISOString()` stamped every transmission with the day it was read; and `author` / `duration` / `correlation` were read from keys the mapper never produces (`'AXiM Core'`, `'SECURE_DUR'`, `'ENCRYPTED'` were defaults). | One resolver, `audioSourceFor()`, accepts `audioUrl`, `audio_url` and the WP `audio_url` custom field. A dispatch without a source opens its transcript and the player states `NO AUDIO PUBLISHED`; the transport is disabled (`aria-label="No recording available"`) and the equaliser is dormant. `onError` and a refused `play()` both stop the player and say why. Dates come from `publishedAt`/`date` and are omitted when absent. Only real fields are rendered (`Format: AUDIO \| WRITTEN`, `Classification`); the invented defaults are gone. |
| F31 | S2 | **"Nothing published" was reported as "the wire is down."** `/podcast` printed a red `[COMM_LINK_DOWN]` for an archive that was merely empty, and `/intelligence` printed `[SIGNAL_INTERRUPTED] - UNABLE TO FETCH ARCHIVES` because its condition was `error \|\| !posts`. An empty, healthy backend was therefore indistinguishable from an outage — the inverse fabrication of a fake metric, and misleading in the other direction. | Both pages now branch three ways: loading, error, empty. Empty renders `[ NO ASSEMBLY RECORDS PUBLISHED ]` / `[ NO DISPATCHES ON FILE ]` with copy that says the archive stays empty until the Federation publishes. |
| F32 | S3 | **Dead controls on primary routes.** `/podcast` had two "frequency" buttons (`[ 433.92 MHz ]`, `[ 915.00 MHz ]`) that only called `e.currentTarget.blur()` — annotated `/* Simulation */` — plus skip-back and skip-forward buttons with no handler at all, and the player panel is a sticky, prominent surface. `/intelligence` ended with a "Load Older Transmissions" button that loaded nothing. | Frequency selectors and transport skip buttons removed (there is no frequency and no queue — the player has one source at a time). The `/intelligence` control is replaced by a plain statement that the archive lists what the CMS has published. |
| F33 | S3 | **`/intelligence` shipped a scheduled no-op.** A `setInterval` every 5 minutes logged `[ BACKGROUND_SYNC: INITIATING INTEL FETCH ]` and executed `// TODO: Wire actual fetch call here`. In production `esbuild.drop: ['console']` removes the log, leaving a timer that fires forever and does nothing — a background sync that was only ever an announcement of itself. | Removed, with a comment recording why the page does not poll. |
| F34 | S2 | **The pending-transaction indicator promised an action nobody could take.** `Navbar.jsx` rendered a pulsing, hoverable `[ N PENDING TX ]` **button** wired to `const handleProcessTx = () => {}`. Submitting a proposal puts a record in `activeTxQueue`, so the chip appears and stays — permanently pulsing, permanently inert. Related dead weight: `src/lib/web3/transactionQueue.js` simulated `BROADCASTING → CONFIRMING → FINALIZED` on `setTimeout` with a branch that could never fail (`Date.now() > 0`), and `Propose.jsx` imported `useSubmitFederationHash` without calling it while carrying an unreachable `isMining` overlay reading `[ ENCRYPTING PAYLOAD & AWAITING BLOCKCHAIN CONFIRMATION... ]` (`isMining` was never set). | The chip is now a non-interactive status readout (`[ N LOCAL DRAFT ]`, amber, with a tooltip) that states what the queue is: browser-local drafts, nothing broadcast. The simulated transaction queue module is deleted; the unreachable overlay, its state and the unused imports are removed; the proposal toast reads `[ SYSTEM: DRAFT RECORDED LOCALLY — NOT BROADCAST TO ARBITRUM ]` and the page copy no longer claims submissions "enter a peer-review queue". |

Also removed in this pass: `src/lib/web3/networkUtils.js`, an unused module whose only export was
`switchToArbitrum()` returning `Promise.resolve(true)` without switching anything (Digital
Quartermaster Hygiene, Law 5).

---

## 3. Open items

### 3.1 New

| # | Sev | Item | Owner |
|---|---|---|---|
| F35 | S1 | **The CMS holds no real dispatches.** All 7 published posts are scaffolding, including the WordPress default `hello-world` (see §1.4). The frontend renders them honestly — it is the content that is absent, so this cannot be fixed from the repository. It is visible on `pirateusa.org/intelligence`, `/podcast` and the home news strip today. | Content owner / WordPress admin: delete `hello-world` (ID 1), replace or unpublish the six starter posts (IDs 9, 12, 15, 18, 21, 24), then publish real dispatches. Engineering deliberately did **not** add a title blocklist to hide it: a filter that silently drops content is another way of lying about what the CMS says. |
| F36 | S3 | **Gateway 3 cannot run in this agent sandbox.** `npx playwright test` fails all 28 tests at launch: `chrome-headless-shell: error while loading shared libraries: libnspr4.so`, and no `libnss3`/`libnspr4` are installed in the image (no root, no package manager access). The suite and the browser binaries are fine — the container is not. Local verification of this pass was therefore done by driving the built SPA in a separate headless browser. | Whoever maintains the agent image: install Playwright's Linux dependencies (`npx playwright install-deps`) so the gate can be exercised before a push. CI remains the authority. |

### 3.2 Carried forward

| # | Sev | Item | Status |
|---|---|---|---|
| F10 | S3 | Initial payload ~776 kB gzip vs the 200 kB SOP target; `web3-*.js` is `modulepreload`ed. | Unchanged. Design is in `docs/audit-2026-11-02.md` §3. |
| F11 | S3 | Design tokens still differ from SOP §4 (`#0A0A0A`/`#9400FF`/`#10B981` vs `#050505`/`#9400D3`/`#00FF66`). | Needs a brand-owner decision. |
| F13 | S3 | `npm audit --omit=dev`: **57 advisories — 0 critical, 28 high**, all transitive inside thirdweb → wagmi → walletconnect → reown. | Unchanged; mitigation is `thirdweb@5.100.2` (breaking). |
| F14 | S3 | Build wall time is environmental in this sandbox (this pass: 28.8 s cold, then 11–17 min). | Re-measure on a CI runner. |
| F15 | S3 | `AiActionModal` is still dead code (nothing calls `setPendingAiAction`). | Separate change with its own tests. |
| F16 | S3 | `useAPFWrite` still builds Safe-incompatible ABIs; the Safe signer threshold is unpublished. `/ledger` says so explicitly. | Treasury task. This is also why F34's queue cannot simply be "made real" in a frontend pass. |
| F25 | S1 | `policy_consensus` still drifted 14/14; repair migration unapplied. | Needs a service-role credential. |
| F26 | S1 | Production serves the 2026-10-25 build with the old CSP. | Merge PR #123 + deploy. |

---

## 4. Verification performed

| Gateway | Command | Result |
|---|---|---|
| 1 — Static analysis | `npm run lint` | **0 errors, 0 warnings** |
| 2 — Production build | `npm run build` | success; no source maps in `dist/` (wall time 14 m 48 s in this sandbox — see F14) |
| 2b — Build verifier | `npm run verify:build` | passes; initial payload **776.3 kB** gzip (unchanged, +0.0 kB), CSP invariants intact, no compiled secrets |
| 3 — Playwright smoke | `npx playwright test` | **could not run in this sandbox** — F36. The suite gained two tests for this pass and CI is the authority. |
| 4 — Secret scan | `grep -rn "sk_live\|EMAILIT_API_KEY\|STRIPE_SECRET\|SERVICE_ROLE" src/ dist/` | clean |
| Manual (headless browser, built SPA) | `/podcast`, `/intelligence`, `/propose`, `/shop` | `/podcast`: five dispatches render as `WRITTEN` / `NO RECORDING` with their real 2026-03-27 dates; selecting one shows `NO AUDIO PUBLISHED`, a disabled transport, and the transcript — `BROADCASTING_LIVE` never appears. `/intelligence`: dispatch list and the "Load Older" control are gone; the archive ends honestly. `/propose` and `/shop` render without the wallet gate for a wallet-less visitor. |
| Database | PostgREST `anon`, read-only | 14 drifted policies, `provenance` absent, operational tables empty |
| CMS | `wp-json/wp/v2/posts` | 7 published posts, all scaffolding (F35) |

Environment notes: Node **v22.23.4** against `.node-version`/`.nvmrc` **20** (unchanged; CI is the
authority for the pinned version).

---

## 5. Recommended next actions, in order

1. **Merge PR #123 and deploy.** Two full passes and this one are sitting in an unmerged branch
   while production serves a 9-day-old bundle with a wildcard `connect-src`. This needs no
   credential anybody is missing.
2. **Fix the CMS (F35).** Delete `hello-world`, deal with the six starter posts, publish one real
   dispatch. Until that happens, `/intelligence`, `/podcast` and the home news strip are a
   faithful rendering of placeholder content.
3. **Apply `20261102120000_policy_consensus_seed_integrity.sql`** with a service-role credential.
4. Set `STRIPE_SECRET_KEY`, `EMAILIT_API_KEY` and `SITE_URL` in the Pages environment, or
   `/api/donate` and `/api/subscribe` correctly return 503.
5. Decide F11 (brand hex) — a one-page decision that unblocks a sweep commit.
6. Repair the agent image so Gateway 3 can run before a push (F36).
7. Schedule the F10 wallet extraction as its own PR with manual wallet testing.
