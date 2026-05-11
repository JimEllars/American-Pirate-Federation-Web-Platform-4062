import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { usePirateIntel } from '../../hooks/usePirateIntel';

const GUILDS = [
  {
    id: 'quartermaster',
    name: "Quartermaster’s Provisions",
    icon: 'Anchor',
    meta: "Resilience: Level 4",
    content: "Food security blueprints, community garden maps, and emergency rationing protocols.",
    category: "quartermaster"
  },
  {
    id: 'shipwright',
    name: "The Shipwright’s Guild",
    icon: 'Settings',
    meta: "Sustainability Index: 0.89",
    content: "Broadband mesh networks, energy blueprints, and 3D manufacturing open-source files.",
    category: "shipwright"
  },
  {
    id: 'navigator',
    name: "The Navigator’s Charts",
    icon: 'Compass',
    meta: "Civic Action: High",
    content: "FOIA templates, campaign finance trackers, and lobbying strategies for the people.",
    category: "navigator"
  },
  {
    id: 'surgeon',
    name: "The Surgeon’s Dispensary",
    icon: 'PlusSquare',
    meta: "Aid Priority: Critical",
    content: "Mental health resources, mutual aid network directories, and medical supply chain maps.",
    category: "surgeon"
  }
];

// Mock Treasury Data
const TREASURY_LEDGER = [
  { txId: '0x8f...3c9', amount: '$12,450', target: 'Community Aid - Article III', status: 'Settled', date: '2024-05-10' },
  { txId: '0x2a...1b4', amount: '$4,200', target: 'Mesh Network Node Expansion', status: 'Settled', date: '2024-05-08' },
  { txId: '0x9c...7f1', amount: '$8,900', target: 'Legal Defense Fund', status: 'Pending', date: '2024-05-11' },
];

export function TheTreasury() {
  const [activeTab, setActiveTab] = useState('guilds'); // 'guilds' or 'ledger'
  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);

  const { data: guides, loading, error } = usePirateIntel(`posts?search=${activeGuild.category}&_embed&per_page=3`);

  return (
    <section className="py-24 bg-apf-black neon-grid relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-800 pb-4">
           <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Federation Assets</h2>
              <p className="font-vt323 text-apf-purple mt-2 tracking-widest">[ DECENTRALIZED_RESOURCE_ALLOCATION ]</p>
           </div>

           <div className="flex gap-4 mt-6 md:mt-0 font-mono text-sm uppercase">
             <button
               onClick={() => setActiveTab('guilds')}
               className={`pb-2 transition-colors ${activeTab === 'guilds' ? 'text-apf-purple border-b-2 border-apf-purple' : 'text-gray-500 hover:text-white'}`}
             >
               Intel & Blueprints
             </button>
             <button
               onClick={() => setActiveTab('ledger')}
               className={`pb-2 transition-colors ${activeTab === 'ledger' ? 'text-apf-purple border-b-2 border-apf-purple' : 'text-gray-500 hover:text-white'}`}
             >
               Mothership Ledger
             </button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'guilds' ? (
            <motion.div
              key="guilds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col lg:flex-row gap-12"
            >
              {/* Guilds List */}
              <div className="lg:w-1/3">
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

              {/* Guild Details */}
              <div className="lg:w-2/3 min-h-[400px] border border-apf-purple/30 bg-black/60 backdrop-blur-xl p-8 relative overflow-hidden">
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

                    <div className="mt-8 pt-8 border-t border-white/10">
                      <h4 className="font-vt323 text-lg text-white mb-4 uppercase tracking-widest">[ DECRYPTED_BLUEPRINTS ]</h4>
                      {loading && <p className="font-vt323 text-gray-500 animate-pulse">Syncing Intel...</p>}
                      {error && <p className="font-vt323 text-red-500">SIGNAL INTERRUPTED: {error}</p>}
                      {!loading && !error && guides && guides.length > 0 && (
                        <ul className="space-y-3">
                          {guides.map((guide) => (
                            <li key={guide.id} className="border border-white/10 p-3 bg-black/40 hover:border-apf-purple transition-all cursor-pointer">
                               <a href={guide.link} target="_blank" rel="noreferrer" className="block text-apf-purple hover:text-white font-vt323 text-lg uppercase">
                                  &gt; {guide.title?.rendered || "CLASSIFIED_DOCUMENT"}
                               </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!loading && !error && (!guides || guides.length === 0) && (
                         <p className="font-vt323 text-gray-500">No active blueprints currently verified for this sector.</p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-black/60 border border-gray-800 p-8">
                 <div className="flex justify-between items-center mb-8">
                   <div>
                     <h3 className="text-2xl font-bold uppercase text-white">Treasury Transparency</h3>
                     <p className="font-mono text-gray-500 text-sm">Real-time ledger of federation resource allocation.</p>
                   </div>
                   <a
                     href="ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
                     target="_blank"
                     rel="noreferrer"
                     className="flex items-center gap-2 border border-apf-purple text-apf-purple px-4 py-2 font-mono text-xs uppercase hover:bg-apf-purple hover:text-white transition-colors"
                   >
                     <SafeIcon name="Download" className="h-4 w-4" /> Download Full Audit (IPFS)
                   </a>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-900 border-b border-gray-800">
                        <tr>
                          <th className="px-6 py-3">TxHash</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Allocation</th>
                          <th className="px-6 py-3">Directive</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {TREASURY_LEDGER.map((tx, idx) => (
                          <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-apf-purple">{tx.txId}</td>
                            <td className="px-6 py-4 text-gray-400">{tx.date}</td>
                            <td className="px-6 py-4 text-white font-bold">{tx.amount}</td>
                            <td className="px-6 py-4 text-gray-300">{tx.target}</td>
                            <td className="px-6 py-4 text-right">
                               <span className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${
                                 tx.status === 'Settled' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                               }`}>
                                 {tx.status}
                               </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>

                 <div className="mt-6 text-center font-vt323 text-gray-500 text-sm">
                   [ FULFILLING_ARTICLE_II: RADICAL_TRANSPARENCY ]
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
