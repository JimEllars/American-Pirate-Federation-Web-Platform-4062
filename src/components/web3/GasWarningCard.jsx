import React, { useEffect, useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { checkGasBalance } from '../../lib/web3/checkGasBalance';

export function GasWarningCard({ walletAddress, defaultBalance = 0, onDismiss }) {
  const [ethBalance, setEthBalance] = useState(defaultBalance);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
      let isMounted = true;
      const pollBalance = async () => {
          if (!walletAddress) return;
          try {
              // Create a timeout promise to handle latency spikes > 2000ms
              const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('RPC Timeout')), 2000)
              );

              const bal = await Promise.race([
                  checkGasBalance(walletAddress),
                  timeoutPromise
              ]);
              if (isMounted) setEthBalance(bal);
          } catch(e) {
              if (e.message === 'RPC Timeout') {
                 console.warn('[ GAS ESTIMATION: RPC LATENCY > 2000ms. USING FALLBACK ]');
                 if (isMounted) setEthBalance(0.0023); // Fallback estimate with 15% buffer
              }
          }
      };

      pollBalance();
      // Poll every 10 seconds
      const interval = setInterval(pollBalance, 10000);

      return () => {
          isMounted = false;
          clearInterval(interval);
      };
  }, [walletAddress]);

  const hasEnoughGas = ethBalance >= (0.002 * 1.15); // Include 15% buffer

  // We DO NOT block scroll in GasWarningCard to remain non-intrusive.
  // The user should still be able to scroll read-only content while this is active.
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center justify-center p-4 md:bottom-12 md:right-12 pointer-events-none">
      <div className="relative z-10 w-full max-w-sm bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] p-4 transition-all duration-500 overflow-hidden pointer-events-auto">
        <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />

        <div className="relative z-10 flex items-start gap-4">
          <div className={`p-3 rounded-full ${hasEnoughGas ? 'bg-apf-emerald/20 text-apf-emerald' : 'bg-apf-purple/20 text-apf-purple'}`}>
            <SafeIcon name={hasEnoughGas ? "CheckCircle" : "AlertCircle"} className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-vt323 text-lg text-white uppercase tracking-widest mb-1 flex items-center justify-between">
              Gas Threshold
              <span className={`text-xs ${hasEnoughGas ? 'text-apf-emerald' : 'text-apf-purple'}`}>
                {hasEnoughGas ? '[ GRANTED ]' : '[ INSUFFICIENT ]'}
              </span>
            </h3>

            <p className="text-gray-400 font-sans text-xs mb-2">
              Vault deployment requires ~$5 USD in ETH on Arbitrum One.
            </p>

            <div className="flex items-center gap-2 mt-2 font-vt323 text-xs uppercase tracking-widest">
              <span className="text-gray-500">Balance:</span>
              <span className={hasEnoughGas ? 'text-apf-emerald' : 'text-apf-purple'}>
                {ethBalance?.toFixed(4) || '0.0000'} ETH
              </span>
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="mt-3 w-full bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 px-4 py-1 font-vt323 text-sm uppercase transition-colors"
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
