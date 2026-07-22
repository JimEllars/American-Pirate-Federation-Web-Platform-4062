import { logRPCException } from '../lib/api/telemetry';
import { useEffect, useState } from 'react';
import { useContract, useContractRead } from '@thirdweb-dev/react';

export function useAPFContract() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const { contract } = useContract(contractAddress);

const { data: rawBalance, isLoading, isError, error } = useContractRead(contract, "getBalance");
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

  const resolvedBalance = hasTimedOut ? "0.00" : rawBalance;
  const defensiveBalance = (resolvedBalance === null || resolvedBalance === undefined || Number.isNaN(Number(resolvedBalance))) ? "0.00" : resolvedBalance;
  const effectiveLoading = isLoading && !hasTimedOut;

  return {
    contract,
    treasuryBalance: defensiveBalance,
    isLoadingBalance: effectiveLoading
  };
}

export function useIsVaultAdmin() {
  // Dormant hook scaffolded for Phase 57.
  // Will eventually use `useContractRead` to verify access control bytes.
  return {
    isAdmin: false,
    isLoading: false
  };
}
