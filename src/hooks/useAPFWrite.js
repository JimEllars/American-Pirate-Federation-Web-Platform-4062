import { getContract } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { client } from "../lib/web3/client";
import { arbitrum, arbitrumSepolia } from "thirdweb/chains";
import { prepareContractCall } from "thirdweb";
import { APF_POLICY_ADDRESS } from "../lib/web3/contracts";

function useAPFContractBase() {
  const contractAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const chain = import.meta.env.VITE_ACTIVE_CHAIN === "sepolia" ? arbitrumSepolia : arbitrum;

  return contractAddress ? getContract({
    client,
    chain,
    address: contractAddress,
  }) : null;
}

export const useSubmitPolicy = () => {
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  return { sendTransaction, isPending };
};

export function useSubmitFederationHash() {
  const contract = useAPFContractBase();
  const { mutateAsync: sendTransaction, isPending: isLoading, error } = useSendTransaction();

  const submitHash = async (args) => {
    if (!contract) throw new Error("Contract not initialized");
    const transaction = prepareContractCall({
      contract,
      method: "function submitHash(string memory hash)",
      params: args
    });
    return sendTransaction(transaction);
  };

  return { submitHash, isLoading, error };
}

export function useSubmitMusterSignature() {
  const contract = useAPFContractBase();
  const { mutateAsync: sendTransaction, isPending: isLoading, error } = useSendTransaction();

  const submitMusterSignature = async (args) => {
    if (!contract) throw new Error("Contract not initialized");
    const transaction = prepareContractCall({
      contract,
      method: "function submitMusterSignature(bytes memory signature)",
      params: args
    });
    return sendTransaction(transaction);
  };

  return { mutateAsync: submitMusterSignature, isLoading, error };
}

export function useConfigureTreasury() {
  const contract = useAPFContractBase();
  const { mutateAsync: sendTransaction, isPending: isLoading, error } = useSendTransaction();

  const configureTreasury = async (args) => {
    if (!contract) throw new Error("Contract not initialized");
    const transaction = prepareContractCall({
      contract,
      method: "function configureTreasury(uint256 configId)",
      params: args
    });
    return sendTransaction(transaction);
  };

  return { mutateAsync: configureTreasury, isLoading, error };
}
