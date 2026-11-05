import React, { useState } from 'react';
import { useSwitchActiveWalletChain } from 'thirdweb/react';
import { arbitrum } from 'thirdweb/chains';
import { useAppStore } from '../../store/useAppStore';
import { logNetworkTransition } from '../../lib/api/telemetry';

/**
 * The only exit from the wrong-network gate on `/shop` and `/propose`.
 *
 * Both pages rendered a full-page "[ SECURE CHANNEL: ARBITRUM NETWORK CONNECTION REQUIRED ]"
 * gate whose single control called `const switchChain = () => {}` — a stub. A visitor whose
 * wallet was on any other chain was therefore locked out of the armory and the proposal
 * floor with a button that did nothing and said nothing. `Layout` already performs the real
 * switch through `useSwitchActiveWalletChain()`; this is the same call, packaged so the two
 * page-level gates cannot drift from it again.
 *
 * Failure is reported, not swallowed: if the wallet refuses the switch the visitor is told
 * so and stays on the gate, which is the truth of their situation.
 */
export function SwitchNetworkButton({ className = '', label = 'Switch to Arbitrum One' }) {
  const switchChain = useSwitchActiveWalletChain();
  const addToast = useAppStore((state) => state.addToast);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      await switchChain(arbitrum);
      logNetworkTransition(42161, true);
      addToast('[ NET_OPS: ALIGNED TO ARBITRUM ONE ]', 'success');
    } catch (error) {
      logNetworkTransition(42161, false);
      addToast('[ NET_OPS: CHAIN SWITCH REJECTED - STAYING ON CURRENT NETWORK ]', 'error');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={switching}
      aria-busy={switching}
      aria-label={label}
      className={`bg-apf-purple/20 border border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white px-8 py-3 font-vt323 text-lg uppercase tracking-widest transition-all duration-300 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-apf-purple/50 disabled:opacity-60 disabled:cursor-wait ${className}`}
    >
      {switching ? 'Requesting Switch…' : label}
    </button>
  );
}

export default SwitchNetworkButton;
