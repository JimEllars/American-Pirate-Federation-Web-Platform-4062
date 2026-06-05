import React, { useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';

export function NetworkSwitchModal({ isWrongNetwork, onSwitchNetwork, onDismiss }) {
  useEffect(() => {
    if (isWrongNetwork) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isWrongNetwork]);

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl p-8 hover:border-apf-purple/40 transition-all duration-500 flex flex-col items-center text-center">
        <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />

        <SafeIcon name="AlertTriangle" className="h-12 w-12 text-apf-purple mb-4 relative z-10 animate-pulse" />

        <h2 className="text-2xl font-cinzel font-bold text-white uppercase tracking-widest mb-2 relative z-10">
          Network Desync
        </h2>

        <p className="text-gray-400 font-vt323 text-sm uppercase tracking-widest mb-8 relative z-10">
          The connected node is outside the primary network zone. Switch to Arbitrum One for low-latency confirmations and minimal gas overhead.
        </p>

        <div className="flex flex-col gap-3 w-full relative z-10">
          <button
            onClick={onSwitchNetwork}
            className="bg-apf-purple/20 border border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white px-8 py-3 font-vt323 text-lg uppercase tracking-widest transition-all duration-300 w-full"
          >
            Align to Arbitrum One
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 px-8 py-2 font-vt323 text-sm uppercase transition-colors w-full"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
