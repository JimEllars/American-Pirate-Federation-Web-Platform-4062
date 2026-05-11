import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { motion } from 'framer-motion';

const { FiChevronRight, FiShield, FiUsers, FiClock } = FiIcons;

export function PolicyCard({ title, code, summary, status, consensus, sponsor, lastRevision }) {
  return (
    <div className="border border-gray-800 bg-black/40 p-6 hover:border-apf-purple transition-all group relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
        <SafeIcon icon={FiShield} className="h-24 w-24 text-apf-purple" />
      </div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 bg-apf-purple/20 text-apf-purpleLight border border-apf-purple/30">
            {code}
          </span>
          <span className={`text-[10px] font-mono uppercase tracking-tighter ${
            status === 'Active' ? 'text-green-500' : 'text-yellow-500'
          }`}>
            ● {status}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-apf-purpleLight transition-colors relative z-10">
        {title}
      </h3>
      <p className="text-sm text-gray-400 font-mono line-clamp-2 mb-6 relative z-10 flex-grow">
        {summary}
      </p>

      {/* Professional Details Section */}
      <div className="border-t border-gray-800 pt-4 mb-4 relative z-10 space-y-3">
         <div className="flex justify-between items-center text-xs font-mono text-gray-500">
           <span className="flex items-center gap-1"><SafeIcon icon={FiUsers} className="text-apf-purple" /> Sponsor: {sponsor}</span>
           <span className="flex items-center gap-1"><SafeIcon icon={FiClock} /> Rev: {lastRevision}</span>
         </div>

         {/* Consensus Progress Bar (Quadratic Voting visualization) */}
         {consensus && (
           <div>
             <div className="flex justify-between text-[10px] font-mono uppercase text-gray-500 mb-1">
               <span>Consensus (QV)</span>
               <span className="text-apf-purple">{consensus}%</span>
             </div>
             <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${consensus}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-apf-purple/50 to-apf-purple"
                />
             </div>
           </div>
         )}
      </div>

      <button className="flex items-center gap-2 text-xs font-mono text-apf-purple hover:text-white transition-colors uppercase tracking-widest relative z-10 mt-auto pt-2">
        Review Full Protocol <SafeIcon icon={FiChevronRight} />
      </button>
    </div>
  );
}
