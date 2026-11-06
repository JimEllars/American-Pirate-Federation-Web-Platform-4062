# Community Platform Roadmap — notes toward what comes next

**Status:** working notes, 2026-11-05
**Companion to:** `docs/design-direction.md` (visual system), `docs/audit-2026-11-05.md` (current state)
**Intent:** the Federation site becomes a place members return to — resources, education,
discussion, events, guild work, games and chain features — without becoming an engagement
machine or a surveillance product.

---

## 1. Product principles

1. **Member-owned, not ad-funded.** No third-party analytics, no engagement optimisation,
   no resale of member data. Growth is by invitation and usefulness, not dark patterns.
2. **Pseudonymous by default.** A Passport needs an email for sign-in; nothing else is
   required to read. Public profiles are opt-in and publish only what the member chooses.
3. **Read first, act second.** Every surface is readable without a wallet. Writing needs a
   Passport. On-chain actions are the last step, never the gate.
4. **One identity, many rooms.** The same Passport covers the muster roll, discussion,
   courses and games. No parallel account systems.
5. **Moderation is a published process.** Rules, moderator powers and appeal paths live in
   the Code and in the UI, not in an unstated admin panel.

## 2. Surface map

| Surface | Job | State |
|---|---|---|
| **Resources** | Library of documents, briefings, templates, links | not built |
| **Education** | Structured learning paths, lessons, progress | not built |
| **Discussions** | Threaded conversation by topic/guild | not built |
| **Profiles** | Member identity, guild, activity, opt-in directory | partial (muster record) |
| **Events** | Muster calendar, RSVP, recordings | reads `events`; empty |
| **Guilds** | Guild pages, members, projects, blueprints | marketing copy only |
| **Games** | Small browser games, optional leaderboards | not built |
| **Chain** | Treasury view, proposals, votes, Safe actions | read-only treasury exists |

## 3. Data model — proposed additions

All new tables follow the existing standard: versioned SQL migration, RLS enabled, public
reads only for published content, ownership checks for member rows, no PII on-chain.

```text
resources            id, slug, title, summary, body, kind, guild, published, created_at
learning_paths       id, slug, title, summary, level, published
lessons              id, path_id, position, title, body, minutes
lesson_progress      member_id, lesson_id, completed_at            (owner-only)
threads              id, slug, title, category, author_id, status, created_at, last_post_at
posts                id, thread_id, author_id, body, created_at, edited_at, status
reactions            post_id, member_id, kind                      (unique per member)
profiles             member_id, headline, bio, links, visibility    (owner-write)
game_scores          game, member_id, score, created_at             (opt-in leaderboard)
```

RLS sketch:

- `resources`, `learning_paths`, `lessons`, `threads` (status = 'published'), `posts`
  (status = 'published'): public `SELECT`.
- `lesson_progress`, `profiles`: owner-only read/write; profiles optionally public when
  `visibility = 'public'`.
- `posts`, `threads`: insert requires `auth.uid() = author_id` and a non-suspended member.
- `game_scores`: insert owner-only, public read only when the member opts in.
- Moderation fields (`status`, `locked_by`, `removed_reason`) are written by staff roles,
  never by the author.

## 4. Sequencing

### Phase A — identity and profile (foundation)

- Profile page reading the member row; edit headline/bio/links; opt-in public directory.
- Public member directory with guild filter, no email exposure.
- Acceptance: a member can sign in, edit a profile, and choose whether it is listed.

### Phase B — resources and education (content)

- Resource library with categories, search, and a 68-character reading column.
- Learning paths with ordered lessons and per-member progress.
- Content source decision: Supabase tables (structured, queryable) vs headless WordPress
  (editorial workflow). Recommendation: WordPress for long-form editorial, Supabase for
  structured resources and progress. Do not run two sources for the same object.
- Acceptance: publish a resource without a deploy; progress survives sign-out.

### Phase C — discussions (community)

- Categories mirror the Code and guilds. Thread list, thread view, flat replies, composer.
- Rate limits and a report path from day one. Email notifications via the existing
  Emailit edge function, opt-in per thread.
- Acceptance: a member can post, edit their own post, and mute notifications.

### Phase D — games (delight)

- One small, self-contained game first (e.g. a navigation puzzle or a code-quiz), served as
  a lazy route with no wallet requirement.
- Canvas/CRT treatment is allowed to cover the game surface only.
- Optional leaderboard is opt-in and stores a score, not a behaviour trace.
- Acceptance: playable at 375 px, no PII, no third-party SDK.

### Phase E — chain features (careful)

- Read-only first: treasury balance, ledger rows, proposal results.
- Writes only through the Safe flow with published thresholds and a human-readable
  transaction preview. No browser-held keys beyond the member's own wallet.
- Acceptance: every on-chain action is previewable and cancellable before signature.

## 5. API and security constraints

- Writes go through Cloudflare Pages Functions (`/functions/api/*`) or Supabase RLS with the
  member's own JWT. Never ship a service-role key.
- Every new endpoint needs: CORS allowlist, per-IP rate limit, payload cap, input
  validation, and a standard JSON error shape.
- New tables ship with migrations and RLS in the same commit. No dashboard DDL.
- No third-party embeds that set cookies. Video, if added, is self-hosted or privacy-mode.
- Moderation and deletion must be real: a removed post is removed for readers, not hidden
  in the client.

## 6. Design implications

- Reuse the Stage 1 primitives: `.apf-card`, `.apf-btn`, `.apf-kicker`, `.apf-lede`.
- Lists and threads are dense; typography and spacing carry them, not decoration.
- Terminal voice belongs to system status and metadata, not to every heading.
- Every empty state says why it is empty and what will fill it.
- Mobile-first: 375 px is the default review width, not an afterthought.

## 7. Open decisions for the brand owner

1. Content source of record for editorial vs structured resources.
2. Real names, stable pseudonyms, or per-room anonymity? (Recommendation: stable pseudonym.)
3. Who moderates, and how are moderators appointed and removed?
4. Whether games carry any reward (reputation, badges) or stay purely for fun.
5. Whether member dues and crypto contributions ever unlock features, or remain separate.
6. Public directory: opt-in per member, or guild-level only?

None of these block Phase A; all of them change the shape of Phase C.
