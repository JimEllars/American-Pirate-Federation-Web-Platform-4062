import { useContract, useContractWrite } from '@thirdweb-dev/react';

export function useSubmitFederationHash() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const { contract } = useContract(contractAddress);

  // This is a scaffolded dormant hook. It shouldn't be connected to UI buttons yet.
  const { mutateAsync: submitHash, isLoading, error } = useContractWrite(contract, "submitHash");

  return {
    submitHash,
    isLoading,
    error
  };
}


export function useSubmitMusterSignature() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const { contract } = useContract(contractAddress);

  // This is a scaffolded dormant hook. It shouldn't be connected to UI buttons yet.
  const { mutateAsync: submitMusterSignature, isLoading, error } = useContractWrite(contract, "submitMusterSignature");

  return {
    mutateAsync: submitMusterSignature,
    isLoading,
    error
  };
}

export function useConfigureTreasury() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const { contract } = useContract(contractAddress);

  // This is a scaffolded dormant hook. It shouldn't be connected to UI buttons yet.
  const { mutateAsync: configureTreasury, isLoading, error } = useContractWrite(contract, "configureTreasury");

  return {
    mutateAsync: configureTreasury,
    isLoading,
    error
  };
}
