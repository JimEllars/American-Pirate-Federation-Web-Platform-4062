import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import DOMPurify from 'isomorphic-dompurify';

export function PolicyCard({ title, code, summary, status, consensus, sponsor, lastRevision, provenance, reference }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // `userRole` mirrors the member row on the muster roll (audit F39). It is read, never
  // written here: this card cannot promote anybody.
  const { userRole, policySignals, signalPolicy, policyComments, addPolicyComment, addToast, isCoreSynced } = useAppStore();

  // Law 1: no seeded reviewer, and no public review thread. `policyComments` lives in this
  // browser's persisted store and is written by nobody else — so it must never be labelled
  // "peer review" or "commentary", which reads as a Federation record. It is a note pad.
  const comments = policyComments[code] || [];

  const hasSignaled = policySignals[code] || false;
  const canSignal = ['Navigator', 'Guild Master'].includes(userRole);
  const canComment = ['Deckhand', 'Navigator', 'Guild Master'].includes(userRole);
  // Law 1: signalling a directive must not silently inflate the displayed consensus.
  // The score shown is the value the Federation publishes; a local signal is recorded
  // locally and is not a vote tally.
  const currentConsensus = consensus;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedSummary = DOMPurify.sanitize(summary);

  /**
   * Audit F40: this used to collect a wallet signature for the directive and then throw it
   * away before toasting "[ CONSENSUS SIGNAL CRYPTOGRAPHICALLY SECURED ]". Nothing was
   * secured and nothing was recorded outside this browser, so the signature ritual is gone
   * and the toast says what actually happened.
   */
  const handleAuthorize = () => {
    if (!canSignal) return;
    signalPolicy(code);
    addToast(
      policySignals[code]
        ? '[ SIGNAL WITHDRAWN FROM THIS BROWSER ]'
        : '[ SIGNAL RECORDED IN THIS BROWSER — NOT A FEDERATION BALLOT ]',
      'success'
    );
  };

  const handleAddComment = () => {
    if (newComment.trim() && canComment) {
      addPolicyComment(code, {
          author: "You",
          role: userRole,
          text: DOMPurify.sanitize(newComment),
          date: new Date().toLocaleDateString()
      });
      setNewComment('');
    }
  };

  if (!isCoreSynced) {
    return (
      <div className="apf-card h-64 animate-pulse p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 rounded bg-white/[0.06]" />
          <div className="h-4 w-16 rounded bg-white/[0.04]" />
        </div>
        <div className="mt-5 h-6 w-3/4 rounded bg-white/[0.06]" />
        <div className="mt-4 h-4 w-full rounded bg-white/[0.04]" />
        <div className="mt-2 h-4 w-5/6 rounded bg-white/[0.04]" />
        <div className="mt-8 h-9 w-full rounded bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="apf-card flex flex-col p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-apf-purple/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-apf-purpleLight">
            {code}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowComments(!showComments); setShowHistory(false); }}
            className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${showComments ? 'bg-white/[0.06] text-white' : 'text-ink-dim hover:text-white'}`}
          >
            Notes ({comments.length})
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); setShowComments(false); }}
            className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${showHistory ? 'bg-white/[0.06] text-white' : 'text-ink-dim hover:text-white'}`}
          >
            History
          </button>
        </div>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-white" dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />

      <AnimatePresence mode="wait">
        {!showHistory && !showComments ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-grow flex-col"
          >
            <p className="mb-5 mt-2 flex-grow text-sm leading-relaxed text-ink-muted" dangerouslySetInnerHTML={{ __html: sanitizedSummary }} />

            {consensus && (
              <div className="mb-4 border-t border-white/[0.06] pt-4">
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="uppercase tracking-[0.12em] text-ink-dim">Doctrine baseline</span>
                  <span className="font-mono text-xs text-apf-purpleLight">{currentConsensus}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${currentConsensus}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-apf-purple"
                  />
                </div>
                {/* Law 1: a seeded baseline is not a ballot result, and must not read as one. */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-ink-dim">
                  <span>{provenance === 'member-vote' ? 'Member ballot' : 'Founding draft · no ballot yet'}</span>
                  <span title="Consensus methodology is published with the Master Strategy Plan.">Method</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex-grow space-y-2.5 border-t border-white/[0.06] pt-4 text-xs"
          >
            <div className="flex justify-between gap-4">
              <span className="text-ink-dim">Authorized by</span>
              <span className="flex items-center gap-1.5 text-right text-ink"><SafeIcon name="Users" className="h-3.5 w-3.5 text-apf-purpleLight" /> {sponsor}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-dim">Last revision</span>
              <span className="flex items-center gap-1.5 text-ink"><SafeIcon name="Clock" className="h-3.5 w-3.5 text-apf-purpleLight" /> {lastRevision}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-dim">Status</span>
              <span className="flex items-center gap-1.5 text-ink"><SafeIcon name="Activity" className="h-3.5 w-3.5 text-apf-purpleLight" /> {status}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="comments"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex min-h-[170px] flex-grow flex-col border-t border-white/[0.06] pt-4"
          >
            <div className="mb-2 max-h-40 flex-grow space-y-2 overflow-y-auto pr-1">
              {comments.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/[0.1] p-3 text-center text-[11px] leading-relaxed text-ink-dim">
                  No notes on this device. Notes are saved in this browser only — they are not
                  peer review and the Federation never receives them.
                </div>
              )}
              {comments.map((comment, i) => (
                <div key={i} className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-apf-purpleLight">{DOMPurify.sanitize(comment.author)}</span>
                    <span className="text-[10px] text-ink-dim">{DOMPurify.sanitize(comment.role)}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-muted">{DOMPurify.sanitize(comment.text)}</p>
                </div>
              ))}
            </div>
            {canComment ? (
              <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="mt-auto flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a note (saved in this browser)"
                  className="min-w-0 flex-grow rounded-lg border border-white/[0.1] bg-surface-950 px-2.5 py-2 text-xs text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                />
                <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.1] text-ink-muted transition-colors hover:border-white/20 hover:text-white" aria-label="Save note">
                  <SafeIcon name="MessageSquare" className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="mt-auto rounded-lg border border-dashed border-white/[0.08] p-2 text-center text-[11px] text-ink-dim">
                Clearance required to add notes
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        {/* Audit F41: this slot held a "Review Protocol ›" button with no handler. The slot
            carries the constitutional reference instead. */}
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-ink-dim">
          <SafeIcon name="Anchor" className="h-3 w-3 text-apf-purple/70" />
          {reference ? `Anchored: ${reference}` : 'Anchored: Federation charter'}
        </span>

        {canSignal ? (
          <button
            onClick={handleAuthorize}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors ${
              hasSignaled
                ? 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300'
                : 'border-white/[0.12] text-ink-muted hover:border-white/25 hover:text-white'
            }`}
          >
            {hasSignaled ? <><SafeIcon name="Check" className="h-3.5 w-3.5" /> SIGNALED IN THIS BROWSER</> : 'SIGNAL SUPPORT'}
          </button>
        ) : (
          <span className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-ink-dim">
            Navigator clearance required
          </span>
        )}
      </div>
    </div>
  );
}
