import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import DOMPurify from 'isomorphic-dompurify';

const PROVISIONS = [
  {
    id: 'badge-1',
    name: 'Federation Deckhand Pin',
    price: 15,
    type: 'Hardware',
    image: 'https://images.unsplash.com/photo-1614729939124-03290b5509ce?w=500&auto=format&fit=crop&q=60',
    requirement: 'Deckhand'
  },
  {
    id: 'hoodie-1',
    name: 'Stealth-Mesh Protocol Hoodie',
    price: 45,
    type: 'Apparel',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60',
    requirement: 'Unverified' // Open to all
  },
  {
    id: 'comms-1',
    name: 'Encrypted Comms Module',
    price: 120,
    type: 'Tech',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    requirement: 'Navigator'
  }
];

export function Armory() {
  const { userRole, musterRollDraft, reputationPoints, spendReputation, requisitionHistory, addRequisition, reputationHistory } = useAppStore();
  const [procuring, setProcuring] = useState(null);
  const [showRepLog, setShowRepLog] = useState(false);

  const isEligible = (req) => {
    if (req === 'Unverified') return true;
    const isCommitted = musterRollDraft.status === 'committed';
    const hasWallet = !!musterRollDraft.walletAddress;

    if (req === 'Deckhand' && hasWallet && ['Deckhand', 'Navigator', 'Guild Master'].includes(userRole)) return true;
    if (req === 'Navigator' && hasWallet && isCommitted && ['Navigator', 'Guild Master'].includes(userRole)) return true;
    if (req === 'Guild Master' && hasWallet && isCommitted && userRole === 'Guild Master') return true;

    return false;
  };

  const handleRequisition = (item) => {
    // Re-verify clearance before spending
    if (!isEligible(item.requirement)) {
        return;
    }

    if (reputationPoints >= item.price) {
      setProcuring(item.id);
      setTimeout(() => {
        spendReputation(item.price);
        addRequisition(item);
        setProcuring(null);
      }, 1000);
    }
  };

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
              <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
                Quartermaster Provisions. High-grade equipment for verified Federation units.
              </p>
            </div>

            {/* Clearance Status */}
            <div className="bg-black/60 border border-gray-800 p-4 font-vt323 text-sm inline-block min-w-[250px] relative z-20">
               <div className="text-gray-500 uppercase mb-1">Current Clearance</div>
               <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                 <div className={`h-2 w-2 rounded-full ${musterRollDraft.walletAddress ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <span className={musterRollDraft.walletAddress ? 'text-white' : 'text-gray-400'}>
                   {userRole}
                 </span>
               </div>
               <div className="flex justify-between items-center text-xs relative cursor-pointer group" onClick={() => setShowRepLog(!showRepLog)}>
                 <span className="text-gray-500 uppercase flex items-center gap-1 group-hover:text-white transition-colors">
                     Reputation: <SafeIcon name="Info" className="h-3 w-3" />
                 </span>
                 <span className="text-apf-purpleLight font-bold">{reputationPoints} PTS</span>

                 {/* Reputation Log Dropdown */}
                 {showRepLog && (
                     <div className="absolute top-full right-0 mt-2 w-64 bg-black border border-gray-800 shadow-2xl p-4 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                         <div className="text-gray-400 text-xs uppercase mb-2 border-b border-gray-800 pb-1">Reputation Logs</div>
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
               {!musterRollDraft.walletAddress && (
                 <div className="mt-2 text-xs text-apf-purple">Connect wallet to upgrade clearance</div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-grow">
             {PROVISIONS.map((item) => {
               const eligible = isEligible(item.requirement);
               const canAfford = reputationPoints >= item.price;

               return (
                 <div key={item.id} className="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-apf-purple/50 transition-all group relative overflow-hidden flex flex-col">
                    {/* Item Image */}
                    <div className="h-64 relative overflow-hidden bg-gray-900 border-b border-white/5">
                      <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay z-10 pointer-events-none" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${eligible ? 'group-hover:scale-110' : 'grayscale opacity-50'}`}
                      />
                      {!eligible && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm pointer-events-none">
                           <div className="text-center font-vt323">
                              <SafeIcon name="Lock" className="mx-auto h-8 w-8 text-red-500 mb-2" />
                              <div className="text-red-500 font-bold uppercase tracking-widest text-sm">Restricted Access</div>
                              <div className="text-gray-400 text-xs mt-1">Requires {item.requirement} Clearance</div>
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
                           disabled={!eligible || procuring === item.id || !canAfford}
                           onClick={() => handleRequisition(item)}
                           className={`px-4 py-2 font-vt323 text-xs uppercase tracking-widest transition-all border ${
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
                <SafeIcon name="List" className="text-apf-purple h-5 w-5" /> Sovereign Provisioning Logs
            </h3>
            {requisitionHistory && requisitionHistory.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-vt323 text-sm">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-y border-gray-800">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Item</th>
                                <th className="px-4 py-2 text-right">Cost</th>
                                <th className="px-4 py-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requisitionHistory.map((req, idx) => (
                                <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-gray-400">{new Date(req.date).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-white">{DOMPurify.sanitize(req.name)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">-{req.cost} PTS</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-[10px] uppercase tracking-widest border border-apf-emerald/30 text-apf-emerald bg-apf-emerald/10 px-2 py-1">
                                            {DOMPurify.sanitize(req.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center border border-dashed border-gray-800 text-gray-500 font-vt323 text-sm uppercase">
                    [ No active requisitions found for this sovereign identity ]
                </div>
            )}
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
