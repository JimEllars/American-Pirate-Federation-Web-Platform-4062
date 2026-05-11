import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import SafeIcon from '../../common/SafeIcon';

export function MusterRoll() {
  const { musterRollDraft, updateMusterRoll } = useAppStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMusterRoll({ status: 'queued' });
    alert('ENLISTMENT DATA QUEUED FOR TRANSMISSION.');
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
            Commit to Ledger
          </button>
          
          {musterRollDraft.status === 'queued' && (
             <div className="text-green-500 font-vt323 text-center animate-pulse">
                STATUS: DATA_QUEUED_FOR_SYNC_ON_NEXT_NODE_CONTACT
             </div>
          )}
        </form>
      </div>
    </div>
  );
}