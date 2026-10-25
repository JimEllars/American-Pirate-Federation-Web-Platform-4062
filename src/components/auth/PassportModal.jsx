import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../lib/api/supabaseClient';
import { useAppStore } from '../../store/useAppStore';

export function PassportModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const { userRole, guildAlignment, musterRollDraft } = useAppStore();

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('sending');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-apf-black border border-apf-purple/50 max-w-md w-full relative overflow-hidden p-6 font-vt323">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <SafeIcon name="X" className="h-6 w-6" />
        </button>

        <h2 className="text-2xl text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <SafeIcon name="Shield" className="text-apf-purple h-6 w-6" /> Pirate Passport
        </h2>

        {musterRollDraft.walletAddress ? (
            <div className="bg-black/50 border border-gray-800 p-4 mb-6 text-sm">
                <div className="text-gray-400 uppercase tracking-widest mb-1">Clearance</div>
                <div className="text-apf-emerald text-lg uppercase tracking-wider mb-4">{userRole}</div>

                <div className="text-gray-400 uppercase tracking-widest mb-1">Guild</div>
                <div className="text-apf-purple text-lg uppercase tracking-wider mb-4">{guildAlignment}</div>

                <div className="text-gray-400 uppercase tracking-widest mb-1">Alias</div>
                <div className="text-white text-lg uppercase tracking-wider">{musterRollDraft.alias || '[ REDACTED ]'}</div>
            </div>
        ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-gray-400 text-sm leading-tight mb-4">
                Establish a secure uplink. Enter your comm-link address to receive an encrypted one-time access sequence.
            </p>
            <div>
                <input
                type="email"
                required
                placeholder="Enter comm-link address..."
                className="w-full bg-black/50 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-apf-purple transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={status === 'sending' || status === 'success'}
                className="w-full bg-apf-purple hover:bg-apf-purpleLight text-white px-4 py-3 uppercase tracking-widest transition-all focus:outline-none"
            >
                {status === 'sending' ? '[ INITIATING UPLINK... ]' :
                 status === 'success' ? '[ TRANSMISSION SENT ]' :
                 'Request Access Sequence'}
            </button>
            {status === 'error' && <p className="text-red-500 text-sm mt-2">[ UPLINK FAILED. VERIFY COORDINATES. ]</p>}
            </form>
        )}
      </div>
    </div>
  );
}
