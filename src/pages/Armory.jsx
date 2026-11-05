import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import { useAXiMHydration } from '../hooks/useAXiMHydration';
import { useActiveAccount, useActiveWalletConnectionStatus, useActiveWalletChain } from "thirdweb/react";
import { SwitchNetworkButton } from '../components/web3/SwitchNetworkButton';
import { logRequisition, logSignatureRejection } from '../lib/api/telemetry';
import DOMPurify from 'isomorphic-dompurify';
import ArmoryCategoryBar from '../components/ui/ArmoryCategoryBar';


export function Armory() {
  const { userRole, passport, openPassport, reputationPoints, spendReputation, requisitionHistory, addRequisition, reputationHistory, isSigning, setIsSigning, addToast } = useAppStore();
  const member = passport.member;
  const account = useActiveAccount();
  const address = account?.address;
  const connectionStatus = useActiveWalletConnectionStatus();
  const chain = useActiveWalletChain();
  // Arbitrum One, or Sepolia 421614 when the platform is pointed at the test chain — the
  // same pair `Layout` treats as in-network. This used to be `const switchChain = () => {}`,
  // so the gate below had no working exit.
  const isMismatched = Boolean(chain?.id) && chain.id !== 42161 && chain.id !== 421614;
  const [procuring, setProcuring] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const categories = ['ALL', 'HARDWARE', 'APPAREL', 'TECH'];
  const [showRepLog, setShowRepLog] = useState(false);
  const { fetchArmoryInventory, loading: hydrationLoading } = useAXiMHydration();
  const [liveInventory, setLiveInventory] = useState([]);

  const filteredInventory = liveInventory.filter(item => activeCategory === 'ALL' ? true : item.type.toLowerCase() === activeCategory.toLowerCase());
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadInventory = async () => {
      setInventoryLoading(true);
      try {
        const data = await fetchArmoryInventory();
        if (isMounted) {
          // Law 1: an empty armory renders the empty state. It used to fall back to a
          // three-item catalogue of Unsplash stock photos presented as Federation
          // provisions, so /shop always looked stocked while armory_inventory held 0 rows.
          if (isMounted) setLiveInventory(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) setLiveInventory([]);
      } finally {
        if (isMounted) setInventoryLoading(false);
      }
    };
    loadInventory();
    return () => { isMounted = false; };
  }, [fetchArmoryInventory]);

  /**
   * Clearance is the rank on the member record (audit F39), and a requisition is signed by
   * the connected wallet — so both are required. The local draft's `status`/`walletAddress`
   * used to stand in for the Federation's record here, which meant a visitor who had typed
   * an alias into this browser could unlock restricted provisions.
   */
  const isEligible = (req) => {
    if (req === 'Unverified') return true;
    if (!member || !address) return false;

    if (req === 'Deckhand') return ['Deckhand', 'Navigator', 'Guild Master'].includes(member.role);
    if (req === 'Navigator') return ['Navigator', 'Guild Master'].includes(member.role);
    if (req === 'Guild Master') return member.role === 'Guild Master';

    return false;
  };

  const handleRequisition = async (item) => {
    if (!address) {
      addToast('[ SYSTEM ERROR: UNAUTHORIZED NODE ]', 'error');
      return;
    }
    if (reputationPoints < item.price) {
      addToast(`[ INSUFFICIENT REPUTATION: REQUIRE ${item.price} PTS ]`, 'error');
      return;
    }
    if (!isEligible(item.requirement) || isSigning) return;

    setProcuring(item.id);
    setIsSigning(true);
    try {
      if (account) {
          await account.signMessage("Authorize APF Requisition Transfer for: " + item.name);
      }
      spendReputation(item.price);
      addRequisition(item);
      logRequisition();
      addToast(`[ AUTHORIZED: ${item.name} PROVISIONED ]`, 'success');
    } catch (err) {
      if (err.code === 4001 || (err.message && err.message.toLowerCase().includes('user rejected'))) {
        logSignatureRejection('/armory');
        addToast('[ SIGNATURE REJECTED - REQUISITION DENIED ]', 'error');
      } else {
        addToast('[ AUTHORIZATION FAILED ]', 'error');
      }
    } finally {
      setIsSigning(false);
      setProcuring(null);
    }
  };

  if (connectionStatus === 'connected' && isMismatched) {
    return (
      <Layout>
        <SEO
          title="Secure Channel | The Federation"
          description="Arbitrum Network Required."
        />
        <PageTransition>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col min-h-[calc(100vh-64px)]">
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center p-12 bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500">
                <div className="text-white font-vt323 text-2xl mb-8 uppercase tracking-widest text-center">
                  [ SECURE CHANNEL: ARBITRUM NETWORK CONNECTION REQUIRED ]
                </div>
                <SwitchNetworkButton />
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }



  return (
    <Layout>
      <SEO title="The Armory | Quartermaster Provisions" description="Procure official Federation gear and sovereign hardware." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col min-h-[calc(100vh-64px)]">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
               <div className="flex items-center gap-4 mb-6">
                <SafeIcon name="Shield" className="h-10 w-10 text-apf-purple" />
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
                  The Armory
                </h1>
              </div>
              <p className="max-w-2xl text-gray-200 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
                Quartermaster Provisions. High-grade equipment for verified Federation units.
              </p>
            </div>

            {/* Clearance Status */}
            <div className="bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-4 font-vt323 text-sm inline-block min-w-[250px] relative z-20">
               <div className="text-gray-300 uppercase mb-1">Current Clearance</div>
               <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                 <div className={`h-2 w-2 rounded-full ${member ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <span className={member ? 'text-white' : 'text-gray-200'} title={member ? 'Filed on the muster roll' : 'No member record — file one in the muster form'}>
                   {userRole}
                 </span>
               </div>
               <div className="flex justify-between items-center text-xs relative cursor-pointer group" onClick={() => setShowRepLog(!showRepLog)}>
                 <span className="text-gray-300 uppercase flex items-center gap-1 group-hover:text-white transition-colors">
                     Reputation: <SafeIcon name="Info" className="h-3 w-3" />
                 </span>
                 <span className="text-apf-purpleLight font-bold" title="Local ledger for this browser — not a Federation record">
                   {reputationPoints} PTS
                 </span>

                 {/* Reputation Log Dropdown */}
                 {showRepLog && (
                     <div className="absolute top-full right-0 mt-2 w-64 bg-black border border-gray-800 shadow-2xl p-4 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                         <div className="text-gray-200 text-xs uppercase mb-2 border-b border-gray-800 pb-1">Reputation Logs</div>
                         <div className="text-[10px] text-gray-500 mb-2 leading-snug">Local to this browser. Not a Federation record.</div>
                         {reputationHistory && reputationHistory.length > 0 ? (
                             <ul className="space-y-2">
                                 {reputationHistory.map((log, idx) => (
                                     <li key={idx} className="flex justify-between items-start text-xs">
                                         <span className="text-gray-300">{log.action}</span>
                                         <span className="text-apf-emerald ml-2">+{log.amount}</span>
                                     </li>
                                 ))}
                             </ul>
                         ) : (
                             <div className="text-gray-600 text-xs text-center py-2">No civic actions recorded.</div>
                         )}
                     </div>
                 )}
               </div>
               {!member && (
                 <button
                   type="button"
                   onClick={openPassport}
                   className="mt-2 text-xs text-apf-purple underline underline-offset-4 hover:text-white text-left"
                 >
                   No member record — open a Pirate Passport
                 </button>
               )}
            </div>
          </div>

          <ArmoryCategoryBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} categories={categories} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 flex-grow">
             {inventoryLoading ? (
                 <div className="col-span-full py-12 flex justify-center items-center">
                    <div className="bg-black/40 backdrop-blur-md transform-gpu border border-[#10B981]/10 p-6 rounded-lg shadow-2xl">
                        <div className="text-[#10B981] font-vt323 text-lg animate-pulse">
                            [ QUARTERMASTER: RE-INDEXING AVAILABLE HARDWARE MATRIX... ]
                        </div>
                    </div>
                 </div>
             ) : filteredInventory.length === 0 ? (
                 <div className="col-span-full py-16 flex justify-center">
                    <div className="max-w-xl w-full bg-black/40 backdrop-blur-md border border-dashed border-gray-800 p-8 text-center">
                        <SafeIcon name="Package" className="mx-auto h-10 w-10 text-gray-600 mb-4" />
                        <div className="font-vt323 text-lg text-gray-300 uppercase tracking-widest mb-2">
                            {liveInventory.length === 0 ? 'The Armory is not stocked yet' : `No provisions in ${activeCategory}`}
                        </div>
                        <p className="font-sans text-sm text-gray-500 leading-relaxed">
                            {liveInventory.length === 0
                              ? 'Provisions appear here only once they exist in Federation inventory. Nothing is listed speculatively.'
                              : 'Try another category.'}
                        </p>
                    </div>
                 </div>
             ) : filteredInventory.map((item) => {
               const eligible = isEligible(item.requirement);
               const canAfford = reputationPoints >= item.price;

               return (
                 <div key={item.id} className="bg-black/60 backdrop-blur-2xl border border-white/5 hover:border-apf-purple/40 shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                    {/* Item Image */}
                    <div className="h-64 relative overflow-hidden bg-gray-900 border-b border-white/5">
                      <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay z-10 !pointer-events-none" />
                      <img
                        src={item.image}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${eligible ? 'group-hover:scale-110' : 'grayscale opacity-50'}`}
                      />
                      {!eligible && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm !pointer-events-none">
                           <div className="text-center font-vt323">
                              <SafeIcon name="Lock" className="mx-auto h-8 w-8 text-red-500 mb-2" />
                              <div className="text-red-500 font-bold uppercase tracking-widest text-sm">Restricted Access</div>
                              <div className="text-gray-200 text-xs mt-1">Requires {item.requirement} Clearance</div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-grow flex flex-col z-20">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <span className="font-vt323 text-xs text-apf-purple uppercase tracking-widest border border-apf-purple/30 px-2 py-1 mb-2 inline-block bg-apf-purple/10">
                             {item.type}
                           </span>
                           <h3 className="text-xl font-bold text-white leading-tight">{item.name}</h3>
                         </div>
                       </div>

                       <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-800/50">
                         <span className={`font-vt323 text-lg ${canAfford ? 'text-white' : 'text-red-500'}`}>
                           {item.price} PTS
                         </span>
                         <button
                           disabled={!eligible || procuring === item.id || !canAfford || isSigning}
                           onClick={() => handleRequisition(item)}
                           className={`px-4 py-2 min-h-[44px] font-vt323 text-xs uppercase tracking-widest transition-all border ${
                             isSigning ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-300' :
                             !eligible || !canAfford
                             ? 'border-gray-800 text-gray-600 cursor-not-allowed bg-black/50'
                             : 'border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white'
                           }`}
                         >
                           {procuring === item.id ? 'Requisitioning...' : (!eligible ? 'Locked' : (!canAfford ? 'Insufficient Pts' : 'Requisition'))}
                         </button>
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>

          {/* Requisition History Logs */}
          <div className="mt-16 border-t border-gray-800 pt-8">
            <h3 className="font-vt323 text-xl text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <SafeIcon name="List" className="text-apf-purple h-5 w-5" /> [ SECURE_LOGISTICS_LEDGER // PROVISION_TRANSCRIPTS ]
            </h3>
            <div className="bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6 overflow-hidden">
              {requisitionHistory && requisitionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left font-vt323 text-sm">
                          <thead className="text-xs text-gray-300 uppercase bg-gray-900/50 border-y border-gray-800">
                              <tr>
                                  <th className="px-4 py-2 min-h-[44px]">Item</th>
                                  <th className="px-4 py-2 min-h-[44px]">Type</th>
                                  <th className="px-4 py-2 min-h-[44px] text-right">Cost</th>
                                  <th className="px-4 py-2 min-h-[44px] text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody>
                              {requisitionHistory.map((req, idx) => (
                                  <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                      <td className="px-4 py-3 text-white">{DOMPurify.sanitize(req.name)}</td>
                                      <td className="px-4 py-3 text-gray-200">{DOMPurify.sanitize(req.type || 'Standard')}</td>
                                      <td className="px-4 py-3 text-right text-red-400">-{req.cost} PTS</td>
                                      <td className="px-4 py-3 text-right">
                                          <span className="text-[10px] uppercase tracking-widest border border-[#10B981] text-[#10B981] bg-[#10B981]/10 px-2 py-1">
                                              STATUS: AUTHORIZED
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div className="p-8 text-center text-gray-300 font-vt323 text-sm uppercase">
                      [ NO LOGISTICAL PROVISIONS AUTHORIZED TO CURRENT NODE ID ]
                  </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
