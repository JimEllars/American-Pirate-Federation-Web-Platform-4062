import { logRPCException } from '../lib/api/telemetry';
import { useEffect, useState } from 'react';
import { getContract } from "thirdweb";
import { useReadContract, useActiveWalletChain } from "thirdweb/react";
import { client } from "../lib/web3/client";
import { arbitrum, arbitrumSepolia } from "thirdweb/chains";
import { isValidContractAddress } from "../lib/web3/contracts";

// A syntactically valid sink address. thirdweb's `useReadContract` dereferences
// `contract.chain` during render and throws when `contract` is null:
//
//   TypeError: can't access property "chain", a.contract is null
//
// That took the whole homepage into the ErrorBoundary whenever VITE_APF_TREASURY_ADDRESS
// was unset — which is the default state of a fresh checkout and of any deployment where
// the Safe is not live yet. `queryOptions.enabled` is evaluated later, so it cannot
// prevent the crash. Giving the hook a non-null contract and disabling the query keeps
// hook order static and issues no RPC call.
const UNCONFIGURED_ADDRESS = '0x0000000000000000000000000000000000000001';

export function useAPFContract() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const configuredChain = import.meta.env.VITE_ACTIVE_CHAIN === "sepolia" ? arbitrumSepolia : arbitrum;
  const activeChain = useActiveWalletChain();

  // Use connected chain if available and supported, else fallback to configured chain (public RPC)
  const chain = (activeChain && (activeChain.id === arbitrum.id || activeChain.id === arbitrumSepolia.id))
      ? activeChain
      : configuredChain;

  const isConfigured = isValidContractAddress(contractAddress);

  const contract = getContract({
    client,
    chain,
    address: isConfigured ? contractAddress : UNCONFIGURED_ADDRESS,
  });

  const { data: rawBalance, isLoading, isError, error } = useReadContract({
    contract,
    method: "function getBalance() view returns (uint256)",
    params: [],
    queryOptions: { enabled: isConfigured }
  });

  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timeout;
    if (isLoading && !hasTimedOut) {
      timeout = setTimeout(() => {
        setHasTimedOut(true);
        logRPCException("Arbitrum One", "RPC Timeout Exceeded Threshold");
      }, 6000);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, hasTimedOut]);

  useEffect(() => {
    if (isError) {
      logRPCException("Arbitrum One", error?.message || "Unknown RPC Error");
    }
  }, [isError, error]);

  const resolvedBalance = (!isConfigured || hasTimedOut || isError) ? "0.00" : rawBalance;
  const defensiveBalance = (resolvedBalance === null || resolvedBalance === undefined || Number.isNaN(Number(resolvedBalance))) ? "0.00" : resolvedBalance;
  const effectiveLoading = isConfigured && isLoading && !hasTimedOut && !isError;

  return {
    contract: isConfigured ? contract : null,
    treasuryBalance: defensiveBalance,
    isLoadingBalance: effectiveLoading,
    isError: isConfigured && isError,
    isConfigured
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
