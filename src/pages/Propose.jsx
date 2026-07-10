import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import { useAddress, useSDK, useConnectionStatus, useNetworkMismatch, useSwitchChain } from '@thirdweb-dev/react';
import { NetworkSwitchModal } from '../components/web3/NetworkSwitchModal';
import Web3ConnectButton from '../components/web3/Web3ConnectButton';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'isomorphic-dompurify';
import { logSignatureRejection, logTransactionDispatched, logGasException } from '../lib/api/telemetry';

import { useSubmitFederationHash } from '../hooks/useAPFWrite.js';

export function Propose() {
  const { userRole, musterRollDraft, addProposedAmendment, addReputation, addToast, isSigning, setIsSigning } = useAppStore();
  const navigate = useNavigate();
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const isMismatched = useNetworkMismatch();
  const switchChain = useSwitchChain();
  const sdk = useSDK();

  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    alignment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const { submitHash: mutateAsync } = useSubmitFederationHash();
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
      sponsor: DOMPurify.sanitize(musterRollDraft.alias || 'Unknown Sovereign')
    };

    try {
        if (sdk) {
            setIsSigning(true);
            try {
                await sdk.wallet.sign("Authorize APF Protocol Revision: " + sanitizedData.title);
            } finally {
                setIsSigning(false);
            }
        }
        setIsMining(true);
        const tx = await mutateAsync({ args: [JSON.stringify(sanitizedData)] });

        addProposedAmendment(sanitizedData);
        addReputation(25, "Protocol Revision Proposed");
        logTransactionDispatched(tx.receipt.transactionHash, 'Propose Protocol Revision');
        addToast('[ PROTOCOL REVISION SIGNED & BROADCAST ]', 'success');
        localStorage.removeItem('apf_proposal_draft');
        navigate('/policies');
    } catch (err) {
        setSubmitting(false);
        if (err.message && (err.message.toLowerCase().includes('insufficient funds') || err.message.toLowerCase().includes('gas required exceeds allowance') || err.message.toLowerCase().includes('intrinsic gas too low'))) {
            logGasException(address);
            addToast('[ SYSTEM ALERT: INSUFFICIENT ARBITRUM GAS FOR DISPATCH ]', 'error');
        } else if (err.code === 4001 || (err.message && err.message.toLowerCase().includes('user rejected'))) {
            logSignatureRejection('/propose');
            addToast('[ SIGNATURE REJECTED - PROPOSAL ABORTED ]', 'error');
        } else {
            addToast('[ SIGNATURE FAILED - PROPOSAL ABORTED ]', 'error');
        }
    } finally {
        setIsMining(false);
    }
  };

  if (!isAuthorized) {

  if (connectionStatus === 'connected' && isMismatched) {
    return (
      <Layout>
        <SEO
          title="Secure Channel | The Federation"
          description="Arbitrum Network Required."
        />
        <PageTransition>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col min-h-[calc(100vh-64px)]">
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center p-12 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500">
                <div className="text-white font-vt323 text-2xl mb-8 uppercase tracking-widest text-center">
                  [ SECURE CHANNEL: ARBITRUM NETWORK CONNECTION REQUIRED ]
                </div>
                <button
                  onClick={() => switchChain(42161)}
                  className="bg-apf-purple/20 border border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white px-8 py-3 font-vt323 text-lg uppercase tracking-widest transition-all duration-300 w-full max-w-md"
                >
                  Switch to Arbitrum One
                </button>
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (connectionStatus !== 'connected' || !address) {
    return (
      <Layout>
        <SEO
          title="Secure Channel | The Federation"
          description="Web3 Connection Required."
        />
        <PageTransition>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col min-h-[calc(100vh-64px)]">
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center p-12 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500">
                <div className="text-white font-vt323 text-2xl mb-8 uppercase tracking-widest text-center">
                  [ SECURE CHANNEL: WEB3 CONNECTION REQUIRED ]
                </div>
                <Web3ConnectButton />
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

      return (
          <Layout>
              <PageTransition>
                  <div className="max-w-3xl mx-auto px-4 py-32 text-center">
                      <SafeIcon name="Lock" className="mx-auto h-16 w-16 text-red-500 mb-6" />
                      <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Clearance Required</h1>
                      <p className="text-gray-400 font-vt323 text-lg border border-red-500/30 bg-red-500/10 p-6 inline-block">
                          Access Denied. Only Navigators and Guild Masters may submit formal protocol revisions to the Federation.
                      </p>
                      <button onClick={() => navigate('/policies')} className="mt-8 block mx-auto text-apf-purple hover:text-white font-vt323 uppercase tracking-widest underline underline-offset-4">
                          Return to Policies
                      </button>
                  </div>
              </PageTransition>
          </Layout>
      );
  }

  return (
    <Layout>
      <SEO title="Propose Revision | Policies" description="Submit a new protocol draft to the Federation." />
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col min-h-[calc(100vh-64px)]">
          <div className="mb-12">
             <div className="flex items-center gap-4 mb-6">
                <SafeIcon name="Edit3" className="h-10 w-10 text-apf-purple" />
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
                  Proposition Portal
                </h1>
              </div>
              <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
                Draft a new amendment or protocol revision for the Federation. All submissions enter a peer-review queue.
              </p>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8 relative flex-grow">
                            <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />
              {isMining && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                      <div className="font-vt323 text-apf-emerald text-xl uppercase tracking-widest animate-pulse border border-apf-emerald/30 bg-apf-emerald/10 px-8 py-4 text-center">
                          [ ENCRYPTING PAYLOAD & AWAITING BLOCKCHAIN CONFIRMATION... ]
                      </div>
                  </div>
              )}

              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <div className="space-y-2">
                      <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="title">
                          Protocol Title / Designation
                      </label>
                      <input
                          id="title"
                          type="text"
                          disabled={isMining}
                          required
                          value={formState.title}
                          onChange={(e) => setFormState({...formState, title: e.target.value})}
                          className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors"
                          placeholder="Ex: Decentralized Supply Chain Verification"
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="summary">
                          Executive Summary / Abstract
                      </label>
                      <textarea
                          id="summary"
                          disabled={isMining}
                          required
                          rows={4}
                          value={formState.summary}
                          onChange={(e) => setFormState({...formState, summary: e.target.value})}
                          className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors resize-none"
                          placeholder="Briefly explain the mechanism and intent of this protocol..."
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block flex items-center gap-2" htmlFor="alignment">
                          Constitutional Alignment <SafeIcon name="HelpCircle" className="h-4 w-4 text-gray-500" />
                      </label>
                      <p className="text-gray-500 font-vt323 text-xs mb-2">
                          Cite the U.S. Constitutional Amendment or founding principle this proposal enforces or defends.
                      </p>
                      <input
                          id="alignment"
                          type="text"
                          disabled={isMining}
                          required
                          value={formState.alignment}
                          onChange={(e) => setFormState({...formState, alignment: e.target.value})}
                          className="w-full bg-black/50 border border-gray-800 p-3 text-white focus:outline-none focus:border-apf-emerald font-vt323 text-lg transition-colors"
                          placeholder="Ex: 4th Amendment - Protection against unreasonable search and seizure"
                      />
                  </div>

                  <div className="pt-8 border-t border-gray-800 flex items-center justify-between">
                      <div className="font-vt323 text-gray-500 text-sm">
                          Sponsor: <span className="text-white uppercase">{musterRollDraft.alias || 'Unknown'}</span>
                      </div>
                      <button
                          type="submit"
                          disabled={submitting || isSigning || isMining}
                          className={`font-vt323 text-xl py-3 px-8 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSigning ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' : 'bg-apf-purple hover:bg-white hover:text-apf-black text-white'
                          }`}
                      >
                          {submitting ? '[ AWAITING SIGNATURE... ]' : 'Submit to Queue'}
                      </button>
                  </div>
              </form>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
