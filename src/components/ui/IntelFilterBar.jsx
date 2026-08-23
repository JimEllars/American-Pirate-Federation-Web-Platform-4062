import React from 'react';
import { SafeIcon } from './SafeIcon';

export default function IntelFilterBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 mb-6 flex items-center gap-4 transition-all duration-300 hover:border-apf-purple/40 shadow-lg">
      <SafeIcon name="Search" className="h-5 w-5 text-apf-emerald" />
      <input
        type="text"
        placeholder="[ SEARCH_DISPATCHES... ]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-transparent border-none text-white font-mono uppercase tracking-widest focus:outline-none placeholder-gray-600 text-sm"
      />
    </div>
  );
}
