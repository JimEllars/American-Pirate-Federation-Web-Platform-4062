import { getContract } from "thirdweb";
import { client } from "./client";
import { arbitrum } from "thirdweb/chains";

export const APF_TREASURY_ADDRESS = import.meta.env.VITE_APF_TREASURY_ADDRESS || "";
export const APF_POLICY_ADDRESS = import.meta.env.VITE_APF_POLICY_ADDRESS || "";

// Export dormant contract instances
export const TreasuryContract = getContract({
  client,
  address: APF_TREASURY_ADDRESS,
  chain: arbitrum // Arbitrum One
});

export const PolicyContract = getContract({
  client,
  address: APF_POLICY_ADDRESS,
  chain: arbitrum // Arbitrum One
});
