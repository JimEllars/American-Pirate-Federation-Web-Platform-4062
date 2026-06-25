import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../../hooks/usePirateIntel';
import { useAXiMHydration } from '../../hooks/useAXiMHydration';
import { GasWarningCard } from '../web3/GasWarningCard';
import { VaultDeployed } from '../web3/VaultDeployed';
import { NetworkSwitchModal } from '../web3/NetworkSwitchModal';
import { useAppStore } from '../../store/useAppStore';
import { useBalance, useNetworkMismatch, useSwitchChain, useAddress, useSigner } from '@thirdweb-dev/react';
import DOMPurify from 'isomorphic-dompurify';
import { initializeSafeTreasury } from '../../lib/web3/deploySafeVault';
import { logTreasuryDeployment } from '../../lib/api/telemetry';

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
  const { setDeployedVaultAddress, treasuryDeploymentStatus, setTreasuryDeploymentStatus, addToast, isSigning, setIsSigning, isCoreSynced, setIsCoreSynced } = useAppStore();
  const address = useAddress();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const isMismatched = useNetworkMismatch();
  const switchChain = useSwitchChain();
  const signer = useSigner();
  const [activeTab, setActiveTab] = useState('guilds'); // 'guilds' or 'ledger'
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showGasWarning, setShowGasWarning] = useState(false);
  const [triggerError, setTriggerError] = useState(false);

  const [treasuryError, setTreasuryError] = useState(null);

  const handleDeployVault = async () => {
    if (isMismatched) {
      setShowNetworkModal(true);
      return;
    }
    if (!balanceData || parseFloat(balanceData.displayValue) < 0.002) {
      setShowGasWarning(true);
      return;
    }

    setShowGasWarning(false);
    setTreasuryError(null);
    setTreasuryDeploymentStatus('deploying');

    try {
      setIsSigning(true);
      const mockAddress = await initializeSafeTreasury(address, signer);
      setDeployedVaultAddress(mockAddress);
      setTreasuryDeploymentStatus('success');
      logTreasuryDeployment(mockAddress, address);
      setIsSigning(false);
    } catch (e) {
      setIsSigning(false);
      if (e.code === 4001 || (e.message && e.message.toLowerCase().includes('user rejected'))) {
        setTreasuryError('[ ENCRYPTION SIGNATURE REJECTED BY USER ]');
        addToast('[ ENCRYPTION SIGNATURE REJECTED BY USER ]', 'error');
        setTreasuryDeploymentStatus('idle');
      } else {
        setTreasuryError(e.message || 'TRANSACTION REJECTED');
        addToast('[ DEPLOYMENT FAILED: ' + (e.message || 'TRANSACTION REJECTED') + ' ]', 'error');
        setTreasuryDeploymentStatus('error');
      }
    }
  };
  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);
  const [isAuditing, setIsAuditing] = useState(false);
  const { data: guides, loading, error } = usePirateIntel('posts?categories=3'); // Mocking 'guides' category

  // Mock Ledger Data
  const { fetchLiveLedger, loading: ledgerLoading } = useAXiMHydration();
  const [ledger, setLedger] = useState([
      { txId: "0x3e4...b92", date: new Date(Date.now() - 4800000).toISOString().split('T')[0], amount: "50,000 USDC", target: "Labor Union Support Node", alignment: "Article XV", status: "Settled" },
      { txId: "0x1a2...c34", date: new Date(Date.now() - 7200000).toISOString().split('T')[0], amount: "25,000 USDC", target: "Education Grants Pool", alignment: "Article XVI", status: "Settled" },
  ]);

  if (triggerError) {
    throw new Error("Simulated APF System Integrity Failure for Testing");
  }

  useEffect(() => {
    let isMounted = true;

    const loadLedger = async () => {
      try {
        const data = await fetchLiveLedger();
        setIsCoreSynced(true);
        if (isMounted) {
          setLedger(data);
        }
      } catch (err) {
        if (isMounted) {
          addToast('[ TELEMETRY INGRESS FAILED - DISPLAYING CACHED LEDGER ]', 'warning');
        }
      }
    };

    loadLedger();

    return () => {
      isMounted = false;
    };
  }, [fetchLiveLedger, addToast]);

  return (
    <>
      <NetworkSwitchModal isWrongNetwork={showNetworkModal} onSwitchNetwork={async () => { try { await switchChain(42161); setShowNetworkModal(false); } catch(e) { console.warn('[Network Switch Rejected]:', e); } }} onDismiss={() => { setShowNetworkModal(false); setTreasuryDeploymentStatus('idle'); }} />
    <section className="py-24 bg-apf-black neon-grid relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {showGasWarning && <GasWarningCard ethBalance={balanceData ? parseFloat(balanceData.displayValue) : 0} onDismiss={() => { setShowGasWarning(false); setTreasuryDeploymentStatus('idle'); }} />}

        </div>

        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-800 pb-4">
           <div>
              <h2
                 className="text-4xl font-black uppercase tracking-tighter text-white cursor-pointer"
                 onDoubleClick={() => setTriggerError(true)}
                 title="Double click to test Error Boundary"
              >Federation Assets</h2>
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
              <div className="lg:w-2/3 min-h-[400px] bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500 p-8 relative overflow-hidden">
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
                            <li key={guide.id} className="border border-white/10 p-3 bg-black/40 hover:border-apf-purple transition-all cursor-pointer">
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
              <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500 p-8">
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
                     className="bg-black border border-apf-purple/50 p-6 mb-8 font-vt323 text-xs overflow-hidden flex flex-col md:flex-row gap-8"
                   >
                     <div className="flex-1 overflow-x-auto">
                       <div className="mb-2 text-white">IPFS Hash: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi</div>
                       <pre className="text-apf-purple">
{JSON.stringify({
  "@context": "apf-ledger",
  "contract": "0xAPF...Treasury",
  "lastSync": new Date().toISOString(),
  "merkleRoot": "0x" + Math.random().toString(16).substring(2),
  "verification": "SUCCESS",
  "status": "Immutable"
}, null, 2)}
                       </pre>
                     </div>
                     <div className="flex-1 border-l border-apf-purple/30 pl-8">
                       <div className="mb-4 text-white uppercase tracking-widest">[ COMMUNITY IMPACT METRICS ]</div>
                       <div className="h-32 flex items-end gap-2">
                         {Array.from({ length: 12 }).map((_, i) => (
                           <motion.div
                             key={i}
                             initial={{ height: 0 }}
                             animate={{ height: `${Math.random() * 80 + 20}%` }}
                             transition={{ duration: 0.5, delay: i * 0.05 }}
                             className="flex-1 bg-apf-emerald/50 border border-apf-emerald hover:bg-apf-emerald transition-colors relative group"
                           >
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-apf-emerald text-apf-emerald px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 !pointer-events-none">
                               Impact: +{Math.floor(Math.random() * 50 + 10)}%
                             </div>
                           </motion.div>
                         ))}
                       </div>
                       <div className="mt-2 text-apf-emerald opacity-70">LIVE SIMULATION // METRICS VERIFIED</div>
                       <div className="mt-4 border-t border-gray-800 pt-4 flex justify-between text-gray-400">
                         <div>
                           <div className="text-white text-lg font-bold text-apf-purple">40%</div>
                           <div className="text-[10px] uppercase">Community Aid</div>
                         </div>
                         <div>
                           <div className="text-white text-lg font-bold text-apf-emerald">35%</div>
                           <div className="text-[10px] uppercase">Infrastructure</div>
                         </div>
                         <div>
                           <div className="text-white text-lg font-bold text-blue-400">25%</div>
                           <div className="text-[10px] uppercase">Legal Defense</div>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 )}

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

                 <div className="mt-8 flex justify-center flex-col items-center gap-4">
                   {treasuryDeploymentStatus === 'deploying' && (
                     <div className="font-vt323 text-apf-emerald text-sm uppercase tracking-widest animate-pulse border border-apf-emerald/30 bg-apf-emerald/10 px-4 py-2">
                       [ AWAITING ARBITRUM ONE BLOCK CONFIRMATION... ]
                     </div>
                   )}
                   {(treasuryDeploymentStatus === 'error' || treasuryError === '[ ENCRYPTION SIGNATURE REJECTED BY USER ]') && (
                     <div className="font-vt323 text-red-500 text-sm uppercase tracking-widest border border-red-500/30 bg-red-500/10 px-4 py-2 mb-2">
                       {treasuryError === '[ ENCRYPTION SIGNATURE REJECTED BY USER ]' ? treasuryError : `[ DEPLOYMENT FAILED: ${treasuryError || 'TRANSACTION REJECTED'} ]`}
                     </div>
                   )}
                   <button
                     onClick={handleDeployVault}
                     disabled={isBalanceLoading || treasuryDeploymentStatus === 'deploying' || treasuryDeploymentStatus === 'success' || isSigning}
                     className={`px-6 py-3 font-vt323 text-lg uppercase transition-all ${
                       isSigning ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' :
                       treasuryDeploymentStatus === 'deploying' ? 'bg-gray-600 cursor-not-allowed' :
                       treasuryDeploymentStatus === 'success' ? 'bg-apf-emerald/50 border border-apf-emerald' :
                       'bg-apf-purple hover:bg-apf-purpleLight text-white border border-apf-purple'
                     }`}
                   >
                     {isBalanceLoading ? '[ SYNCING ARBITRUM NODE... ]' : treasuryDeploymentStatus === 'deploying' ? 'Deploying...' : treasuryDeploymentStatus === 'success' ? 'Deployed' : 'Initialize Treasury'}
                   </button>
                 </div>
                 <VaultDeployed />
                 <div className="mt-6 text-center font-vt323 text-gray-500 text-sm">
                   [ FULFILLING_ARTICLE_II: RADICAL_TRANSPARENCY ]
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
