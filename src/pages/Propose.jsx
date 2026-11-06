import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import { useActiveAccount, useActiveWalletConnectionStatus, useActiveWalletChain } from "thirdweb/react";
import { SwitchNetworkButton } from '../components/web3/SwitchNetworkButton';
import DOMPurify from 'isomorphic-dompurify';

export function Propose() {
  const { userRole, passport, openPassport, addProposedAmendment, addToast, isSigning, enqueueTx } = useAppStore();
  const member = passport.member;
  const account = useActiveAccount();
  const address = account?.address;
  const connectionStatus = useActiveWalletConnectionStatus();
  const chain = useActiveWalletChain();
  // Arbitrum One, or Sepolia 421614 when the platform is pointed at the test chain. This
  // used to be `const switchChain = () => {}`, which left the gate with a dead button.
  const isMismatched = Boolean(chain?.id) && chain.id !== 42161 && chain.id !== 421614;

  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    alignment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const isLoaded = useRef(false);

  const isAuthorized = ['Navigator', 'Guild Master'].includes(userRole);

  useEffect(() => {
    const savedDraft = localStorage.getItem('apf_proposal_draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormState(parsedDraft);
        addToast('[ DATA RECOVERY: UNPUBLISHED AMENDMENT DRAFT RESTORED ]', 'success');
      } catch (e) {
        localStorage.removeItem('apf_proposal_draft');
      }
    }
    isLoaded.current = true;
  }, [addToast]); // Only run once on mount

  useEffect(() => {
    if (!isLoaded.current) return;

    // Only save if there's actual content to prevent overwriting with empty on initial render
    if (formState.title || formState.summary || formState.alignment) {
        const timeoutId = setTimeout(() => {
             localStorage.setItem('apf_proposal_draft', JSON.stringify(formState));
        }, 500); // Debounce saves
        return () => clearTimeout(timeoutId);
    } else if (formState.title === '' && formState.summary === '' && formState.alignment === '') {
         // Clear if everything was deleted manually
         localStorage.removeItem('apf_proposal_draft');
    }
  }, [formState]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized || submitting || !address) return;

    setSubmitting(true);

    const sanitizedData = {
      title: DOMPurify.sanitize(formState.title),
      summary: DOMPurify.sanitize(formState.summary),
      alignment: DOMPurify.sanitize(formState.alignment),
      sponsor: DOMPurify.sanitize(member?.alias || 'Unknown Sovereign')
    };

    try {
        const newId = Date.now();
        enqueueTx({
            id: newId,
            command: 'DRAFT_POLICY',
            payload: JSON.stringify(sanitizedData)
        });

        // Add to local state so it appears in drafts
        addProposedAmendment({
            id: newId,
            ...sanitizedData,
            status: 'draft',
            created_at: new Date().toISOString()
        });

        addToast('[ SYSTEM: DRAFT RECORDED LOCALLY — NOT BROADCAST TO ARBITRUM ]', 'success');

        setFormState({ title: '', summary: '', alignment: '' });
        localStorage.removeItem('apf_proposal_draft');
    } catch (err) {
        console.error("Queue error", err);
        addToast('[ SYSTEM ERROR: FAILED TO ENQUEUE TX ]', 'error');
    } finally {
        setSubmitting(false);
    }
  };

  if (connectionStatus === 'connected' && isMismatched) {
    return (
      <Layout>
        <SEO
          title="Network Required | The Federation"
          description="The proposal floor files to Arbitrum One. Switch networks to continue."
        />
        <PageTransition>
          <div className="apf-container max-w-4xl py-14 sm:py-20 flex flex-col min-h-[calc(100vh-64px)]">
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center p-12 apf-card hover:border-white/15 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500 text-center">
                {/* Was "[ SECURE CHANNEL: ARBITRUM NETWORK CONNECTION REQUIRED ]". Connecting a
                    wallet to a chain opens no channel and establishes no security; it picks a
                    network to file on. Say that. */}
                <p className="text-xl font-semibold text-white">Switch to Arbitrum</p>
                <p className="mb-6 mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                  The proposal floor files to Arbitrum One. Switch networks to continue.
                </p>
                <SwitchNetworkButton />
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }


  return (
    <Layout>
      <SEO title="Propose Revision | Policies" description="Submit a new protocol draft to the Federation." />
      <PageTransition>
        <div className="apf-container max-w-4xl py-14 sm:py-20 flex flex-col min-h-[calc(100vh-64px)]">
          <PageHeader
            icon="Edit3"
            kicker="Governance"
            title="Proposition Portal"
            lede="Draft a new amendment or protocol revision for the Federation. A draft is saved in this browser; nothing is broadcast until a signing path is authorized."
          />

          {/* Law 4 / audit F19: the drafting surface is public reading. Clearance gates the
              submission, not the page — the earlier full-page "ACCESS DENIED" hid the entire
              governance route from every visitor who had not yet earned Navigator rank. */}
          {!isAuthorized && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 text-sm text-amber-200"
            >
              <div className="mb-1 flex items-center gap-2 font-medium text-amber-300">
                <SafeIcon name="Lock" className="h-4 w-4" /> Reading clearance: public · Submitting clearance: Navigator
              </div>
              <p className="leading-relaxed text-amber-100/80">
                You can read and draft here. Submitting requires Navigator clearance, which the
                Federation assigns on your muster record — it cannot be earned or raised in this
                browser. {member
                  ? 'Your record is filed; the draft below stays local until clearance is granted.'
                  : 'File a muster entry with your Pirate Passport first.'}
              </p>
              {!member && (
                <button
                  type="button"
                  onClick={openPassport}
                  className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-amber-400/40 px-3 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/10"
                >
                  Open Pirate Passport
                </button>
              )}
            </div>
          )}

          <div className="apf-card relative flex-grow p-6 sm:p-8">
                            <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />
              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-[0.12em] text-ink-dim" htmlFor="title">
                          Protocol Title / Designation
                      </label>
                      <input
                          id="title"
                          type="text"
                          required
                          value={formState.title}
                          onChange={(e) => setFormState({...formState, title: e.target.value})}
                          className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                          placeholder="Ex: Decentralized Supply Chain Verification"
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-[0.12em] text-ink-dim" htmlFor="summary">
                          Executive Summary / Abstract
                      </label>
                      <textarea
                          id="summary"
                          maxLength={2048}
                          required
                          rows={4}
                          value={formState.summary}
                          onChange={(e) => setFormState({...formState, summary: e.target.value})}
                          className="w-full resize-none rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                          placeholder="Briefly explain the mechanism and intent of this protocol..."
                      />
                      <div className={`font-vt323 text-sm text-right mt-1 ${formState.summary.length > 2048 * 0.9 ? 'text-red-500' : 'text-apf-emerald'}`}>
                          BYTES: {formState.summary.length} / 2048
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block flex items-center gap-2" htmlFor="alignment">
                          Constitutional Alignment <SafeIcon name="HelpCircle" className="h-4 w-4 text-gray-500" />
                      </label>
                      <p className="mb-2 text-xs text-ink-dim">
                          Cite the U.S. Constitutional Amendment or founding principle this proposal enforces or defends.
                      </p>
                      <input
                          id="alignment"
                          type="text"
                          required
                          value={formState.alignment}
                          onChange={(e) => setFormState({...formState, alignment: e.target.value})}
                          className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                          placeholder="Ex: 4th Amendment - Protection against unreasonable search and seizure"
                      />
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-8">
                      <div className="text-sm text-ink-dim">
                          Sponsor: <span className="text-white uppercase">{member?.alias || 'Not filed'}</span>
                      </div>
                      <button
                          type="submit"
                          disabled={!isAuthorized || submitting || isSigning || formState.summary.length === 0 || formState.summary.length > 2048}
                          title={!isAuthorized ? 'Navigator clearance required to submit' : undefined}
                          aria-label="Submit to Queue"
                          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-6 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSigning ? 'cursor-not-allowed bg-white/[0.05] text-ink-dim' : 'bg-apf-purple text-white hover:bg-[#A21CE8]'
                          }`}
                      >
                          {!isAuthorized ? 'Navigator Clearance Required' : submitting ? '[ RECORDING DRAFT... ]' : 'Submit to Queue'}
                      </button>
                  </div>
              </form>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
