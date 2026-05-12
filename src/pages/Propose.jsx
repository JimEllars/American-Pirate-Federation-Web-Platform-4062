import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'isomorphic-dompurify';

export function Propose() {
  const { userRole, musterRollDraft, addProposedAmendment, addReputation } = useAppStore();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    alignment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized = ['Navigator', 'Guild Master'].includes(userRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthorized || submitting) return;

    setSubmitting(true);

    const sanitizedData = {
      title: DOMPurify.sanitize(formState.title),
      summary: DOMPurify.sanitize(formState.summary),
      alignment: DOMPurify.sanitize(formState.alignment),
      sponsor: DOMPurify.sanitize(musterRollDraft.alias || 'Unknown Sovereign')
    };

    setTimeout(() => {
        addProposedAmendment(sanitizedData);
        addReputation(25, "Protocol Revision Proposed");
        navigate('/policies');
    }, 1000);
  };

  if (!isAuthorized) {
      return (
          <Layout>
              <PageTransition>
                  <div className="max-w-3xl mx-auto px-4 py-32 text-center">
                      <SafeIcon name="Lock" className="mx-auto h-16 w-16 text-red-500 mb-6" />
                      <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Clearance Required</h1>
                      <p className="text-gray-400 font-vt323 text-lg border border-red-500/30 bg-red-500/10 p-6 inline-block">
                          Access Denied. Only Navigators and Guild Masters may submit formal protocol revisions to the Chartroom.
                      </p>
                      <button onClick={() => navigate('/policies')} className="mt-8 block mx-auto text-apf-purple hover:text-white font-vt323 uppercase tracking-widest underline underline-offset-4">
                          Return to Chartroom
                      </button>
                  </div>
              </PageTransition>
          </Layout>
      );
  }

  return (
    <Layout>
      <SEO title="Propose Revision | Chartroom" description="Submit a new protocol draft to the Federation." />
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

          <div className="bg-black/60 border border-gray-800 p-8 relative flex-grow">
              <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <div className="space-y-2">
                      <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="title">
                          Protocol Title / Designation
                      </label>
                      <input
                          id="title"
                          type="text"
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
                          disabled={submitting}
                          className="bg-apf-purple hover:bg-white hover:text-apf-black text-white font-vt323 text-xl py-3 px-8 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {submitting ? 'Encrypting & Broadcasting...' : 'Submit to Queue'}
                      </button>
                  </div>
              </form>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
