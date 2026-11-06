import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
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
          title="Network Required | The Armory"
          description="The Armory settles on Arbitrum One. Switch networks to continue."
        />
        <PageTransition>
          <div className="apf-container py-14 sm:py-20 flex flex-col min-h-[calc(100vh-64px)]">
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="apf-card flex max-w-md flex-col items-center justify-center p-10 text-center">
                <div className="mb-6 text-center">
                  <p className="text-xl font-semibold text-white">Switch to Arbitrum</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    The Armory settles on Arbitrum One. Switch networks to continue.
                  </p>
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
        <div className="apf-container py-14 sm:py-20 flex flex-col min-h-[calc(100vh-64px)]">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <PageHeader
                icon="Shield"
                kicker="Quartermaster"
                title="The Armory"
                lede="Provisions and sovereign hardware for Federation units. Reputation is earned on the muster roll; it is never seeded."
                className="mb-0"
              />
            </div>

            {/* Clearance Status */}
            <div className="apf-card relative z-20 inline-block min-w-[250px] p-4 text-sm">
               <div className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Current clearance</div>
               <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                 <div className={`h-2 w-2 rounded-full ${member ? 'bg-emerald-400' : 'bg-red-400'}`} />
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
                     <div className="absolute right-0 top-full z-50 mt-2 max-h-48 w-64 overflow-y-auto rounded-xl border border-white/10 bg-surface-800 p-4 shadow-lift">
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
                    <div className="apf-card p-6">
                        <div className="flex items-center gap-3 text-sm text-ink-muted">
                            <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
                            Loading inventory…
                        </div>
                    </div>
                 </div>
             ) : filteredInventory.length === 0 ? (
                 <div className="col-span-full flex justify-center py-16">
                    <div className="w-full max-w-xl rounded-2xl border border-dashed border-white/[0.1] bg-surface-900/40 p-8 text-center">
                        <SafeIcon name="Package" className="mx-auto h-10 w-10 text-gray-600 mb-4" />
                        <div className="mb-2 text-base font-medium text-white">
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
                 <div key={item.id} className="apf-card apf-card-hover group relative flex flex-col overflow-hidden">
                    {/* Item Image */}
                    <div className="relative h-56 overflow-hidden border-b border-white/[0.06] bg-surface-800">
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
                    <div className="z-20 flex flex-grow flex-col p-5">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <span className="mb-2 inline-block rounded-md border border-apf-purple/25 bg-apf-purple/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-apf-purpleLight">
                             {item.type}
                           </span>
                           <h3 className="text-base font-semibold leading-snug text-white">{item.name}</h3>
                         </div>
                       </div>

                       <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-5">
                         <span className={`font-mono text-sm ${canAfford ? 'text-white' : 'text-red-400'}`}>
                           {item.price} PTS
                         </span>
                         <button
                           disabled={!eligible || procuring === item.id || !canAfford || isSigning}
                           onClick={() => handleRequisition(item)}
                           className={`min-h-[38px] rounded-lg border px-4 text-xs font-medium transition-colors ${
                             isSigning ? 'cursor-not-allowed bg-white/[0.04] text-ink-dim' :
                             !eligible || !canAfford
                             ? 'cursor-not-allowed border-white/[0.06] text-ink-dim'
                             : 'border-white/[0.12] text-ink-muted hover:border-white/25 hover:text-white'
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
          <div className="mt-16 border-t border-white/[0.06] pt-10">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
                <SafeIcon name="List" className="h-4 w-4 text-apf-purpleLight" /> Requisition history
            </h3>
            <div className="apf-card hover:border-white/15 transition-all duration-500 p-6 overflow-hidden">
              {requisitionHistory && requisitionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="border-y border-white/[0.06] bg-white/[0.02] text-[10px] uppercase tracking-[0.12em] text-ink-dim">
                              <tr>
                                  <th className="px-4 py-2.5 font-medium">Item</th>
                                  <th className="px-4 py-2.5 font-medium">Type</th>
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
                                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] text-emerald-300">
                                              Authorized
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div className="p-10 text-center text-sm text-ink-dim">
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
