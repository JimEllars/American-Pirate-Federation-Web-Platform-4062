import { getContract } from "thirdweb";
import { client } from "./client";
import { arbitrum } from "thirdweb/chains";

export const APF_TREASURY_ADDRESS = import.meta.env.VITE_APF_TREASURY_ADDRESS || "";
export const APF_POLICY_ADDRESS = import.meta.env.VITE_APF_POLICY_ADDRESS || "";

export const isValidContractAddress = (addr) =>
  typeof addr === "string" &&
  /^0x[a-fA-F0-9]{40}$/.test(addr) &&
  addr !== "0x0000000000000000000000000000000000000000";

// Export dormant contract instances
export const TreasuryContract = isValidContractAddress(APF_TREASURY_ADDRESS)
  ? getContract({
      client,
      address: APF_TREASURY_ADDRESS,
      chain: arbitrum // Arbitrum One
    })
  : null;

export const PolicyContract = isValidContractAddress(APF_POLICY_ADDRESS)
  ? getContract({
      client,
      address: APF_POLICY_ADDRESS,
      chain: arbitrum // Arbitrum One
    })
  : null;
