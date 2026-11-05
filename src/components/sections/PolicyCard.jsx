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
   * and the toast says what actually happened. Consensus scores stay the published
   * baseline — a local signal is not a vote and never moves the number on this card.
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
      <div className="bg-[#111111] animate-pulse border border-[#9400FF] shadow-[0_0_15px_rgba(148,0,255,0.5)] p-6 h-64 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-800 w-24"></div>
          <div className="h-4 bg-gray-800 w-16"></div>
        </div>
        <div className="h-8 bg-gray-800 w-3/4 mb-4"></div>
        <div className="h-16 bg-gray-800 w-full mb-6"></div>
        <div className="mt-auto h-8 bg-gray-800 w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6 group relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity !pointer-events-none">
        <SafeIcon name="Shield" className="h-24 w-24 text-apf-purple" />
      </div>

      {hasSignaled && (
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 mix-blend-screen opacity-10 md:opacity-15"
        >
          <div className="border-4 border-apf-emerald text-apf-emerald font-vt323 text-4xl font-black p-4 uppercase tracking-[0.3em] whitespace-nowrap">
            Local Signal
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-vt323 px-2 py-1 bg-apf-purple/20 text-apf-purpleLight border border-apf-purple/30">
            {code}
          </span>
          <span className={`text-[10px] font-vt323 uppercase tracking-tighter ${
            status === 'Active' ? 'text-green-500' : 'text-yellow-500'
          }`}>
            ● {status}
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { setShowComments(!showComments); setShowHistory(false); }}
            className={`text-xs font-vt323 hover:text-apf-purple transition-colors uppercase tracking-widest ${showComments ? 'text-apf-purple' : 'text-gray-500'}`}
          >
            Notes ({comments.length})
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); setShowComments(false); }}
            className={`text-xs font-vt323 hover:text-apf-purple transition-colors uppercase tracking-widest ${showHistory ? 'text-apf-purple' : 'text-gray-500'}`}
          >
            History
          </button>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-apf-purpleLight transition-colors relative z-10 font-vt323" dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />

      <AnimatePresence mode="wait">
        {!showHistory && !showComments ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col relative z-10"
          >
            <p className="text-sm text-gray-400 font-sans line-clamp-2 mb-6 flex-grow" dangerouslySetInnerHTML={{ __html: sanitizedSummary }} />

            <div className="border-t border-gray-800 pt-4 mb-4 space-y-3">
               {consensus && (
                 <div>
                   <div className="flex justify-between text-[10px] font-vt323 uppercase text-gray-500 mb-1">
                     <span>Doctrine Baseline</span>
                     <span className="text-apf-purple">{currentConsensus}%</span>
                   </div>
                   <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentConsensus}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-apf-purple/50 to-apf-purple"
                      />
                   </div>
                   {/* Law 1: a seeded baseline is not a ballot result, and must not read as one. */}
                   <div className="flex justify-between text-[9px] font-vt323 uppercase tracking-widest mt-1">
                     <span className="text-gray-600">
                       {provenance === 'member-vote' ? 'Member ballot' : 'Founding draft · no ballot yet'}
                     </span>
                     <span className="text-gray-700" title="Consensus methodology is published with the Master Strategy Plan.">
                       Method
                     </span>
                   </div>
                 </div>
               )}
            </div>
          </motion.div>
        ) : showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow relative z-10 border-t border-gray-800 pt-4 mb-4 text-xs font-vt323 text-gray-400 space-y-2"
          >
             <div className="flex justify-between">
               <span className="text-gray-500">Authorized By:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon name="Users" className="h-3 w-3"/> {sponsor}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Last Revision:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon name="Clock" className="h-3 w-3"/> {lastRevision}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Status:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon name="Activity" className="h-3 w-3"/> {status}</span>
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="comments"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow relative z-10 border-t border-gray-800 pt-4 mb-4 flex flex-col h-40"
          >
            <div className="overflow-y-auto space-y-3 mb-2 flex-grow pr-2 custom-scrollbar">
              {comments.length === 0 && (
                <div className="text-xs font-vt323 text-gray-600 border border-dashed border-gray-800 p-2 text-center">
                  No notes on this device. Notes are saved in this browser only — they are not
                  peer review and the Federation never receives them.
                </div>
              )}
              {comments.map((comment, i) => (
                <div key={i} className="bg-black/50 p-2 border-l-2 border-apf-purple">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-vt323 text-apf-purpleLight">{DOMPurify.sanitize(comment.author)}</span>
                    <span className="text-[10px] font-vt323 text-gray-500 uppercase">{DOMPurify.sanitize(comment.role)}</span>
                  </div>
                  <p className="text-sm text-gray-300 font-sans">{DOMPurify.sanitize(comment.text)}</p>
                </div>
              ))}
            </div>
            {canComment ? (
              <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex gap-2 mt-auto">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a note (saved in this browser)"
                  className="flex-grow bg-black/50 border border-gray-700 p-2 text-sm text-white focus:outline-none focus:border-apf-purple focus:ring-1 focus:ring-apf-purple font-vt323"
                />
                <button type="submit" className="bg-apf-purple/20 text-apf-purpleLight border border-apf-purple/50 px-3 hover:bg-apf-purple hover:text-white transition-colors">
                  <SafeIcon name="MessageSquare" className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="mt-auto text-center p-2 border border-dashed border-gray-800 text-gray-500 text-xs font-vt323">
                [ Clearance required for active annotation ]
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 mt-auto pt-2 relative z-10 border-t border-gray-800/50">
        {/* Audit F41: this slot held a "Review Protocol ›" button with no handler on all
            fourteen cards. There is no per-protocol page to open — the doctrine entry is the
            protocol — so the slot now carries the constitutional reference it is anchored to. */}
        <span className="flex items-center gap-2 text-[10px] sm:text-xs font-vt323 text-gray-500 uppercase tracking-widest">
          <SafeIcon name="Anchor" className="h-3 w-3 text-apf-purple/60" />
          {reference ? `Anchored: ${reference}` : 'Anchored: Federation charter'}
        </span>

        {canSignal && (
          <button
            onClick={handleAuthorize}
            className={`relative overflow-hidden px-4 py-2 text-xs font-vt323 uppercase tracking-widest transition-all border ${
              hasSignaled
                ? 'bg-apf-purple/20 border-apf-emerald text-apf-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'border-gray-800 text-gray-500 hover:border-apf-purple/40 hover:text-apf-purple'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {hasSignaled ? <><SafeIcon name="Check" /> SIGNALED IN THIS BROWSER</> : 'SIGNAL SUPPORT'}
            </span>
          </button>
        )}
        {!canSignal && (
          <span className="text-[10px] font-vt323 text-gray-600 uppercase tracking-widest border border-gray-800/50 px-2 py-1">
            Nav Clearance Reqd
          </span>
        )}
      </div>
    </div>
  );
}
