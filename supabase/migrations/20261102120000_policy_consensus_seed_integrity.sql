-- =============================================================================
-- APF Platform — Policy Consensus Seed Integrity
-- Date: 2026-11-02
--
-- Problem this migration repairs
-- ------------------------------
-- `20261024000000_apf_core_schema.sql` seeded the fourteen official protocols with:
--
--     INSERT ... ON CONFLICT (policy_code) DO NOTHING;
--
-- `DO NOTHING` makes the seed write-once. If the rows already exist — or if anything
-- later edits them — re-running the migration is a no-op and the seed can never correct
-- itself. On 2026-11-02 the production table (project xzdgytloaczpzmtflenl) held fourteen
-- rows whose titles, themes and scores matched the Federation's doctrine in ZERO cases:
-- APF-001 read "Direct Democracy Architecture" instead of "The Zero-Data Protocol", and
-- APF-012 carried a 99.0 score instead of 87.0. The public /policies page renders this
-- table directly, so the site was publishing another organisation's policy platform.
--
-- This migration is the correcting seed:
--   1. it UPSERTs the canonical fourteen (doctrine, not the drifted rows), and
--   2. it records provenance, because these scores are a founding-draft baseline and not
--      the result of a member ballot (SOP Law 1; see audit §A3).
--
-- Idempotent: safe to re-run. `published_at_consensus` stays NULL until a real vote runs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Provenance column
-- -----------------------------------------------------------------------------
ALTER TABLE public.policy_consensus
  ADD COLUMN IF NOT EXISTS provenance TEXT NOT NULL DEFAULT 'founding-draft';

COMMENT ON COLUMN public.policy_consensus.provenance IS
  'Origin of consensus_score: founding-draft (seeded, no ballot yet), member-vote (derived from public.votes), imported. Only member-vote may be presented as community consensus.';

ALTER TABLE public.policy_consensus
  ADD COLUMN IF NOT EXISTS first_ballot_at TIMESTAMPTZ;

COMMENT ON COLUMN public.policy_consensus.first_ballot_at IS
  'Timestamp of the first counted member ballot for this protocol. NULL means the score is still a founding-draft baseline.';

-- A score outside 0–100 is never a valid consensus figure.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'policy_consensus_score_range'
  ) THEN
    ALTER TABLE public.policy_consensus
      ADD CONSTRAINT policy_consensus_score_range
      CHECK (consensus_score >= 0 AND consensus_score <= 100);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Canonical seed — doctrine of record (APF Master Strategy Plan §3.2)
-- -----------------------------------------------------------------------------
INSERT INTO public.policy_consensus
  (policy_code, title, summary, theme, reference, consensus_score, status, last_revision, provenance)
VALUES
  ('APF-001', 'The Zero-Data Protocol',
   'Complete eradication of targeted data harvesting across all federation assets.',
   'Data Sovereignty', '4th Amendment', 94.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-002', 'The Fleet Mutual Aid Pact',
   'Protocol for resource sharing and legal defense of federation members under state pressure.',
   'Mutual Aid', 'Preamble', 88.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-003', 'Decentralized Governance Draft',
   'Direct liquid democracy for all key federation directives and resource allocations.',
   'Direct Democracy', 'Article I, Section 1', 92.5, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-004', 'Intellectual Property Abolition',
   'Systematic sunsetting of software and pharmaceutical patents to promote commons technology.',
   'Open Source Infrastructure', 'Article I, Section 8', 86.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-005', 'Corporate Housing Nullification Act',
   'Prohibition of corporate and algorithmic ownership of single-family housing.',
   'Housing Sovereignty', '9th Amendment', 96.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-006', 'Universal Sustenance Guarantee',
   'Baseline public rights guarantee for clean drinking water and foundational nutrition.',
   'Resource Security', 'Preamble', 95.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-007', 'Green Transit & Energy Transition Accord',
   'Commitment of federation resources toward decentralized renewable microgrids.',
   'Energy Autonomy', 'Article I, Section 8', 91.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-008', 'The 1950s Tax Restoration Act',
   'Restoration of top marginal individual and corporate tax brackets to 1950s levels.',
   'Economic Equity', '16th Amendment', 89.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-009', 'The Collective Labor Protection Mandate',
   'Federal bans on union-busting and mandatory worker representation on corporate boards.',
   'Labor Assembly', '1st Amendment', 93.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-010', 'Open Generations Education Protocol',
   'Tuition-free public universities and complete cancellation of predatory student debt.',
   'Education Access', '1st Amendment', 91.5, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-011', 'The Public Servant Accountability Directive',
   'Lifetime ban on corporate lobbying for former elected officials and immediate end to Citizens United.',
   'Anti-Corruption', 'Article I, Section 9', 98.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-012', 'Generational Stewardship & Competency Cap',
   'Upper age limits and term limits for federal judicial and congressional seats.',
   'Systemic Reform', '22nd Amendment', 87.0, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-013', 'Industrial Infrastructure Permitting Sovereignty',
   'Local binding referendum requirements prior to data center or heavy industrial grid hookups.',
   'Civic Permitting', 'General Welfare', 84.5, 'Active', DATE '2026-11-01', 'founding-draft'),
  ('APF-014', 'Corporate Free Reign Nullification Act',
   'Termination of corporate personhood and full criminal liability for executive misconduct.',
   'Corporate Reform', 'Commerce Clause', 97.0, 'Active', DATE '2026-11-01', 'founding-draft')
ON CONFLICT (policy_code) DO UPDATE SET
  title           = EXCLUDED.title,
  summary         = EXCLUDED.summary,
  theme           = EXCLUDED.theme,
  reference       = EXCLUDED.reference,
  consensus_score = EXCLUDED.consensus_score,
  status          = EXCLUDED.status,
  last_revision   = EXCLUDED.last_revision,
  -- Provenance is only downgraded back to 'founding-draft' for rows that have no ballot.
  -- A protocol that has already been voted on keeps its member-vote provenance.
  -- The existing row is referenced by bare table name, which is the form documented for
  -- ON CONFLICT DO UPDATE (the other legal reference being the EXCLUDED pseudo-table).
  provenance      = CASE
                      WHEN policy_consensus.first_ballot_at IS NULL THEN EXCLUDED.provenance
                      ELSE policy_consensus.provenance
                    END;

-- -----------------------------------------------------------------------------
-- 3. Verification — fail loudly instead of publishing a half-correct platform
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  rows_total  INTEGER;
  rows_active INTEGER;
  rows_draft  INTEGER;
BEGIN
  SELECT count(*),
         count(*) FILTER (WHERE status = 'Active'),
         count(*) FILTER (WHERE provenance = 'founding-draft')
    INTO rows_total, rows_active, rows_draft
  FROM public.policy_consensus;

  IF rows_total <> 14 THEN
    RAISE EXCEPTION 'policy_consensus must hold exactly the 14 protocols, found %', rows_total;
  END IF;

  IF rows_active <> 14 THEN
    RAISE EXCEPTION 'expected 14 Active protocols, found %', rows_active;
  END IF;

  RAISE NOTICE 'policy_consensus verified: % protocols, % founding-draft (no ballot yet).',
    rows_total, rows_draft;
END $$;
