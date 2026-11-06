import React from 'react';
import SafeIcon from '../../common/SafeIcon';

export default function IntelFilterBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-surface-900/60 px-4 py-2.5">
      <SafeIcon name="Search" className="h-4 w-4 text-ink-dim" />
      <input
        type="text"
        placeholder="Search dispatches…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border-none bg-transparent text-sm text-white placeholder:text-ink-dim focus:outline-none"
      />
    </div>
  );
}
