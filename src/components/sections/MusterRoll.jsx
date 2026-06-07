import React, { useEffect } from 'react';
import { useAddress, useSigner } from '@thirdweb-dev/react';
import { useAppStore } from '../../store/useAppStore';
import SafeIcon from '../../common/SafeIcon';
import DOMPurify from 'isomorphic-dompurify';

export function MusterRoll() {
  const [rejectError, setRejectError] = React.useState(false);
    const { musterRollDraft, updateMusterRoll } = useAppStore();
  const address = useAddress();
  const signer = useSigner();

  useEffect(() => {
    if (address && musterRollDraft.walletAddress !== address) {
      updateMusterRoll({ walletAddress: address });
    } else if (!address && musterRollDraft.walletAddress) {
      updateMusterRoll({ walletAddress: '' });
    }
  }, [address, musterRollDraft.walletAddress, updateMusterRoll]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) return;
    updateMusterRoll({ status: 'queued' });

    const sanitizedData = {
      alias: DOMPurify.sanitize(musterRollDraft.alias),
      comms: DOMPurify.sanitize(musterRollDraft.comms),
      skills: DOMPurify.sanitize(musterRollDraft.skills),
      walletAddress: DOMPurify.sanitize(musterRollDraft.walletAddress)
    };
    console.log('Sanitized Data Ready for Sync:', sanitizedData);

    try {
      if (signer) {
        await signer.signMessage("Authorize APF Entry for: " + sanitizedData.alias);
      }
      // Simulate Firestore Backend Sync to /artifacts/apf/users/
      await new Promise(resolve => setTimeout(resolve, 500));
      updateMusterRoll({ status: 'committed' });
    } catch (err) {
      if (err.code === 4001 || (err.message && err.message.toLowerCase().includes('user rejected'))) {
        updateMusterRoll({ status: 'idle' });
        setRejectError(true);
        setTimeout(() => setRejectError(false), 5000);
      } else {
        updateMusterRoll({ status: 'error' });
      }
    }
  };

  return (
    <div id="join" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-12 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-apf-purple to-transparent" />

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-cinzel font-black uppercase tracking-widest mb-4">
            Authorize Connection Sequence
          </h2>
          <p className="font-vt323 text-apf-purple text-lg uppercase tracking-[0.3em]">
            [ INITIALIZE_CONNECTION_SEQUENCE ]
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-4 mb-8 relative">
            {!address && (
              <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
                <p className="font-vt323 text-apf-purple text-center tracking-widest uppercase">
                  [ ENCRYPTION KEY REQUIRED. CONNECT WALLET TO AUTHORIZE CONNECTION SEQUENCE. ]
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="walletAddress">
                Primary Sovereign Identifier
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="walletAddress"
                  type="text"
                  readOnly
                  disabled
                  value={musterRollDraft.walletAddress || ''}
                  className="w-full bg-black border-b border-gray-800 p-3 text-white opacity-70 font-vt323 text-lg transition-colors cursor-not-allowed"
                  placeholder="0x..."
                />
                <SafeIcon name="Key" className="text-apf-emerald" />
              </div>
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
            disabled={!address}
            className={`w-full font-cinzel font-bold py-5 px-8 transition-all uppercase tracking-widest flex justify-center items-center gap-3 text-xl ${
              address
                ? 'bg-apf-purple hover:bg-white hover:text-apf-black text-white shadow-[0_0_20px_rgba(148,0,255,0.3)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <SafeIcon name="UploadCloud" />
            {address ? '[ SIGN PAYLOAD & AUTHORIZE ENTRY ]' : 'Authorize Entry Protocol'}
          </button>

          {musterRollDraft.status === 'queued' && (
             <div className="text-apf-purple font-vt323 text-center animate-pulse">
                STATUS: SYNCING_TO_LEDGER...
             </div>
          )}
          {musterRollDraft.status === 'committed' && (
             <div className="text-green-500 font-vt323 text-center">
                STATUS: AUTHORIZATION_DATA_COMMITTED_TO_SOVEREIGN_LEDGER
             </div>
          )}
          {rejectError && (
             <div className="text-red-500 font-vt323 text-center border border-white/5 bg-black/60 backdrop-blur-2xl shadow-2xl p-4">
                [ ENCRYPTION SIGNATURE REJECTED BY USER ]
             </div>
          )}
        </form>
      </div>
    </div>
  );
}
