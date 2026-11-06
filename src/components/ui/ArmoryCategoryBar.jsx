import React from 'react';

export default function ArmoryCategoryBar({ activeCategory, setActiveCategory, categories }) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`min-h-[40px] whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition-colors ${
            activeCategory === cat
              ? 'border-apf-purple/40 bg-apf-purple/15 text-white'
              : 'border-white/[0.08] text-ink-muted hover:border-white/20 hover:text-white'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
