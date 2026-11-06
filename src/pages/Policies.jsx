import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import { PolicyCard } from '../components/sections/PolicyCard';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import { useAXiMHydration } from '../hooks/useAXiMHydration';
import { supabase } from '../lib/api/supabaseClient';
import { reconcilePolicyRows, summarizeDivergences, DOCTRINE_VERSION } from '../lib/doctrine/policies';


export function Policies() {
  const navigate = useNavigate();
  const { proposedAmendments, addToast, setIsCoreSynced } = useAppStore();
  const { fetchActiveProposals, fetchPolicyConsensus } = useAXiMHydration();
  const [activeDrafts, setActiveDrafts] = useState(proposedAmendments || []);
  // Doctrine first, not network first. The live table used to be able to rename every
  // protocol on this page; `reconcilePolicyRows` makes the table a corroborating source and
  // reports disagreement instead of publishing it (see src/lib/doctrine/policies.js).
  const [policyData, setPolicyData] = useState(() => reconcilePolicyRows(null));
  const [divergence, setDivergence] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCoreData = async () => {
      try {
        const { data: dbPolicies, error } = await supabase.from('policy_consensus').select('*');

        if (error) throw error;

        if (isMounted) {
          const reconciled = reconcilePolicyRows(dbPolicies);
          setPolicyData(reconciled);
          if (reconciled.divergences.length > 0) {
            setDivergence(summarizeDivergences(reconciled.divergences));
            addToast(
              `[ CONSENSUS TABLE DIVERGES FROM DOCTRINE: ${reconciled.divergences.length} FIELD(S) ]`,
              'warning'
            );
          } else {
            setDivergence(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          addToast('[ TELEMETRY INGRESS FAILED - DISPLAYING DOCTRINE OF RECORD ]', 'warning');
        }
      } finally {
        // PolicyCard renders a loading skeleton while isCoreSynced is false. The flag was
        // only ever set when rows came back, so an empty table (or an unreachable backend)
        // left all fourteen directives shimmering forever — a loading state that never
        // resolves reads as a broken page. Resolve it on every path.
        if (isMounted) setIsCoreSynced(true);
      }
    };

    loadCoreData();
    return () => { isMounted = false; };
  }, [fetchActiveProposals, fetchPolicyConsensus, addToast, setIsCoreSynced]);

  return (
    <Layout>
      <SEO title="Policies | American Pirate Federation" description="The legislative drafts and sovereign protocols of the American Pirate Federation." />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="BookOpen"
            kicker="The Pirate Code"
            title="Policies"
            lede="Sovereignty is not given; it is coded. These are the active foundational protocols and civic mandates governing the American Pirate Federation."
          />

          {divergence && (
            <div
              role="status"
              className="mb-8 border border-amber-500/40 bg-amber-500/5 p-4 font-vt323 text-sm text-amber-200"
            >
              <div className="uppercase tracking-widest text-amber-400 mb-1">
                [ CONSENSUS TABLE DIVERGES FROM DOCTRINE ]
              </div>
              <p className="font-sans text-gray-300 leading-relaxed">
                {divergence.count} field{divergence.count === 1 ? '' : 's'} across{' '}
                {divergence.codes.length} protocol{divergence.codes.length === 1 ? '' : 's'} in the live
                <code className="mx-1 text-amber-300">policy_consensus</code> table disagree with the
                doctrine of record ({divergence.fields.join(', ')}). This page publishes the doctrine
                (version {DOCTRINE_VERSION}) and withholds the disagreeing values. Operator action:
                apply <code className="text-amber-300">supabase/migrations/20261102120000_policy_consensus_seed_integrity.sql</code>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {policyData.policies.map((policy) => (
              <PolicyCard
                key={policy.code}
                code={policy.code}
                title={policy.title}
                summary={policy.summary}
                status={policy.status}
                consensus={policy.consensus}
                sponsor={policy.theme}
                lastRevision={policy.lastRevision}
                provenance={policy.provenance}
                reference={policy.reference}
              />
            ))}
          </div>

          <div className="apf-card mt-16 p-8 text-center">
            <h3 className="mb-3 text-xl font-semibold text-white">Your draft amendments</h3>
            <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-ink-muted">
              These drafts are stored in this browser, not on the Federation&rsquo;s floor. No other
              member can read them and the Federation has not received them. A draft stays a
              draft until the Quartermaster&rsquo;s Provisions certifies it for a ballot — nothing
              on this page promotes a motion, and no clearance level can be raised from a browser.
            </p>
            <div className="flex flex-col gap-6 text-left max-w-3xl mx-auto relative z-10">
                {activeDrafts && activeDrafts.length > 0 ? (
                    activeDrafts.map((draft, idx) => (
                        <div key={idx} className="apf-card hover:border-white/15 transition-all duration-500 p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="rounded-md border border-white/[0.08] bg-surface-950 px-2 py-1 font-mono text-[10px] text-ink-dim">{draft.id}</div>
                                <div className="font-mono text-[11px] text-ink-dim">{new Date(draft.date).toLocaleDateString()}</div>
                            </div>
                            <h4 className="mb-2 text-lg font-semibold text-white">{draft.title}</h4>
                            <p className="mb-4 text-sm leading-relaxed text-ink-muted">{draft.summary}</p>

                            <div className="mt-auto flex flex-wrap gap-4 border-t border-white/[0.06] pt-4 text-[11px] text-ink-muted">
                                <span className="text-apf-emerald flex items-center gap-1">
                                    <SafeIcon name="CheckCircle" className="h-3 w-3" /> Alignment: {draft.alignment}
                                </span>
                                <span className="text-apf-purpleLight flex items-center gap-1">
                                    <SafeIcon name="User" className="h-3 w-3" /> Sponsor: {draft.sponsor}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.1] px-4 py-6">
                        <div className="text-sm font-medium text-white">No drafts in the queue</div>
                        <div className="mt-1 text-sm text-ink-dim">Drafts you save in this browser appear here.</div>
                    </div>
                )}
            </div>
          </div>

          <div className="mt-16 rounded-2xl border border-dashed border-white/[0.1] p-8 text-center">
            <p className="text-sm text-ink-muted">
              Every protocol on this page is doctrine of record. Revisions start on the
              proposition floor.
            </p>
            <button onClick={() => navigate('/propose')} className="apf-btn apf-btn-ghost mt-4">
              Propose a revision
            </button>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
