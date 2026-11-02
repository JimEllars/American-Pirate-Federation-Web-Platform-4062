-- =============================================================================
-- APF Platform — RLS Ground Truth
-- Date: 2026-11-02
--
-- Closes four access-control defects found in the 2026-11-01 repository audit.
-- All statements are idempotent so this migration is safe to re-run.
--
--   1. `votes` had an INSERT policy and no SELECT policy. Votes could be cast
--      but never read, so no tally could ever be produced at the database layer.
--   2. `requisitions` had RLS enabled and zero policies, making the table
--      unreachable for every role including its owner. Shop checkout could not work.
--   3. `transmissions` was world-readable (`USING (true)`) with no classification
--      filter, so any anonymous visitor holding the public anon key could read
--      every row regardless of `classification`, including `encrypted_content`.
--   4. `proposals` was world-readable including drafts, and `event_signals` had no
--      SELECT policy at all.
--
-- Design rule applied (SOP Playbook A): user records are ownership-scoped to
-- `auth.uid()`. Public read is granted only for material that is published.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. votes — ownership-scoped reads + a privacy-preserving aggregate tally
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members read own votes" ON public.votes;
CREATE POLICY "Members read own votes"
  ON public.votes
  FOR SELECT
  USING (auth.uid() = member_id);

-- The ballot box stays secret: no role can read other members' individual votes.
-- Aggregate counts are exposed through a view owned by the migration role, which
-- bypasses RLS on the underlying table. `security_invoker = false` is explicit so
-- the behaviour does not change if the project default flips (PostgreSQL 15+).
CREATE OR REPLACE VIEW public.vote_tally
WITH (security_invoker = false) AS
SELECT
  v.proposal_id,
  COUNT(*) FILTER (WHERE v.vote = 'FOR')     AS votes_for,
  COUNT(*) FILTER (WHERE v.vote = 'AGAINST') AS votes_against,
  COUNT(*) FILTER (WHERE v.vote = 'ABSTAIN') AS votes_abstain,
  COUNT(*)                                   AS total_votes
FROM public.votes v
GROUP BY v.proposal_id;

COMMENT ON VIEW public.vote_tally IS
  'Aggregate-only vote counts. Individual ballots remain readable solely by their author.';

GRANT SELECT ON public.vote_tally TO anon, authenticated;

CREATE INDEX IF NOT EXISTS votes_proposal_id_idx ON public.votes (proposal_id);


-- -----------------------------------------------------------------------------
-- 2. requisitions — own-row access (shop checkout)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members read own requisitions" ON public.requisitions;
CREATE POLICY "Members read own requisitions"
  ON public.requisitions
  FOR SELECT
  USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Members create own requisitions" ON public.requisitions;
CREATE POLICY "Members create own requisitions"
  ON public.requisitions
  FOR INSERT
  WITH CHECK (auth.uid() = member_id);

-- Deliberately no UPDATE/DELETE policy: status transitions and Stripe session IDs are
-- written server-side by the edge function using the service role, never by the client.

CREATE INDEX IF NOT EXISTS requisitions_member_id_idx ON public.requisitions (member_id);


-- -----------------------------------------------------------------------------
-- 3. transmissions — classification-gated public read
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read transmissions" ON public.transmissions;

DROP POLICY IF EXISTS "Public read published transmissions" ON public.transmissions;
CREATE POLICY "Public read published transmissions"
  ON public.transmissions
  FOR SELECT
  USING (classification = 'PUBLIC');

-- Signed-in crew may additionally read material classified MEMBERS. Anything higher
-- ('OFFICERS', 'CLASSIFIED', ...) is reachable only via the service role.
DROP POLICY IF EXISTS "Members read member transmissions" ON public.transmissions;
CREATE POLICY "Members read member transmissions"
  ON public.transmissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND classification = 'MEMBERS');


-- -----------------------------------------------------------------------------
-- 4. proposals — drafts are not public
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read proposals" ON public.proposals;

DROP POLICY IF EXISTS "Public read published proposals" ON public.proposals;
CREATE POLICY "Public read published proposals"
  ON public.proposals
  FOR SELECT
  USING (status <> 'draft');

DROP POLICY IF EXISTS "Authors read own proposals" ON public.proposals;
CREATE POLICY "Authors read own proposals"
  ON public.proposals
  FOR SELECT
  USING (auth.uid() = author_id);


-- -----------------------------------------------------------------------------
-- 5. event_signals — members can read their own RSVPs
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members read own signals" ON public.event_signals;
CREATE POLICY "Members read own signals"
  ON public.event_signals
  FOR SELECT
  USING (auth.uid() = member_id);


-- -----------------------------------------------------------------------------
-- 6. Verification helper
-- -----------------------------------------------------------------------------
-- Every table exposed through the PostgREST API must have RLS enabled. This DO block
-- fails the migration loudly if any table in the public schema was created without it.
DO $$
DECLARE
  unprotected text;
BEGIN
  SELECT string_agg(c.relname, ', ')
    INTO unprotected
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false;

  IF unprotected IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is not enabled on: %', unprotected;
  END IF;
END $$;
