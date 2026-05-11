import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const ARTICLES = [
  { id: 'I', title: "Every Pirate Matters", theme: "Unity & Equity" },
  { id: 'II', title: "No Quarter for Corruption", theme: "Transparency / Anti-Corruption" },
  { id: 'III', title: "Health of the Crew", theme: "Mutual Aid Healthcare" },
  { id: 'IV', title: "A Fair Share of the Plunder", theme: "Fair Wages / Economic Reform" },
  { id: 'V', title: "Hoist the Sails for Knowledge", theme: "Open Source / Anti-Censorship" },
  { id: 'VI', title: "No Pirate Left Behind", theme: "Social Safety Nets" },
  { id: 'VII', title: "A Pirate’s Right to Privacy", theme: "Data Sovereignty / Privacy" }
];

export function ThePirateCode() {
  return (
    <section className="py-24 bg-apf-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4 tracking-tighter">
            The Master Charter
          </h2>
          <p className="font-vt323 text-apf-purple text-xl tracking-[0.2em]">
            [ PROTOCOL: THE SEVEN ARTICLES ]
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {ARTICLES.map((article, index) => (
            <motion.div
              key={article.id}
              whileHover={{ scale: 1.02 }}
              className="group relative bg-apf-gray border border-white/5 p-8 border-l-4 border-l-apf-purple cursor-crosshair transition-all"
            >
              <div className="absolute inset-0 bg-apf-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="font-vt323 text-apf-purple text-2xl mb-2 block">ARTICLE {article.id}</span>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:glitch-hover transition-all">
                {article.title}
              </h3>
              <p className="font-vt323 text-gray-500 uppercase text-xs tracking-widest mb-4">
                {article.theme}
              </p>
              <div className="prose prose-invert prose-sm opacity-0 group-hover:opacity-100 transition-all duration-500">
                <p className="font-sans text-gray-300">
                  Sacred Fragment Decrypting... This article serves as a foundational pillar of the Federation's digital and physical resistance.
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}