import React from 'react';

export default function ArmoryCategoryBar({ activeCategory, setActiveCategory, categories }) {
  return (
    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-apf-purple/50 scrollbar-track-transparent">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest whitespace-nowrap border transition-all duration-300 min-h-[44px] ${
            activeCategory === cat
              ? 'border-apf-purple bg-apf-purple/20 text-white shadow-[0_0_10px_rgba(148,0,255,0.5)]'
              : 'border-white/10 text-gray-400 hover:border-apf-purple/50 hover:text-white bg-black/40'
          }`}
        >
          [ {cat} ]
        </button>
      ))}
    </div>
  );
}
