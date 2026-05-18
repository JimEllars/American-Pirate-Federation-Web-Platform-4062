import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import SafeIcon from '../../common/SafeIcon';
import DOMPurify from 'isomorphic-dompurify';

export function MusterRoll() {
    const { musterRollDraft, updateMusterRoll } = useAppStore();

  const handleConnectWallet = async () => {
    // Simulated Web3 connection
    updateMusterRoll({ walletAddress: '0x' + Math.random().toString(16).substr(2, 40) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateMusterRoll({ status: 'queued' });

    const sanitizedData = {
      alias: DOMPurify.sanitize(musterRollDraft.alias),
      comms: DOMPurify.sanitize(musterRollDraft.comms),
      skills: DOMPurify.sanitize(musterRollDraft.skills),
      walletAddress: DOMPurify.sanitize(musterRollDraft.walletAddress)
    };

    // Simulate Firestore Backend Sync to /artifacts/apf/users/
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('Syncing to Firestore /artifacts/apf/users/ ...', sanitizedData);
      updateMusterRoll({ status: 'committed' });
    } catch (err) {
      updateMusterRoll({ status: 'error' });
    }
  };

  return (
    <div id="enlist" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-apf-gray border border-apf-purple/30 p-12 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-apf-purple to-transparent" />

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-cinzel font-black uppercase tracking-widest mb-4">
            Join the Fleet
          </h2>
          <p className="font-vt323 text-apf-purple text-lg uppercase tracking-[0.3em]">
            [ INITIALIZE_CONNECTION_SEQUENCE ]
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
               <button
                 type="button"
                 onClick={handleConnectWallet}
                 className="bg-apf-purple/20 hover:bg-apf-purple/40 border border-apf-purple text-white font-vt323 px-4 py-2 transition-colors flex items-center gap-2"
               >
                 <SafeIcon name="Key" />
                 {musterRollDraft.walletAddress ? 'Identity Connected' : 'Connect Wallet (Web3)'}
               </button>
               {musterRollDraft.walletAddress && (
                 <div className="flex flex-col">
                   <span className="font-vt323 text-gray-500 text-[10px] uppercase tracking-widest">Primary Sovereign Identifier</span>
                   <span className="font-vt323 text-apf-emerald text-sm truncate max-w-[200px] block">
                     {musterRollDraft.walletAddress}
                   </span>
                 </div>
               )}
            </div>
            <p className="font-vt323 text-xs text-gray-500 uppercase">Article VII: Data Ownership. Authorize Entry Protocol to claim sovereign identity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="alias">
                Alias_Callsign
              </label>
              <input
                id="alias"
                type="text"
                required
                value={musterRollDraft.alias}
                onChange={(e) => updateMusterRoll({ alias: e.target.value })}
                className="w-full bg-black border-b border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors"
                placeholder="Ex: Ghost_Vessel"
              />
            </div>

            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="comms">
                Signal_Endpoint
              </label>
              <input
                id="comms"
                type="text"
                required
                value={musterRollDraft.comms}
                onChange={(e) => updateMusterRoll({ comms: e.target.value })}
                className="w-full bg-black border-b border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors"
                placeholder="SIGNAL_ENDPOINT"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="skills">
              Primary_Skillset
            </label>
            <textarea
              id="skills"
              rows={3}
              value={musterRollDraft.skills}
              onChange={(e) => updateMusterRoll({ skills: e.target.value })}
              className="w-full bg-black border border-gray-800 p-4 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors resize-none"
              placeholder="Code, Logistics, Agitprop, Healthcare..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-apf-purple hover:bg-white hover:text-apf-black text-white font-cinzel font-bold py-5 px-8 transition-all uppercase tracking-widest flex justify-center items-center gap-3 text-xl shadow-[0_0_20px_rgba(148,0,255,0.3)]"
          >
            <SafeIcon name="UploadCloud" />
            Execute Enlistment Directive
          </button>

          {musterRollDraft.status === 'queued' && (
             <div className="text-apf-purple font-vt323 text-center animate-pulse">
                STATUS: SYNCING_TO_LEDGER...
             </div>
          )}
          {musterRollDraft.status === 'committed' && (
             <div className="text-green-500 font-vt323 text-center">
                STATUS: ENLISTMENT_DATA_COMMITTED_TO_SOVEREIGN_LEDGER
             </div>
          )}
        </form>
      </div>
    </div>
  );
}
