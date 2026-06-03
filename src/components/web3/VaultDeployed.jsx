import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

export function VaultDeployed() {
  const { treasuryAddress, treasuryDeploymentStatus } = useAppStore();

  if (treasuryDeploymentStatus !== 'success' || !treasuryAddress) return null;

  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl p-8 hover:border-apf-purple/40 transition-all duration-500 relative overflow-hidden text-center mt-8">
      <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />
      <div className="absolute inset-0 bg-apf-emerald/5 mix-blend-overlay pointer-events-none" />

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

        <div className="bg-black/50 border border-apf-emerald/20 p-4 mb-6">
          <div className="font-vt323 text-gray-500 text-xs uppercase tracking-widest mb-1">
            Contract Address
          </div>
          <div className="font-mono text-apf-emerald text-sm break-all select-all">
            {treasuryAddress}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 font-vt323 text-xs text-apf-purple uppercase tracking-widest">
          <SafeIcon name="Activity" className="h-4 w-4" />
          <span>Telemetry Uplink Confirmed. Core Spine Sync Complete.</span>
        </div>
      </div>
    </div>
  );
}
