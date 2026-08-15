import { logRPCException } from '../lib/api/telemetry';
import { useEffect, useState } from 'react';
import { getContract } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { client } from "../lib/web3/client";
import { arbitrum, arbitrumSepolia } from "thirdweb/chains";
import { isValidContractAddress } from "../lib/web3/contracts";

export function useAPFContract() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const chain = import.meta.env.VITE_ACTIVE_CHAIN === "sepolia" ? arbitrumSepolia : arbitrum;

  const contract = isValidContractAddress(contractAddress) ? getContract({
    client,
    chain,
    address: contractAddress,
  }) : null;

  const { data: rawBalance, isLoading, isError, error } = useReadContract({
    contract,
    method: "function getBalance() view returns (uint256)",
    params: [],
    queryOptions: { enabled: Boolean(contract) }
  });

  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timeout;
    if (isLoading && !hasTimedOut) {
      timeout = setTimeout(() => {
        setHasTimedOut(true);
        logRPCException("Arbitrum One", "RPC Timeout Exceeded Threshold");
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, hasTimedOut]);

  useEffect(() => {
    if (isError) {
      logRPCException("Arbitrum One", error?.message || "Unknown RPC Error");
    }
  }, [isError, error]);

  const resolvedBalance = (hasTimedOut || isError) ? "0.00" : rawBalance;
  const defensiveBalance = (resolvedBalance === null || resolvedBalance === undefined || Number.isNaN(Number(resolvedBalance))) ? "0.00" : resolvedBalance;
  const effectiveLoading = isLoading && !hasTimedOut && !isError;

  return {
    contract,
    treasuryBalance: defensiveBalance,
    isLoadingBalance: effectiveLoading,
    isError
  };
}

export function useIsVaultAdmin() {
  // Dormant hook scaffolded for Phase 57.
  // Will eventually use `useReadContract` to verify access control bytes.
  return {
    isAdmin: false,
    isLoading: false
  };
}
