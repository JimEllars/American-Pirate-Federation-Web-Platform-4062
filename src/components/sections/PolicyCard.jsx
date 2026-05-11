import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiChevronRight, FiShield } = FiIcons;

export function PolicyCard({ title, code, summary, status }) {
  return (
    <div className="border border-gray-800 bg-black/40 p-6 hover:border-apf-purple transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
        <SafeIcon icon={FiShield} className="h-12 w-12 text-apf-purple" />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-mono px-2 py-1 bg-apf-purple/20 text-apf-purpleLight border border-apf-purple/30">
          {code}
        </span>
        <span className={`text-[10px] font-mono uppercase tracking-tighter ${
          status === 'Active' ? 'text-green-500' : 'text-yellow-500'
        }`}>
          ● {status}
        </span>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-apf-purpleLight transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-400 font-mono line-clamp-2 mb-4">
        {summary}
      </p>

      <button className="flex items-center gap-2 text-xs font-mono text-apf-purple hover:text-white transition-colors uppercase tracking-widest">
        Review Full Protocol <SafeIcon icon={FiChevronRight} />
      </button>
    </div>
  );
}