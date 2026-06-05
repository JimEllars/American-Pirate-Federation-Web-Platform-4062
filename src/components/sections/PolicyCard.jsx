import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import DOMPurify from 'isomorphic-dompurify';

const { FiChevronRight, FiShield, FiUsers, FiClock, FiActivity, FiMessageSquare } = FiIcons;

export function PolicyCard({ title, code, summary, status, consensus, sponsor, lastRevision }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const { userRole, policySignals, signalPolicy, policyComments, addPolicyComment } = useAppStore();

  const comments = policyComments[code] || [
    { author: "Navigator Vance", role: "Navigator", text: "Alignment verified. Ready for ratification.", date: "2024-05-01" },
  ];

  const hasSignaled = policySignals[code] || false;
  const canSignal = ['Navigator', 'Guild Master'].includes(userRole);
  const canComment = ['Deckhand', 'Navigator', 'Guild Master'].includes(userRole);
  const currentConsensus = hasSignaled ? Math.min(100, consensus + 2) : consensus; // simulate QV bump

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedSummary = DOMPurify.sanitize(summary);

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

  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-6 group relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity !pointer-events-none">
        <SafeIcon icon={FiShield} className="h-24 w-24 text-apf-purple" />
      </div>

      {hasSignaled && (
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 mix-blend-screen opacity-10 md:opacity-15"
        >
          <div className="border-4 border-apf-emerald text-apf-emerald font-cinzel text-4xl font-black p-4 uppercase tracking-[0.3em] whitespace-nowrap">
            Authorized
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
            Commentary ({comments.length})
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); setShowComments(false); }}
            className={`text-xs font-vt323 hover:text-apf-purple transition-colors uppercase tracking-widest ${showHistory ? 'text-apf-purple' : 'text-gray-500'}`}
          >
            History
          </button>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-apf-purpleLight transition-colors relative z-10 font-cinzel" dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />

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
                     <span>Consensus (QV)</span>
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
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon icon={FiUsers} className="h-3 w-3"/> {sponsor}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Last Revision:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon icon={FiClock} className="h-3 w-3"/> {lastRevision}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Status:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon icon={FiActivity} className="h-3 w-3"/> {status}</span>
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
                  placeholder="Add peer review..."
                  className="flex-grow bg-black/50 border border-gray-700 p-2 text-sm text-white focus:outline-none focus:border-apf-purple focus:ring-1 focus:ring-apf-purple font-vt323"
                />
                <button type="submit" className="bg-apf-purple/20 text-apf-purpleLight border border-apf-purple/50 px-3 hover:bg-apf-purple hover:text-white transition-colors">
                  <SafeIcon icon={FiMessageSquare} className="h-4 w-4" />
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

      <div className="flex items-center justify-between mt-auto pt-2 relative z-10 border-t border-gray-800/50">
        <button className="flex items-center gap-2 text-xs font-vt323 text-apf-purple hover:text-white transition-colors uppercase tracking-widest">
          Review Protocol <SafeIcon icon={FiChevronRight} />
        </button>

        {canSignal && (
          <button
            onClick={() => signalPolicy(code)}
            className={`relative overflow-hidden px-4 py-2 text-xs font-vt323 uppercase tracking-widest transition-all border ${
              hasSignaled
                ? 'bg-apf-purple/20 border-apf-emerald text-apf-emerald shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'border-gray-800 text-gray-500 hover:border-apf-purple/40 hover:text-apf-purple'
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {hasSignaled ? <><SafeIcon icon={FiIcons.FiCheck} /> DIRECTIVE AUTHORIZED</> : 'AUTHORIZE DIRECTIVE'}
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
