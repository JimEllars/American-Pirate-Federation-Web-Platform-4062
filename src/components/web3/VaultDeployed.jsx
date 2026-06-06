import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

export function VaultDeployed() {
  const { deployedVaultAddress, treasuryDeploymentStatus } = useAppStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (copied) {
      timeoutId = setTimeout(() => setCopied(false), 2500);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [copied]);

  if (treasuryDeploymentStatus !== 'success' || !deployedVaultAddress) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(deployedVaultAddress);
    setCopied(true);
  };

  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl p-8 hover:border-apf-purple/40 transition-all duration-500 relative overflow-hidden text-center mt-8">
      <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />
      <div className="absolute inset-0 bg-apf-emerald/5 mix-blend-overlay !pointer-events-none" />

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center p-4 bg-apf-emerald/10 rounded-full mb-6 ring-1 ring-apf-emerald/50 animate-pulse">
          <SafeIcon name="Shield" className="h-8 w-8 text-apf-emerald" />
        </div>

        <h2 className="text-2xl font-cinzel font-bold text-white uppercase tracking-widest mb-2">
          Treasury Vault Active
        </h2>

        <p className="text-gray-400 font-sans text-sm mb-6 max-w-md mx-auto">
          The Safe Multisig Treasury Vault has been successfully deployed to the Arbitrum One network.
        </p>

        <div className="bg-black/50 border border-apf-emerald/20 p-4 mb-6 relative">
          <div className="font-vt323 text-gray-500 text-xs uppercase tracking-widest mb-1 flex justify-between items-center">
            <span>Contract Address</span>
            <button
              onClick={handleCopy}
              className="text-apf-emerald hover:text-white transition-colors flex items-center gap-1 relative"
            >
              <SafeIcon name="Copy" className="h-3 w-3" />
              <div className="relative w-[120px] h-[16px]">
                <span className={`absolute right-0 transition-opacity duration-300 ${copied ? 'opacity-0' : 'opacity-100'}`}>
                  Copy
                </span>
                <span className={`absolute right-0 text-apf-emerald font-bold transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                  [ ADDRESS COPIED ]
                </span>
              </div>
            </button>
          </div>
          <div className="font-vt323 text-apf-emerald text-lg break-all select-all text-left mt-2">
            {deployedVaultAddress}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 font-vt323 text-xs text-apf-purple uppercase tracking-widest">
          <SafeIcon name="Activity" className="h-4 w-4" />
          <span className="text-apf-emerald">[ TELEMETRY UPLINK ESTABLISHED ]</span>
        </div>
      </div>
    </div>
  );
}
