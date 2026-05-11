import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';

const PROVISIONS = [
  {
    id: 'badge-1',
    name: 'Federation Deckhand Pin',
    price: '0.05 ETH',
    type: 'Hardware',
    image: 'https://images.unsplash.com/photo-1614729939124-03290b5509ce?w=500&auto=format&fit=crop&q=60',
    requirement: 'Deckhand'
  },
  {
    id: 'hoodie-1',
    name: 'Stealth-Mesh Protocol Hoodie',
    price: '0.12 ETH',
    type: 'Apparel',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60',
    requirement: 'Unverified' // Open to all
  },
  {
    id: 'comms-1',
    name: 'Encrypted Comms Module',
    price: '0.8 ETH',
    type: 'Tech',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    requirement: 'Navigator'
  }
];

export function Armory() {
  const { userRole, musterRollDraft } = useAppStore();

  const isEligible = (req) => {
    if (req === 'Unverified') return true;
    if (req === 'Deckhand' && ['Deckhand', 'Navigator', 'Guild Master'].includes(userRole)) return true;
    if (req === 'Navigator' && ['Navigator', 'Guild Master'].includes(userRole)) return true;
    if (req === 'Guild Master' && userRole === 'Guild Master') return true;
    return false;
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
              <p className="max-w-2xl text-gray-400 font-mono text-lg border-l-2 border-apf-purple pl-6">
                Quartermaster Provisions. High-grade equipment for verified Federation units.
              </p>
            </div>

            {/* Clearance Status */}
            <div className="bg-black/60 border border-gray-800 p-4 font-mono text-sm inline-block">
               <div className="text-gray-500 uppercase mb-1">Current Clearance</div>
               <div className="flex items-center gap-2">
                 <div className={`h-2 w-2 rounded-full ${musterRollDraft.walletAddress ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <span className={musterRollDraft.walletAddress ? 'text-white' : 'text-gray-400'}>
                   {userRole}
                 </span>
               </div>
               {!musterRollDraft.walletAddress && (
                 <div className="mt-2 text-xs text-apf-purple">Connect wallet to upgrade clearance</div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {PROVISIONS.map((item) => {
               const eligible = isEligible(item.requirement);

               return (
                 <div key={item.id} className="bg-black border border-gray-800 group relative overflow-hidden flex flex-col">
                    {/* Item Image */}
                    <div className="h-64 relative overflow-hidden bg-gray-900">
                      <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay z-10" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${eligible ? 'group-hover:scale-110' : 'grayscale opacity-50'}`}
                      />
                      {!eligible && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
                           <div className="text-center font-mono">
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
                           <span className="font-vt323 text-xs text-apf-purple uppercase tracking-widest border border-apf-purple/30 px-2 py-1 mb-2 inline-block">
                             {item.type}
                           </span>
                           <h3 className="text-xl font-bold text-white leading-tight">{item.name}</h3>
                         </div>
                       </div>

                       <div className="mt-auto pt-6 flex items-center justify-between">
                         <span className="font-vt323 text-lg text-white">{item.price}</span>
                         <button
                           disabled={!eligible}
                           className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all ${
                             eligible
                             ? 'bg-apf-purple text-white hover:bg-apf-purpleLight hover:text-black'
                             : 'border border-gray-800 text-gray-600 cursor-not-allowed'
                           }`}
                         >
                           {eligible ? 'Requisition' : 'Locked'}
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
