import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import { ContributeButton } from '../web3/ContributeButton';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../../hooks/usePirateIntel';
import { useAXiMHydration } from '../../hooks/useAXiMHydration';
import { useAppStore } from '../../store/useAppStore';
import DOMPurify from 'isomorphic-dompurify';
import { useAPFContract } from '../../hooks/useAPFContract';

const GUILDS = [
  {
    id: 'surgeons',
    name: "Surgeon's Dispensary",
    icon: "Activity",
    content: "The heart of mutual aid. We develop open-source medical protocols, coordinate decentralized care networks, and ensure Article III is upheld.",
    meta: "SEC_MED_01"
  },
  {
    id: 'shipwrights',
    name: "Shipwright's Guild",
    icon: "Tool",
    content: "Architects of the new digital seas. We build the physical and software infrastructure required for federation sovereignty.",
    meta: "SEC_ENG_02"
  },
  {
    id: 'quartermasters',
    name: "Quartermaster's Provisions",
    icon: "Package",
    content: "Logistics and resource distribution. From community gardens to local mesh networks, we ensure fair plunder for all.",
    meta: "SEC_LOG_03"
  },
  {
    id: 'navigators',
    name: "Navigator's Observatory",
    icon: "Compass",
    content: "Intelligence and legal defense. We map the ever-changing regulatory landscape and chart safe courses for the fleet.",
    meta: "SEC_INT_04"
  }
];

export function TheTreasury() {
  const { treasuryBalance, isLoadingBalance, isConfigured } = useAPFContract();
  const { addToast, isCoreSynced, setIsCoreSynced } = useAppStore();
  const [activeTab, setActiveTab] = useState('guilds'); // 'guilds' or 'ledger'

  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);
  const { data: guides, loading, error } = usePirateIntel('posts?categories=3');

  // Ledger state starts empty by design. Rows appear only when Supabase returns them
  // (Architectural Law 1: Anti-Theater & Ground Truth). No seeded fixtures.
  const { fetchLiveLedger, loading: ledgerLoading } = useAXiMHydration();
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadLedger = async () => {
      try {
        const data = await fetchLiveLedger();
        setIsCoreSynced(true);
        if (isMounted) {
          setLedger(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setIsCoreSynced(true);
          setLedger([]);
          addToast('[ TELEMETRY INGRESS FAILED - LEDGER UNAVAILABLE ]', 'warning');
        }
      }
    };

    loadLedger();

    return () => {
      isMounted = false;
    };
  }, [fetchLiveLedger, addToast, setIsCoreSynced]);

  const treasuryAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const hasTreasuryAddress =
    Boolean(treasuryAddress) &&
    treasuryAddress !== '0x0000000000000000000000000000000000000000';
  const explorerUrl = hasTreasuryAddress ? `https://arbiscan.io/address/${treasuryAddress}` : null;

  return (
    <>
    <section className="py-24 bg-apf-black neon-grid relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
        </div>

        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-800 pb-4">
           <div>
              <h2
                 className="text-4xl font-black uppercase tracking-tighter text-white"
              >Federation Assets</h2>
              <p className="font-vt323 text-apf-purple mt-2 tracking-widest">[ DECENTRALIZED_RESOURCE_ALLOCATION ]</p>
              <div className="mt-4 inline-block border border-apf-emerald bg-apf-emerald/10 px-4 py-2">
                <span className="font-vt323 text-sm text-gray-400 uppercase tracking-widest block">Vault Balance:</span>
                <span className="font-mono text-2xl text-apf-emerald font-bold">
                  {(() => {
                    if (!isConfigured) return '[ NOT CONFIGURED ]';
                    if (isLoadingBalance) return '[ SYNCING RPC... ]';
                    if (treasuryBalance === undefined || treasuryBalance === null) return '0.00 ETH';
                    if (typeof treasuryBalance === 'string') {
                      return treasuryBalance.includes('ETH') ? treasuryBalance : `${treasuryBalance} ETH`;
                    }
                    try {
                      const formatted = ethers.utils.formatEther(treasuryBalance);
                      return `${formatted} ETH`;
                    } catch (e) {
                      return '0.00 ETH';
                    }
                  })()}
                </span>
              </div>
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
                        : 'border-white/5 bg-black/60 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <SafeIcon name={guild.icon} className={activeGuild.id === guild.id ? 'text-apf-purple' : ''} />
                      <span className="font-vt323 text-lg uppercase tracking-wider">{guild.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guild Details */}
              <div className="lg:w-2/3 min-h-[400px] bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8 relative overflow-hidden">
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
                      <h3 className="text-3xl font-vt323 uppercase m-0">{activeGuild.name}</h3>
                    </div>

                    <p className="font-vt323 text-apf-purpleLight text-xl leading-relaxed">
                      {activeGuild.content}
                    </p>

                    <div className="mt-8 pt-8 border-t border-white/10">
                      <h4 className="font-vt323 text-lg text-white mb-4 uppercase tracking-widest">[ DECRYPTED_BLUEPRINTS ]</h4>
                      {loading && <p className="font-vt323 text-gray-500 animate-pulse">Synchronizing Fleet Assets...</p>}
                      {error && <p className="font-vt323 text-red-500">SIGNAL INTERRUPTED: {error}</p>}
                      {!loading && !error && guides && guides.length > 0 && (
                        <ul className="space-y-3">
                          {guides.map((guide) => (
                            <li key={guide.id} className="border border-white/10 p-3 bg-black/60 hover:border-apf-purple transition-all cursor-pointer">
                               <a href={guide.link} target="_blank" rel="noreferrer" className="block text-apf-purple hover:text-white font-vt323 text-lg uppercase">
                                  &gt; {DOMPurify.sanitize(guide.title?.rendered || "CLASSIFIED_DOCUMENT")}
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
          ) : !isCoreSynced ? (

            <motion.div
              key="ledger-skeleton"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#111111] animate-pulse border border-[#9400FF] shadow-[0_0_15px_rgba(148,0,255,0.5)] p-8 h-[500px]">
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                   <div>
                     <div className="h-8 bg-gray-800 w-64 mb-2"></div>
                     <div className="h-4 bg-gray-800 w-96"></div>
                   </div>
                   <div className="h-10 bg-gray-800 w-48"></div>
                 </div>
                 <div className="w-full h-64 bg-gray-800"></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8">
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                   <div>
                     <h3 className="text-2xl font-bold uppercase text-white">Treasury Transparency</h3>
                     <p className="font-vt323 text-gray-500 text-sm">
                       Ledger entries below are read directly from the Federation&rsquo;s Supabase ledger table. Nothing here is simulated.
                       {ledger.length === 0 && ' No on-chain settlements have been recorded yet.'}
                     </p>
                   </div>
                   {explorerUrl ? (
                     <a
                       href={explorerUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center gap-2 border border-apf-purple text-apf-purple px-4 py-2 font-vt323 text-xs uppercase hover:bg-apf-purple hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-apf-purple/50"
                       aria-label="Verify the APF Safe multisig on Arbiscan"
                     >
                       <SafeIcon name="ExternalLink" className="h-4 w-4" /> Verify on Arbiscan
                     </a>
                   ) : (
                     <span
                       className="flex items-center gap-2 border border-gray-800 text-gray-600 px-4 py-2 font-vt323 text-xs uppercase cursor-not-allowed"
                       title="No treasury address is configured, so there is nothing to verify on-chain yet."
                     >
                       <SafeIcon name="Lock" className="h-4 w-4" /> No Safe deployed
                     </span>
                   )}
                 </div>

                 {/* Honest audit state. There is no published IPFS audit yet, so we say so
                     rather than rendering a hash and a "verification: SUCCESS" banner. */}
                 <div className="bg-black border border-white/10 p-5 mb-8 font-vt323 text-xs">
                   <div className="text-white uppercase tracking-widest mb-2">[ AUDIT STATUS ]</div>
                   <p className="text-gray-400 leading-relaxed">
                     {explorerUrl
                       ? 'Treasury balances and transfers are verifiable directly against the Arbiscan explorer link above. A signed, IPFS-pinned allocation report has not been published yet; when it is, its CID and Merkle root will be listed here.'
                       : 'The APF Arbitrum Safe multisig is not deployed yet, so there is no audit to publish. This panel will populate with a signed report CID once the Treasury is live.'}
                   </p>
                 </div>

{/* Contribute Section Mapping */}
                 <div className="col-span-1 lg:col-span-3 mb-8 w-full border border-apf-purple/30 bg-black/50 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h4 className="text-white font-vt323 text-xl uppercase tracking-widest mb-1">Federation Funding</h4>
                      <p className="text-gray-400 font-vt323 text-sm">
                        Card contributions route to APF Action (501(c)(4)) and are not tax-deductible. Crypto contributions settle on Arbitrum One.
                      </p>
                    </div>
                    <div className="w-full md:w-auto">
                       <ContributeButton className="w-full md:w-48" />
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left font-vt323">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-900 border-b border-gray-800">
                        <tr>
                          <th className="px-6 py-3">TxHash</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Allocation</th>
                          <th className="px-6 py-3">Target</th>
                          <th className="px-6 py-3">Directive Correlation</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm relative min-h-[200px]">
                        {ledgerLoading ? (
                           <tr>
                             <td colSpan="6" className="text-center py-12 text-apf-purple animate-pulse">
                               [ SYNCING DECENTRALIZED LEDGER... ]
                             </td>
                           </tr>
                        ) : ledger.length === 0 ? (
                           <tr>
                             <td colSpan="6" className="py-16 text-center">
                               <div className="font-vt323 text-apf-purple text-lg uppercase tracking-widest mb-2">[ LEDGER SYNCHRONIZED — NO ENTRIES ]</div>
                               <p className="font-vt323 text-gray-500 text-sm max-w-md mx-auto">
                                 The Federation has not recorded any settled treasury allocations yet. Entries appear here automatically once a Safe multisig transaction is confirmed and ingested.
                               </p>
                             </td>
                           </tr>
                        ) : (
                          ledger.map((tx, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-apf-purple truncate max-w-[120px] sm:max-w-none">{DOMPurify.sanitize(tx.txId)}</td>
                              <td className="px-6 py-4 text-gray-400">{DOMPurify.sanitize(tx.date)}</td>
                              <td className="px-6 py-4 text-white font-bold">{DOMPurify.sanitize(tx.amount)}</td>
                              <td className="px-6 py-4 text-gray-300">{DOMPurify.sanitize(tx.target)}</td>
                              <td className="px-6 py-4 text-apf-emerald">{DOMPurify.sanitize(tx.alignment)}</td>
                              <td className="px-6 py-4 text-right">
                                 <span className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${
                                   tx.status === 'Settled' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                                 }`}>
                                   {DOMPurify.sanitize(tx.status)}
                                 </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                 </div>


                {!hasTreasuryAddress ? (
                  <div className="mt-8 border border-apf-purple/40 bg-black/60 p-6 text-center">
                    <span className="font-vt323 text-apf-purple text-xl block mb-2">[ STATUS: SAFE RATIFICATION PENDING ]</span>
                    <p className="font-vt323 text-gray-300 text-base max-w-xl mx-auto">
                      The APF Arbitrum Safe multisig will be activated within 30 days of Wyoming DAO LLC formal charter registration. On-chain treasury streams will populate following inaugural key-ceremony deployment.
                    </p>
                  </div>
                ) : null}

                 <div className="mt-6 text-center font-vt323 text-sm">
                   <div className="text-gray-500">[ FULFILLING_ARTICLE_II: RADICAL_TRANSPARENCY ]</div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
    </>
  );
}
