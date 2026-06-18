import React, { useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';

export function GasWarningCard({ ethBalance, onDismiss }) {
  // We assume ethBalance is a number representing the USD value of the ETH balance
  const hasEnoughGas = ethBalance >= 0.002;

  useEffect(() => {
    // Add overflow hidden when mounted
    document.body.style.overflow = 'hidden';

    // Clean up when unmounted to ensure scroll is restored
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleDismiss = () => {
    // Also explicitly remove on dismiss before the unmount effect might run
    document.body.style.overflow = 'unset';
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleDismiss} />

      <div className="relative z-10 w-full max-w-lg bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] p-6 transition-all duration-500 overflow-hidden">
        <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />

        <div className="relative z-10 flex items-start gap-4">
          <div className={`p-3 rounded-full ${hasEnoughGas ? 'bg-apf-emerald/20 text-apf-emerald' : 'bg-apf-purple/20 text-apf-purple'}`}>
            <SafeIcon name={hasEnoughGas ? "CheckCircle" : "AlertCircle"} className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-vt323 text-lg text-white uppercase tracking-widest mb-1 flex items-center justify-between">
              Gas Threshold Check
              <span className={`text-xs ${hasEnoughGas ? 'text-apf-emerald' : 'text-apf-purple'}`}>
                {hasEnoughGas ? '[ CLEARANCE GRANTED ]' : '[ INSUFFICIENT FUNDS ]'}
              </span>
            </h3>

            <p className="text-gray-400 font-sans text-sm mb-2">
              Multisig Treasury Vault deployment requires approximately $5 USD in ETH on the Arbitrum One network.
            </p>

            <div className="flex items-center gap-2 mt-4 font-vt323 text-xs uppercase tracking-widest">
              <span className="text-gray-500">Current Balance:</span>
              <span className={hasEnoughGas ? 'text-apf-emerald' : 'text-apf-purple'}>
                {ethBalance?.toFixed(4) || '0.0000'} ETH
              </span>
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="mt-4 bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 px-4 py-1 font-vt323 text-sm uppercase transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
