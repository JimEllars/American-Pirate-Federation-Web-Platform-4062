/**
 * Article XIV — the Great Balance mechanism, as specified.
 *
 * Parameters are fixed by SOP Playbook D and Article XIV of The Pirate Code:
 *
 *   phase-out floor         $40,000 individual / $60,000 married filing jointly
 *   negative income tax     33% of the gap between household income and the floor
 *   dependent allowance     $400 per child per month ($4,800 per child per year)
 *
 * What this module deliberately does NOT do: invent anything beyond those three numbers.
 * It does not estimate a national cost, a participation rate, a funding source or a
 * distribution date — none of those are in the Article, and a frontend that renders them
 * is doing exactly what Law 1 forbids. The composition (how the floor, the rate and the
 * allowance combine) is published in docs/article-xiv-methodology.md and is reproducible
 * from the arithmetic below; the page shows the formula so a reader can check it by hand.
 *
 * Pure functions, integer cents internally where it matters, no I/O, no randomness.
 */

export const ARTICLE_XIV = {
  article: 'XIV',
  version: '1.0.0',
  floor: {
    single: 40000,
    married: 60000
  },
  nitRate: 0.33,
  childAllowance: {
    monthly: 400,
    annual: 4800
  },
  filingStatuses: ['single', 'married']
};

const clampIncome = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
};

const clampChildren = (value) => {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(12, Math.max(0, n));
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * @param {number} annualIncome household income before the subsidy, in dollars
 * @param {'single'|'married'} filingStatus
 * @param {number} children dependents under 18
 */
export function computeGreatBalance(annualIncome, filingStatus = 'single', children = 0) {
  const status = ARTICLE_XIV.filingStatuses.includes(filingStatus) ? filingStatus : 'single';
  const income = clampIncome(annualIncome);
  const dependents = clampChildren(children);
  const floor = ARTICLE_XIV.floor[status];

  const gap = Math.max(0, floor - income);
  const adultSubsidy = round2(gap * ARTICLE_XIV.nitRate);

  const childGross = dependents * ARTICLE_XIV.childAllowance.annual;
  const childPhaseOut = round2(Math.max(0, income - floor) * ARTICLE_XIV.nitRate);
  const childSubsidy = round2(Math.max(0, childGross - childPhaseOut));

  const annual = round2(adultSubsidy + childSubsidy);
  const monthly = round2(annual / 12);

  // The income at which a household's dependent allowance is fully recovered. Deterministic
  // and derived, never assumed: floor + gross allowance / rate.
  const childPhaseOutEndsAt = childGross > 0 ? round2(floor + childGross / ARTICLE_XIV.nitRate) : null;

  return {
    filingStatus: status,
    floor,
    income,
    dependents,
    gap,
    adultSubsidy,
    childGross,
    childPhaseOut,
    childSubsidy,
    annual,
    monthly,
    householdIncome: round2(income + annual),
    effectiveMarkup: income > 0 ? round2((annual / income) * 100) : null,
    childPhaseOutEndsAt,
    // Everything the page can say about a household that is already above the floor and has
    // no dependents: the Article pays nothing. Saying so is the point.
    receivesNothing: annual === 0
  };
}

/** Points for the response curve. Deterministic, user-visible, no sampling. */
export const CURVE_INCOMES = [0, 10000, 20000, 30000, 40000, 50000, 60000, 75000, 100000, 150000, 250000];

/**
 * Plain-text share card. SOP Playbook D asks for 1-click share output that is clean text
 * with no layout shift — so this is a string, not a rendered image, and the copy happens on
 * the user's click rather than on mount.
 */
export function buildShareText(result) {
  const statusLabel = result.filingStatus === 'married' ? 'married' : 'single';
  const kids = result.dependents === 1 ? '1 dependent' : `${result.dependents} dependents`;
  const money = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return [
    `Article XIV — the Great Balance, worked for a ${statusLabel} household at ${money(result.income)} with ${kids}:`,
    `${money(result.monthly)}/month (${money(result.annual)}/year).`,
    `Mechanism: 33% of the ${money(result.floor)} floor gap + ${money(ARTICLE_XIV.childAllowance.monthly)}/child/month, phased out at 33% above the floor.`,
    'Run your own numbers: https://pirateusa.org/calculator',
    'APF / The Pirate Code, Article XIV.'
  ].join('\n');
}
