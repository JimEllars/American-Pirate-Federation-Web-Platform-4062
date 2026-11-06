import React, { useMemo, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import {
  ARTICLE_XIV,
  CURVE_INCOMES,
  buildShareText,
  computeGreatBalance
} from '../lib/doctrine/articleXIV';

/**
 * The Great Balance Calculator — SOP Playbook D.
 *
 * Every number on this page is either a published Article XIV parameter or arithmetic on
 * the visitor's own input. There is no cost estimate, no participation rate, no "pirates
 * helped" counter: none of those exist in the backend, and Law 1 says render the honest
 * empty state instead of a plausible-looking figure.
 */

const usd = (n, opts = {}) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, ...opts });

const PRESETS = [
  { label: '$0', value: 0 },
  { label: '$25,000', value: 25000 },
  { label: '$60,000', value: 60000 },
  { label: '$150,000', value: 150000 }
];

export function Calculator() {
  const addToast = useAppStore((state) => state.addToast);
  const [incomeInput, setIncomeInput] = useState('32000');
  const [filingStatus, setFilingStatus] = useState('single');
  const [children, setChildren] = useState(0);

  // Negative or unparseable input is clamped to zero, never silently coerced into a
  // different household than the one on screen.
  const income = useMemo(() => {
    const parsed = Number(String(incomeInput).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }, [incomeInput]);

  const result = useMemo(
    () => computeGreatBalance(income, filingStatus, children),
    [income, filingStatus, children]
  );

  const negativeInput = Number(String(incomeInput).replace(/[^0-9.-]/g, '')) < 0;

  const curve = useMemo(
    () => CURVE_INCOMES.map((value) => ({ value, ...computeGreatBalance(value, filingStatus, children) })),
    [filingStatus, children]
  );

  const handleShare = async () => {
    const text = buildShareText(result);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        addToast('[ CALCULATOR: SUMMARY COPIED TO CLIPBOARD ]', 'success');
        return;
      }
      throw new Error('clipboard unavailable');
    } catch (err) {
      addToast('[ CALCULATOR: CLIPBOARD BLOCKED BY BROWSER - SELECT THE TEXT BELOW ]', 'warning');
    }
  };

  return (
    <Layout>
      <SEO
        title="The Great Balance Calculator | Article XIV"
        description="Work out what Article XIV of The Pirate Code would pay a household: a 33% negative income tax up to the $40,000 / $60,000 phase-out floor, plus $400 per child per month."
      />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="Percent"
            kicker="Article XIV"
            title="The Great Balance"
            lede={`Article XIV replaces the welfare cliff with a single negative income tax: 33% of the gap between a household's income and a ${usd(ARTICLE_XIV.floor.single)} / ${usd(ARTICLE_XIV.floor.married)} floor, plus ${usd(ARTICLE_XIV.childAllowance.monthly)} per child per month. Run your own household through it below.`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            {/* ---------------- Inputs ---------------- */}
            <section
              aria-labelledby="gb-inputs"
              className="apf-card p-5 sm:p-6 lg:col-span-2"
            >
              <h2 id="gb-inputs" className="mb-5 border-b border-white/[0.06] pb-3 text-base font-semibold text-white">Household</h2>

              <label htmlFor="gb-income" className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                Annual income (pre-subsidy)
              </label>
              <div className="mb-2 flex items-center rounded-lg border border-white/[0.1] bg-surface-950 focus-within:border-apf-purpleLight/60">
                <span className="pl-3 text-gray-500" aria-hidden="true">$</span>
                <input
                  id="gb-income"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1000"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  aria-describedby="gb-income-help"
                  className="w-full bg-transparent px-2 py-3 text-xl text-white focus:outline-none"
                />
              </div>
              <p id="gb-income-help" className={`text-xs mb-4 ${negativeInput ? 'text-amber-300' : 'text-gray-500'}`}>
                {negativeInput
                  ? 'Negative income is read as $0 — the Article pays on the gap, not on a debt.'
                  : 'Dollars per year, before any Article XIV payment.'}
              </p>

              <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Income presets">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setIncomeInput(String(preset.value))}
                    aria-pressed={income === preset.value}
                    className={`px-3 py-1.5 text-sm border transition-colors ${
                      income === preset.value
                        ? 'bg-apf-emerald text-black border-apf-emerald'
                        : 'bg-black/50 border-gray-800 text-gray-300 hover:border-apf-emerald/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <span className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                Filing status
              </span>
              <div className="grid grid-cols-2 gap-2 mb-6" role="group" aria-label="Filing status">
                {[
                  { id: 'single', label: 'Individual', floor: ARTICLE_XIV.floor.single },
                  { id: 'married', label: 'Married', floor: ARTICLE_XIV.floor.married }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFilingStatus(option.id)}
                    aria-pressed={filingStatus === option.id}
                    className={`px-3 py-2 text-sm border transition-colors ${
                      filingStatus === option.id
                        ? 'bg-apf-purple/20 border-apf-purple text-white'
                        : 'bg-black/50 border-gray-800 text-gray-400 hover:border-apf-purple/50'
                    }`}
                  >
                    <span className="block uppercase tracking-widest">{option.label}</span>
                    <span className="block text-xs text-gray-500">{usd(option.floor)} floor</span>
                  </button>
                ))}
              </div>

              <span className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                Dependent children
              </span>
              <div className="flex items-center gap-3" role="group" aria-label="Number of dependent children">
                <button
                  type="button"
                  onClick={() => setChildren((c) => Math.max(0, c - 1))}
                  disabled={children === 0}
                  aria-label="Remove one dependent"
                  className="h-10 w-10 border border-gray-800 bg-black/50 text-white text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-apf-emerald/50"
                >
                  −
                </button>
                <output aria-live="polite" className="text-2xl text-white w-10 text-center">
                  {children}
                </output>
                <button
                  type="button"
                  onClick={() => setChildren((c) => Math.min(12, c + 1))}
                  disabled={children === 12}
                  aria-label="Add one dependent"
                  className="h-10 w-10 border border-gray-800 bg-black/50 text-white text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-apf-emerald/50"
                >
                  +
                </button>
                <span className="text-xs text-gray-500">
                  {usd(ARTICLE_XIV.childAllowance.monthly)}/child/month
                </span>
              </div>
            </section>

            {/* ---------------- Result ---------------- */}
            <section
              aria-labelledby="gb-result"
              className="apf-card p-5 sm:p-6 lg:col-span-3"
            >
              <h2 id="gb-result" className="mb-5 border-b border-white/[0.06] pb-3 text-base font-semibold text-white">Article XIV payment</h2>

              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 mb-6">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-ink-dim">Per month</div>
                  <div
                    data-testid="gb-monthly"
                    className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl"
                  >
                    {usd(result.monthly)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-ink-dim">Per year</div>
                  <div data-testid="gb-annual" className="font-display text-2xl font-semibold tracking-tight text-emerald-300 sm:text-3xl">
                    {usd(result.annual)}
                  </div>
                </div>
              </div>

              <dl className="space-y-2 border-t border-white/[0.06] pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">
                    Income gap to the {usd(result.floor)} floor
                  </dt>
                  <dd className="text-white text-right">{usd(result.gap)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">
                    × {Math.round(ARTICLE_XIV.nitRate * 100)}% negative income tax
                  </dt>
                  <dd className="text-white text-right">{usd(result.adultSubsidy)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">
                    + {result.dependents} dependent{result.dependents === 1 ? '' : 's'} ×{' '}
                    {usd(ARTICLE_XIV.childAllowance.annual)}/year
                  </dt>
                  <dd className="text-white text-right">{usd(result.childGross)}</dd>
                </div>
                {result.childPhaseOut > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-400">
                      − allowance phase-out above the floor (33%)
                    </dt>
                    <dd className="text-amber-300 text-right">−{usd(result.childPhaseOut)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-gray-800 pt-2 mt-2">
                  <dt className="font-medium text-emerald-300">Annual payment</dt>
                  <dd className="text-apf-emerald text-right">{usd(result.annual)}</dd>
                </div>
              </dl>

              {result.receivesNothing && (
                <p className="mt-4 rounded-lg border border-white/[0.07] bg-surface-950/60 p-3 text-sm leading-relaxed text-ink-muted">
                  Above the floor with no dependents, Article XIV pays nothing — the mechanism
                  tops households up to the floor rather than paying everyone. That is the
                  Article working as written, not a missing result.
                </p>
              )}

              {result.childPhaseOutEndsAt !== null && (
                <p className="mt-4 text-xs leading-relaxed text-ink-dim">
                  This household&apos;s dependent allowance is fully phased out at{' '}
                  {usd(result.childPhaseOutEndsAt)} of income. Those dollars are not clipped
                  anywhere else — the floor is the only cliff the Article removes.
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleShare}
                  className="apf-btn apf-btn-primary"
                >
                  <SafeIcon name="Share2" className="h-4 w-4" /> Copy summary
                </button>
                <a
                  href={`https://pirateusa.org/policies`}
                  className="apf-btn apf-btn-ghost"
                >
                  <SafeIcon name="BookOpen" className="h-4 w-4" /> Read Article XIV
                </a>
              </div>
            </section>
          </div>

          {/* ---------------- Mechanism ---------------- */}
          <section aria-labelledby="gb-mechanism" className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="apf-card p-5 sm:p-6">
              <h2 id="gb-mechanism" className="mb-4 border-b border-white/[0.06] pb-3 text-base font-semibold text-white">The formula, verbatim</h2>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-ink-muted sm:text-sm">
{`floor       = married ? 60000 : 40000
gap         = max(0, floor - income)
adult       = 0.33 * gap
childGross  = children * 4800
childCut    = 0.33 * max(0, income - floor)
child       = max(0, childGross - childCut)
payment     = adult + child`}
              </pre>
              <p className="text-xs text-gray-500 font-sans mt-4 leading-relaxed">
                The three inputs — the floor, the 33% rate and the {usd(ARTICLE_XIV.childAllowance.monthly)}
                {' '}per-child allowance — are fixed by Article XIV. How they compose is published in
                the methodology note that ships with this page. Change either and you change the
                Article, not the calculator.
              </p>
            </div>

            <div className="apf-card p-5 sm:p-6">
              <h2 className="mb-4 border-b border-white/[0.06] pb-3 text-base font-semibold text-white">Response curve</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Article XIV annual payment at a range of household incomes, for the selected filing status and dependents
                  </caption>
                  <thead>
                    <tr className="text-gray-500 uppercase text-xs tracking-widest">
                      <th scope="col" className="text-left py-1 font-normal">Income</th>
                      <th scope="col" className="text-right py-1 font-normal">Per year</th>
                      <th scope="col" className="text-right py-1 font-normal">Per month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curve.map((point) => (
                      <tr
                        key={point.value}
                        className={`border-t border-gray-900 ${point.value === income ? 'bg-apf-emerald/10 text-apf-emerald' : 'text-gray-300'}`}
                      >
                        <td className="py-1.5">{usd(point.value)}</td>
                        <td className="py-1.5 text-right">{usd(point.annual)}</td>
                        <td className="py-1.5 text-right">{usd(point.monthly)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <p className="mt-8 text-xs text-gray-500 font-sans leading-relaxed max-w-3xl">
            This is an estimate of the Article XIV mechanism using published parameters. It is
            not a benefit determination, not tax advice, and not a government program — the
            Federation does not administer payments. Figures are exact arithmetic on your input;
            nothing here is sampled, averaged or modelled.
          </p>
        </div>
      </PageTransition>
    </Layout>
  );
}
