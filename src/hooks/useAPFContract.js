import { useContract, useContractRead } from '@thirdweb-dev/react';

export function useAPFContract() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const { contract } = useContract(contractAddress);

  const { data: treasuryBalance, isLoading: isLoadingBalance } = useContractRead(contract, "getBalance");

  return {
    contract,
    treasuryBalance,
    isLoadingBalance
  };
}
