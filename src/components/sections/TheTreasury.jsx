import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../../hooks/usePirateIntel';

const GUILDS = [
  {
    id: 'quartermaster',
    name: "The Quartermaster’s Exchange",
    icon: 'Package',
    meta: "Supply Rating: Nominal",
    content: "Guides on localized agriculture, securing surplus electronics, and building community mesh-networks.",
    category: "quartermaster"
  },
  {
    id: 'shipwright',
    name: "The Shipwright’s Guild",
    icon: 'Tool',
    meta: "Infrastructure: Expanding",
    content: "Open-source 3D printing schematics, off-grid power systems, and repair guides for proprietary hardware.",
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

export function TheTreasury() {
  const [activeTab, setActiveTab] = useState('guilds'); // 'guilds' or 'ledger'
  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);
  const [ledger, setLedger] = useState([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const { data: guides, loading, error } = usePirateIntel(`posts?search=${activeGuild.category}&_embed&per_page=3`);

  // Simulate fetching live ledger data
  useEffect(() => {
    if (activeTab === 'ledger' && ledger.length === 0) {
      setTimeout(() => {
        setLedger([
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '12,450 USDC', target: 'Tactical Funding: Community Aid', status: 'Settled', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '4,200 USDC', target: 'Resource Allocation: Node Expansion', status: 'Settled', date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '8,900 USDC', target: 'Tactical Funding: Legal Defense', status: 'Pending', date: new Date().toISOString().split('T')[0] },
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '1,500 USDC', target: 'Resource Allocation: Server Upkeep', status: 'Settled', date: new Date(Date.now() - 432000000).toISOString().split('T')[0] },
        ]);
      }, 800);
    }
  }, [activeTab, ledger.length]);

  return (
    <section className="py-24 bg-apf-black neon-grid relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-800 pb-4">
           <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Federation Assets</h2>
              <p className="font-vt323 text-apf-purple mt-2 tracking-widest">[ DECENTRALIZED_RESOURCE_ALLOCATION ]</p>
           </div>

           <div className="flex gap-4 mt-6 md:mt-0 font-vt323 text-sm uppercase">
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
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                   <div>
                     <h3 className="text-2xl font-bold uppercase text-white">Treasury Transparency</h3>
                     <p className="font-vt323 text-gray-500 text-sm">Real-time ledger of federation resource allocation.</p>
                   </div>
                   <button
                     onClick={() => setIsAuditing(!isAuditing)}
                     className="flex items-center gap-2 border border-apf-purple text-apf-purple px-4 py-2 font-vt323 text-xs uppercase hover:bg-apf-purple hover:text-white transition-colors"
                   >
                     <SafeIcon name="Download" className="h-4 w-4" /> {isAuditing ? 'Close Audit View' : 'Verify Audit (IPFS)'}
                   </button>
                 </div>

                 {isAuditing && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-black border border-apf-purple/50 p-4 mb-8 font-vt323 text-xs text-apf-purple overflow-x-auto"
                   >
                     <div className="mb-2 text-white">IPFS Hash: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi</div>
                     <pre className="text-gray-400">
{JSON.stringify({
  "@context": "apf-ledger",
  "contract": "0xAPF...Treasury",
  "lastSync": new Date().toISOString(),
  "merkleRoot": "0x" + Math.random().toString(16).substring(2),
  "verification": "SUCCESS",
  "status": "Immutable"
}, null, 2)}
                     </pre>
                   </motion.div>
                 )}

                 <div className="overflow-x-auto">
                    <table className="w-full text-left font-vt323">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-900 border-b border-gray-800">
                        <tr>
                          <th className="px-6 py-3">TxHash</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Allocation</th>
                          <th className="px-6 py-3">Directive</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm relative min-h-[200px]">
                        {ledger.length === 0 ? (
                           <tr>
                             <td colSpan="5" className="text-center py-12 text-apf-purple animate-pulse">
                               SYNCING LEDGER FROM DECENTRALIZED NODES...
                             </td>
                           </tr>
                        ) : (
                          ledger.map((tx, idx) => (
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
                          ))
                        )}
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
