/**
 * Doctrine of record — the fourteen official APF protocols (APF-001 … APF-014).
 *
 * Why this file exists
 * --------------------
 * The live `policy_consensus` table is not authoritative on its own. On 2026-11-02 it held
 * fourteen rows whose titles, themes and scores matched Federation doctrine in zero cases
 * (APF-001 read "Direct Democracy Architecture" instead of "The Zero-Data Protocol"). The
 * public /policies page rendered that table directly, so pirateusa.org published another
 * organisation's policy platform.
 *
 * The fix is not to trust the network harder, and it is not to hardcode a prettier lie. It
 * is to keep the doctrine in one reviewable place, reconcile the live table against it, and
 * say out loud when the two disagree — see `reconcilePolicyRows` below. The API read stays;
 * it just stops being able to overwrite the platform with foreign text.
 *
 * Mirror: `supabase/migrations/20261102120000_policy_consensus_seed_integrity.sql` writes
 * these same values into Postgres. When doctrine changes, both change in the same commit —
 * the SQL is the write path, this file is the read path and the divergence detector.
 *
 * `foundingConsensus` is a founding-draft baseline, not a ballot result. Only a row whose
 * `provenance` is `member-vote` (and which has a `first_ballot_at`) may be presented as
 * community consensus (Architectural Law 1).
 */

export const DOCTRINE_VERSION = '2026-11-01';

export const CANONICAL_POLICIES = [
  {
    code: 'APF-001',
    title: 'The Zero-Data Protocol',
    summary: 'Complete eradication of targeted data harvesting across all federation assets.',
    theme: 'Data Sovereignty',
    reference: '4th Amendment',
    foundingConsensus: 94.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-002',
    title: 'The Fleet Mutual Aid Pact',
    summary: 'Protocol for resource sharing and legal defense of federation members under state pressure.',
    theme: 'Mutual Aid',
    reference: 'Preamble',
    foundingConsensus: 88.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-003',
    title: 'Decentralized Governance Draft',
    summary: 'Direct liquid democracy for all key federation directives and resource allocations.',
    theme: 'Direct Democracy',
    reference: 'Article I, Section 1',
    foundingConsensus: 92.5,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-004',
    title: 'Intellectual Property Abolition',
    summary: 'Systematic sunsetting of software and pharmaceutical patents to promote commons technology.',
    theme: 'Open Source Infrastructure',
    reference: 'Article I, Section 8',
    foundingConsensus: 86.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-005',
    title: 'Corporate Housing Nullification Act',
    summary: 'Prohibition of corporate and algorithmic ownership of single-family housing.',
    theme: 'Housing Sovereignty',
    reference: '9th Amendment',
    foundingConsensus: 96.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-006',
    title: 'Universal Sustenance Guarantee',
    summary: 'Baseline public rights guarantee for clean drinking water and foundational nutrition.',
    theme: 'Resource Security',
    reference: 'Preamble',
    foundingConsensus: 95.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-007',
    title: 'Green Transit & Energy Transition Accord',
    summary: 'Commitment of federation resources toward decentralized renewable microgrids.',
    theme: 'Energy Autonomy',
    reference: 'Article I, Section 8',
    foundingConsensus: 91.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-008',
    title: 'The 1950s Tax Restoration Act',
    summary: 'Restoration of top marginal individual and corporate tax brackets to 1950s levels.',
    theme: 'Economic Equity',
    reference: '16th Amendment',
    foundingConsensus: 89.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-009',
    title: 'The Collective Labor Protection Mandate',
    summary: 'Federal bans on union-busting and mandatory worker representation on corporate boards.',
    theme: 'Labor Assembly',
    reference: '1st Amendment',
    foundingConsensus: 93.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-010',
    title: 'Open Generations Education Protocol',
    summary: 'Tuition-free public universities and complete cancellation of predatory student debt.',
    theme: 'Education Access',
    reference: '1st Amendment',
    foundingConsensus: 91.5,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-011',
    title: 'The Public Servant Accountability Directive',
    summary: 'Lifetime ban on corporate lobbying for former elected officials and immediate end to Citizens United.',
    theme: 'Anti-Corruption',
    reference: 'Article I, Section 9',
    foundingConsensus: 98.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-012',
    title: 'Generational Stewardship & Competency Cap',
    summary: 'Upper age limits and term limits for federal judicial and congressional seats.',
    theme: 'Systemic Reform',
    reference: '22nd Amendment',
    foundingConsensus: 87.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-013',
    title: 'Industrial Infrastructure Permitting Sovereignty',
    summary: 'Local binding referendum requirements prior to data center or heavy industrial grid hookups.',
    theme: 'Civic Permitting',
    reference: 'General Welfare',
    foundingConsensus: 84.5,
    status: 'Active',
    lastRevision: '2026-11-01'
  },
  {
    code: 'APF-014',
    title: 'Corporate Free Reign Nullification Act',
    summary: 'Termination of corporate personhood and full criminal liability for executive misconduct.',
    theme: 'Corporate Reform',
    reference: 'Commerce Clause',
    foundingConsensus: 97.0,
    status: 'Active',
    lastRevision: '2026-11-01'
  }
];

const asText = (value) => (typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value));

const asScore = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
};

/**
 * Reconcile the live `policy_consensus` rows against the doctrine of record.
 *
 * Contract:
 *   - The published title, summary, theme, reference and status are ALWAYS doctrine. A
 *     remote row can never rename the Federation's platform.
 *   - The published score comes from the row ONLY when that row is a counted member vote
 *     (`provenance === 'member-vote'` and `first_ballot_at` set). Otherwise the published
 *     score is the founding-draft baseline, labelled as such.
 *   - Every place the live row disagrees is returned in `divergences`, so the page can show
 *     an operator-facing notice instead of quietly serving one of the two versions.
 *
 * @param {Array<object>|null} rows rows from `policy_consensus` (snake_case columns)
 * @returns {{policies: Array<object>, divergences: Array<object>, source: string}}
 */
export function reconcilePolicyRows(rows) {
  const live = Array.isArray(rows) ? rows.filter((r) => r && r.policy_code) : [];
  const byCode = new Map(live.map((r) => [asText(r.policy_code).toUpperCase(), r]));
  const divergences = [];

  const policies = CANONICAL_POLICIES.map((canon) => {
    const row = byCode.get(canon.code);
    const base = { ...canon, source: 'doctrine', provenance: 'founding-draft', consensus: canon.foundingConsensus };

    if (!row) {
      if (live.length > 0) {
        divergences.push({ code: canon.code, field: 'row', expected: 'present', actual: 'missing' });
      }
      return base;
    }

    const checks = [
      ['title', asText(row.title), canon.title],
      ['summary', asText(row.summary), canon.summary],
      ['theme', asText(row.theme), canon.theme],
      ['reference', asText(row.reference), canon.reference],
      ['status', asText(row.status), canon.status]
    ];

    for (const [field, actual, expected] of checks) {
      if (actual && actual !== expected) {
        divergences.push({ code: canon.code, field, expected, actual });
      }
    }

    const isCountedBallot = row.provenance === 'member-vote' && Boolean(row.first_ballot_at);
    const liveScore = asScore(row.consensus_score);

    if (!isCountedBallot && liveScore !== null && liveScore !== canon.foundingConsensus) {
      divergences.push({
        code: canon.code,
        field: 'consensus_score',
        expected: String(canon.foundingConsensus),
        actual: String(liveScore)
      });
    }

    return {
      ...base,
      provenance: isCountedBallot ? 'member-vote' : 'founding-draft',
      consensus: isCountedBallot && liveScore !== null ? liveScore : canon.foundingConsensus,
      source: 'reconciled'
    };
  });

  // Rows the doctrine does not know about are the loudest possible signal that the table is
  // publishing something else entirely. Report them rather than rendering them.
  const known = new Set(CANONICAL_POLICIES.map((p) => p.code));
  for (const row of live) {
    const code = asText(row.policy_code).toUpperCase();
    if (!known.has(code)) {
      divergences.push({ code, field: 'row', expected: 'not published', actual: asText(row.title) });
    }
  }

  return {
    policies,
    divergences,
    source: live.length === 0 ? 'doctrine-only (no live rows)' : 'reconciled'
  };
}

/**
 * Human-readable summary of a divergence set, for the operator notice on /policies.
 */
export function summarizeDivergences(divergences) {
  const list = Array.isArray(divergences) ? divergences : [];
  const codes = [...new Set(list.map((d) => d.code))];
  const fields = [...new Set(list.map((d) => d.field))];
  return { count: list.length, codes, fields };
}
