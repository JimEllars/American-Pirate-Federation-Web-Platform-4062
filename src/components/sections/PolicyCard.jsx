import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

const { FiChevronRight, FiShield, FiUsers, FiClock, FiActivity } = FiIcons;

export function PolicyCard({ title, code, summary, status, consensus, sponsor, lastRevision }) {
  const [showHistory, setShowHistory] = useState(false);
  const { userRole, policySignals, signalPolicy } = useAppStore();

  const hasSignaled = policySignals[code] || false;
  const canSignal = ['Navigator', 'Guild Master'].includes(userRole);
  const currentConsensus = hasSignaled ? Math.min(100, consensus + 2) : consensus; // simulate QV bump

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-apf-purple/50 p-6 transition-all group relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity pointer-events-none">
        <SafeIcon icon={FiShield} className="h-24 w-24 text-apf-purple" />
      </div>
      
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
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-vt323 text-gray-500 hover:text-apf-purple transition-colors uppercase tracking-widest"
        >
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-apf-purpleLight transition-colors relative z-10">
        {title}
      </h3>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col relative z-10"
          >
            <p className="text-sm text-gray-400 font-sans line-clamp-2 mb-6 flex-grow">
              {summary}
            </p>

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
        ) : (
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
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-auto pt-2 relative z-10 border-t border-gray-800/50">
        <button className="flex items-center gap-2 text-xs font-vt323 text-apf-purple hover:text-white transition-colors uppercase tracking-widest">
          Review Protocol <SafeIcon icon={FiChevronRight} />
        </button>

        {canSignal && (
          <button
            onClick={() => signalPolicy(code)}
            className={`px-3 py-1 text-xs font-vt323 uppercase tracking-widest transition-all border ${
              hasSignaled
                ? 'bg-apf-purple/20 border-apf-purple text-apf-purpleLight'
                : 'border-gray-800 text-gray-500 hover:border-apf-purple/50 hover:text-apf-purple'
            }`}
          >
            {hasSignaled ? 'Signal Active' : 'Signal Support'}
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
