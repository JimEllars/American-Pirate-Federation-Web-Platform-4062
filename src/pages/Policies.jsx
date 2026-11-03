import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="BookOpen" className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-vt323">
                Policies
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-sans text-lg border-l-2 border-apf-purple pl-6">
              Sovereignty is not given; it is coded. These are the active foundational protocols and civic mandates governing the American Pirate Federation.
            </p>
          </div>

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
              />
            ))}
          </div>

          <div className="mt-16 p-8 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 text-center relative overflow-hidden">
             <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />
            <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest relative z-10">Proposed Amendments (Drafts)</h3>
            <p className="text-gray-500 font-sans text-sm mb-8 max-w-2xl mx-auto relative z-10">
              Unverified members can view upcoming motions before they reach the active voting floor. Upgrade clearance to Signal Consensus.
            </p>
            <div className="flex flex-col gap-6 text-left max-w-3xl mx-auto relative z-10">
                {activeDrafts && activeDrafts.length > 0 ? (
                    activeDrafts.map((draft, idx) => (
                        <div key={idx} className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-gray-400 font-vt323 text-xs uppercase tracking-widest border border-gray-800 px-2 py-1 bg-black">{draft.id}</div>
                                <div className="text-gray-600 font-vt323 text-xs">{new Date(draft.date).toLocaleDateString()}</div>
                            </div>
                            <h4 className="text-white font-bold text-xl mb-2 font-vt323">{draft.title}</h4>
                            <p className="text-gray-400 font-sans text-sm mb-4 leading-relaxed">{draft.summary}</p>

                            <div className="flex flex-wrap gap-4 text-xs font-vt323 border-t border-gray-800/50 pt-4 mt-auto">
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
                    <div className="border-l-2 border-gray-600 pl-4 py-2 opacity-50">
                        <div className="text-gray-400 font-vt323 text-xs uppercase mb-1">SYSTEM_NOTICE</div>
                        <div className="text-white font-bold">No active drafts in the queue.</div>
                    </div>
                )}
            </div>
          </div>

          <div className="mt-20 p-8 border border-dashed border-gray-800 text-center">
            <p className="text-gray-500 font-vt323 text-sm uppercase tracking-widest">
              [ End of Current Legislative Stack ]
            </p>
            <button onClick={() => navigate('/propose')} className="mt-4 text-apf-purple hover:text-white font-vt323 text-xs uppercase underline underline-offset-4 tracking-widest">
              Propose New Protocol Revision
            </button>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
