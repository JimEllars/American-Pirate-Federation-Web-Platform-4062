import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../lib/api/supabaseClient';
import { useAPFContract } from '../hooks/useAPFContract';

/**
 * /ledger — the treasury ledger and the pay ratio explorer (SOP Playbook D).
 *
 * Both panels are read-only by design (Architectural Law 2): card money goes to APF Action
 * through Stripe, crypto and dues go to the Arbitrum Safe, and nothing in this frontend can
 * move either. Both panels render an empty state when their backing table has no rows.
 *
 * The pay ratio explorer in particular must never estimate. A pay ratio is a figure a
 * company filed with the SEC under Item 402(u) of Regulation S-K; if no such filing has
 * been ingested, the honest answer is "none", with a route to the actual filing on EDGAR.
 */

const TABS = [
  { id: 'treasury', label: 'Treasury' },
  { id: 'pay-ratio', label: 'Pay Ratio' }
];

const edgarSearchUrl = (query) =>
  `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(query)}&forms=DEF%2014A`;

export function Ledger({ initialTab = 'treasury' }) {
  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab : 'treasury');
  const { treasuryBalance, isLoadingBalance, isConfigured } = useAPFContract();

  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementsError, setSettlementsError] = useState(null);

  const [ratios, setRatios] = useState([]);
  const [ratiosLoading, setRatiosLoading] = useState(true);
  const [ticker, setTicker] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('ledger')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        if (isMounted) setSettlements(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setSettlementsError(err?.message || 'unavailable');
      } finally {
        if (isMounted) setSettlementsLoading(false);
      }
    };

    const loadRatios = async () => {
      try {
        // No pay_ratio table exists yet, and no filing has been ingested. A missing table is
        // not an error worth shouting about — it is the same fact as an empty one.
        const { data, error } = await supabase.from('pay_ratios').select('*').limit(50);
        if (error) throw error;
        if (isMounted) setRatios(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setRatios([]);
      } finally {
        if (isMounted) setRatiosLoading(false);
      }
    };

    load();
    loadRatios();
    return () => { isMounted = false; };
  }, []);

  const treasuryAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const lookupUrl = useMemo(
    () => edgarSearchUrl(`${ticker.trim() || ''} pay ratio`.trim()),
    [ticker]
  );

  return (
    <Layout>
      <SEO
        title="The Ledger | Treasury & Pay Ratio"
        description="Read-only view of the APF treasury ledger and the corporate pay ratio explorer, which cites SEC Form DEF 14A filings and nothing else."
      />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Database" className="h-10 w-10 text-apf-emerald shrink-0" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-vt323 break-words">
                The Ledger
              </h1>
            </div>
            <p className="max-w-3xl text-gray-400 font-sans text-lg border-l-2 border-apf-emerald pl-6">
              Every figure here is cited or absent. The treasury panel reads an on-chain Safe
              and never writes to it; the pay ratio panel reads filings and never estimates
              one.
            </p>
          </div>

          <div role="tablist" aria-label="Ledger sections" className="flex flex-wrap gap-2 mb-8">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                role="tab"
                id={`ledger-tab-${entry.id}`}
                aria-selected={tab === entry.id}
                aria-controls={`ledger-panel-${entry.id}`}
                onClick={() => setTab(entry.id)}
                className={`px-4 py-2 font-vt323 uppercase tracking-widest text-sm border transition-colors ${
                  tab === entry.id
                    ? 'bg-apf-emerald/20 border-apf-emerald text-apf-emerald'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-apf-emerald/50'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {tab === 'treasury' && (
            <section
              role="tabpanel"
              id="ledger-panel-treasury"
              aria-labelledby="ledger-tab-treasury"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-1 bg-black/40 border border-white/10 p-5 font-vt323">
                <h2 className="text-apf-emerald uppercase tracking-widest text-sm mb-4 border-b border-gray-800 pb-2">
                  [ Safe — Read Only ]
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 uppercase text-xs tracking-widest">Custody</dt>
                    <dd className="text-white">Arbitrum One Safe multisig</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 uppercase text-xs tracking-widest">Address</dt>
                    <dd className="text-white break-all">
                      {isConfigured ? treasuryAddress : 'NOT CONFIGURED'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 uppercase text-xs tracking-widest">Contract balance</dt>
                    <dd className="text-white">
                      {isLoadingBalance
                        ? '[ READING CHAIN… ]'
                        : isConfigured
                          ? String(treasuryBalance)
                          : '0.00'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 uppercase text-xs tracking-widest">Signing authority</dt>
                    <dd className="text-gray-400 font-sans text-xs leading-relaxed">
                      Owner signatures on the Safe. The signer threshold is not published in
                      this repository, so this page does not claim one.
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-gray-500 font-sans leading-relaxed border-t border-gray-800 pt-3">
                  This site holds no key that can move these funds. There is no transfer,
                  approve or withdraw control anywhere in the client bundle.
                </p>
              </div>

              <div className="lg:col-span-2 bg-black/40 border border-white/10 p-5">
                <h2 className="font-vt323 text-apf-emerald uppercase tracking-widest text-sm mb-4 border-b border-gray-800 pb-2">
                  [ Settlements ]
                </h2>

                {settlementsLoading ? (
                  <p className="font-vt323 text-gray-400 animate-pulse">[ QUERYING LEDGER TABLE… ]</p>
                ) : settlements.length === 0 ? (
                  <div className="border border-dashed border-gray-800 p-6 text-center">
                    <SafeIcon name="FileText" className="mx-auto h-8 w-8 text-gray-600 mb-3" />
                    <p className="font-vt323 text-gray-300 uppercase tracking-widest mb-2">
                      No settlements recorded
                    </p>
                    <p className="font-sans text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
                      Entries appear here only after an on-chain transaction is confirmed and
                      the treasury operator appends it. The frontend is not a writer
                      {settlementsError ? ' — and the ledger query is currently unavailable' : ''}.
                      Nothing is listed speculatively.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800 font-vt323 text-sm">
                    {settlements.map((row) => (
                      <li key={row.id ?? `${row.tx_hash}-${row.created_at}`} className="py-2 flex flex-wrap justify-between gap-2">
                        <span className="text-gray-300 break-all">{row.description ?? row.tx_hash ?? 'UNLABELLED ENTRY'}</span>
                        <span className="text-apf-emerald">{row.amount ?? ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {tab === 'pay-ratio' && (
            <section
              role="tabpanel"
              id="ledger-panel-pay-ratio"
              aria-labelledby="ledger-tab-pay-ratio"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 bg-black/40 border border-white/10 p-5">
                <h2 className="font-vt323 text-apf-emerald uppercase tracking-widest text-sm mb-4 border-b border-gray-800 pb-2">
                  [ Ingested Filings ]
                </h2>

                {ratiosLoading ? (
                  <p className="font-vt323 text-gray-400 animate-pulse">[ QUERYING FILINGS… ]</p>
                ) : ratios.length === 0 ? (
                  <div className="border border-dashed border-gray-800 p-6 text-center">
                    <SafeIcon name="FileText" className="mx-auto h-8 w-8 text-gray-600 mb-3" />
                    <p className="font-vt323 text-gray-300 uppercase tracking-widest mb-2">
                      No verified filings ingested
                    </p>
                    <p className="font-sans text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
                      A pay ratio is a company&apos;s own disclosure under Item 402(u) of
                      Regulation S-K: the CEO&apos;s annual total compensation divided by the
                      median employee&apos;s. This explorer ranks only filings that have been
                      ingested with their accession number attached. Zero rows means zero
                      figures — we do not build an estimate to fill the grid.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800 font-vt323 text-sm">
                    {ratios.map((row) => (
                      <li key={row.id} className="py-2 flex flex-wrap justify-between gap-2">
                        <span className="text-gray-300">
                          {row.company ?? row.ticker} — {row.ratio}:1
                        </span>
                        <span className="text-gray-500">DEF 14A {row.accession_number}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="lg:col-span-1 bg-black/40 border border-apf-purple/30 p-5 font-vt323">
                <h2 className="text-apf-purple uppercase tracking-widest text-sm mb-4 border-b border-gray-800 pb-2">
                  [ Read The Filing ]
                </h2>
                <label htmlFor="ledger-ticker" className="block text-gray-300 uppercase text-xs tracking-widest mb-2">
                  Ticker or company
                </label>
                <input
                  id="ledger-ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="e.g. AAPL"
                  className="w-full bg-black/60 border border-gray-800 px-3 py-2 text-white text-sm mb-3 focus:outline-none focus:border-apf-purple transition-colors"
                />
                <a
                  href={lookupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-apf-purple hover:bg-apf-purpleLight text-white uppercase tracking-widest text-sm transition-colors"
                >
                  <SafeIcon name="ExternalLink" className="h-4 w-4" /> Open on SEC EDGAR
                </a>
                <p className="mt-4 text-xs text-gray-500 font-sans leading-relaxed border-t border-gray-800 pt-3">
                  Opens EDGAR full-text search for DEF 14A filings matching your query. The
                  filing is the source; this site is a reader.
                </p>
              </div>
            </section>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
