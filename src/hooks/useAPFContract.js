import { logRPCException } from '../lib/api/telemetry';
import { useEffect, useState } from 'react';
import { getWalletBalance } from 'thirdweb/wallets';
import { useActiveWalletChain } from 'thirdweb/react';
import { client } from "../lib/web3/client";
import { arbitrum, arbitrumSepolia } from "thirdweb/chains";
import { isValidContractAddress } from "../lib/web3/contracts";

/**
 * The treasury is an Arbitrum One Safe multisig. A Safe holds native ETH (and ERC-20s) at
 * its address; it does not implement a `getBalance()` view function.
 *
 * Audit F43: this hook used to call `useReadContract(contract, "function getBalance() view
 * returns (uint256)")` against the Safe address. That selector does not exist on a Safe
 * proxy, so the call reverted on every load and the hook's defensive fallback rendered
 * "0.00 ETH" — a balance the treasury may well not have had, presented as a reading. The
 * panel now asks the chain for the address's native balance directly, and when the address
 * is unset it says the balance is not published instead of inventing a zero.
 *
 * No wallet connection is required: this is a public RPC read of a public address.
 */

const UNCONFIGURED = 'unconfigured';

export function useAPFContract() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const configuredChain = import.meta.env.VITE_ACTIVE_CHAIN === "sepolia" ? arbitrumSepolia : arbitrum;
  const activeChain = useActiveWalletChain();

  // Read on the connected chain when the wallet is already sitting on one of the two chains
  // this deployment supports; otherwise read the configured chain.
  const chain = (activeChain && (activeChain.id === arbitrum.id || activeChain.id === arbitrumSepolia.id))
      ? activeChain
      : configuredChain;

  const chainId = chain.id;
  const chainName = chain.name || `chain ${chainId}`;
  const isConfigured = isValidContractAddress(contractAddress);

  const [state, setState] = useState({ status: 'idle', displayValue: null, symbol: null, error: null });

  useEffect(() => {
    if (!isConfigured) {
      setState({ status: UNCONFIGURED, displayValue: null, symbol: null, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setState({ status: 'timeout', displayValue: null, symbol: null, error: 'RPC timeout' });
        logRPCException(chainName, 'Treasury balance read exceeded 6s');
      }
    }, 6000);

    getWalletBalance({ client, chain, address: contractAddress })
      .then((balance) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setState({
          status: 'ready',
          displayValue: balance?.displayValue ?? null,
          symbol: balance?.symbol ?? null,
          error: null
        });
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setState({ status: 'error', displayValue: null, symbol: null, error: err?.message || 'RPC read failed' });
        logRPCException(chainName, err?.message || 'Unknown RPC Error');
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isConfigured, contractAddress, chainId, chainName]);

  const hasReading = state.status === 'ready' && state.displayValue !== null;

  return {
    treasuryBalance: hasReading ? state.displayValue : null,
    treasurySymbol: hasReading ? state.symbol : null,
    isLoadingBalance: isConfigured && (state.status === 'idle' || state.status === 'loading'),
    isError: state.status === 'error' || state.status === 'timeout',
    isConfigured,
    // Kept for callers that still import it; nothing reads a contract ABI for the treasury
    // balance any more (see the file header).
    contract: null
  };
}

export function useIsVaultAdmin() {
  // There is no on-chain admin role to read yet: treasury funds are held in a Safe
  // multisig whose authority lives in owner signatures, not in a contract modifier.
  // This hook returns a constant so callers cannot render an "admin" state that does
  // not exist. It is retained only so existing call sites keep a stable import.
  return {
    isAdmin: false,
    isLoading: false
  };
}
