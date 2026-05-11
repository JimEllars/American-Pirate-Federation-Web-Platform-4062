import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const GUILDS = [
  {
    id: 'quartermaster',
    name: "Quartermaster’s Provisions",
    icon: 'Anchor',
    meta: "Resilience: Level 4",
    content: "Food security blueprints, community garden maps, and emergency rationing protocols."
  },
  {
    id: 'shipwright',
    name: "The Shipwright’s Guild",
    icon: 'Settings',
    meta: "Sustainability Index: 0.89",
    content: "Broadband mesh networks, energy blueprints, and 3D manufacturing open-source files."
  },
  {
    id: 'navigator',
    name: "The Navigator’s Charts",
    icon: 'Compass',
    meta: "Civic Action: High",
    content: "FOIA templates, campaign finance trackers, and lobbying strategies for the people."
  },
  {
    id: 'surgeon',
    name: "The Surgeon’s Dispensary",
    icon: 'PlusSquare',
    meta: "Aid Priority: Critical",
    content: "Mental health resources, mutual aid network directories, and medical supply chain maps."
  }
];

export function TheTreasury() {
  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);

  return (
    <section className="py-24 bg-apf-black neon-grid relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/3">
            <h2 className="text-4xl font-black uppercase mb-8 tracking-tighter">The Treasury</h2>
            <div className="space-y-4">
              {GUILDS.map((guild) => (
                <button
                  key={guild.id}
                  onClick={() => setActiveGuild(guild)}
                  className={`w-full text-left p-4 flex items-center gap-4 border transition-all ${
                    activeGuild.id === guild.id 
                    ? 'border-apf-purple bg-apf-purple/10 text-white' 
                    : 'border-white/5 bg-black/40 text-gray-500 hover:border-white/20'
                  }`}
                >
                  <SafeIcon name={guild.icon} className={activeGuild.id === guild.id ? 'text-apf-purple' : ''} />
                  <span className="font-vt323 text-lg uppercase tracking-wider">{guild.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:w-2/3 min-h-[400px] border border-apf-purple/30 bg-apf-black/80 backdrop-blur-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 font-vt323 text-apf-purple opacity-30">
              {activeGuild.meta}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGuild.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="prose prose-invert max-w-none"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-apf-purple/20 border border-apf-purple">
                    <SafeIcon name={activeGuild.icon} className="h-8 w-8 text-apf-purple" />
                  </div>
                  <h3 className="text-3xl font-cinzel uppercase m-0">{activeGuild.name}</h3>
                </div>
                
                <p className="font-vt323 text-apf-purpleLight text-xl leading-relaxed">
                  {activeGuild.content}
                </p>
                
                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="p-4 border border-white/5 bg-white/5">
                    <span className="block text-[10px] font-vt323 text-gray-500 uppercase">Status</span>
                    <span className="text-green-500 font-vt323 uppercase">Verified_Node</span>
                  </div>
                  <div className="p-4 border border-white/5 bg-white/5">
                    <span className="block text-[10px] font-vt323 text-gray-500 uppercase">Access</span>
                    <span className="text-apf-purple font-vt323 uppercase">Public_Domain</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}