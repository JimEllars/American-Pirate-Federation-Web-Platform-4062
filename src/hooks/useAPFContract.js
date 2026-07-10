import { logRPCException } from '../lib/api/telemetry';
import { useEffect } from 'react';
import { useContract, useContractRead } from '@thirdweb-dev/react';

export function useAPFContract() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const { contract } = useContract(contractAddress);

  const { data: treasuryBalance, isLoading: isLoadingBalance, isError, error } = useContractRead(contract, "getBalance");

  useEffect(() => {
    if (isError) {
      logRPCException("Arbitrum One", error?.message || "Unknown RPC Error");
    }
  }, [isError, error]);


  const defensiveBalance = (treasuryBalance === null || treasuryBalance === undefined || Number.isNaN(Number(treasuryBalance))) ? "0.00" : treasuryBalance;

  return {
    contract,
    treasuryBalance: defensiveBalance,
    isLoadingBalance
  };
}
