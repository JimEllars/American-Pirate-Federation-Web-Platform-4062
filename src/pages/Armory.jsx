import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';

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
  const { userRole, musterRollDraft, reputationPoints, spendReputation } = useAppStore();
  const [procuring, setProcuring] = useState(null);

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
    if (reputationPoints >= item.price) {
      setProcuring(item.id);
      setTimeout(() => {
        spendReputation(item.price);
        setProcuring(null);
        // Alert is generally bad practice, but good enough for a mock
        // alert(`\${item.name} procured successfully.`);
      }, 1000);
    } else {
      // alert('Insufficient Reputation Points.');
    }
  };

  return (
    <Layout>
      <SEO title="The Armory | Quartermaster Provisions" description="Procure official Federation gear and sovereign hardware." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
               <div className="flex items-center gap-4 mb-6">
                <SafeIcon name="Shield" className="h-10 w-10 text-apf-purple" />
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                  The Armory
                </h1>
              </div>
              <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
                Quartermaster Provisions. High-grade equipment for verified Federation units.
              </p>
            </div>

            {/* Clearance Status */}
            <div className="bg-black/60 border border-gray-800 p-4 font-vt323 text-sm inline-block min-w-[250px]">
               <div className="text-gray-500 uppercase mb-1">Current Clearance</div>
               <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                 <div className={`h-2 w-2 rounded-full ${musterRollDraft.walletAddress ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <span className={musterRollDraft.walletAddress ? 'text-white' : 'text-gray-400'}>
                   {userRole}
                 </span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500 uppercase">Reputation:</span>
                 <span className="text-apf-purpleLight font-bold">{reputationPoints} PTS</span>
               </div>
               {!musterRollDraft.walletAddress && (
                 <div className="mt-2 text-xs text-apf-purple">Connect wallet to upgrade clearance</div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {PROVISIONS.map((item) => {
               const eligible = isEligible(item.requirement);
               const canAfford = reputationPoints >= item.price;

               return (
                 <div key={item.id} className="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-apf-purple/50 transition-all group relative overflow-hidden flex flex-col">
                    {/* Item Image */}
                    <div className="h-64 relative overflow-hidden bg-gray-900 border-b border-white/5">
                      <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay z-10" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${eligible ? 'group-hover:scale-110' : 'grayscale opacity-50'}`}
                      />
                      {!eligible && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
                           <div className="text-center font-vt323">
                              <SafeIcon name="Lock" className="mx-auto h-8 w-8 text-red-500 mb-2" />
                              <div className="text-red-500 font-bold uppercase tracking-widest text-sm">Restricted Access</div>
                              <div className="text-gray-400 text-xs mt-1">Requires {item.requirement} Clearance</div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-grow flex flex-col">
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
        </div>
      </PageTransition>
    </Layout>
  );
}
