import { createThirdwebClient } from "thirdweb";
import { logUnhandledRejection } from "../api/telemetry";

const rawClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;
export const isWeb3Configured = Boolean(
  rawClientId &&
  rawClientId.trim() !== "" &&
  rawClientId !== "your_client_id_here" &&
  rawClientId !== "apf-preview-client-id" &&
  rawClientId !== "00000000000000000000000000000000"
);

const clientId = isWeb3Configured
  ? rawClientId
  : "00000000000000000000000000000000"; // fallback dummy id to prevent thirdweb crashes

if (!isWeb3Configured) {
  console.warn("[ APF_ENV_ALERT: Web3 Client ID missing. Using preview client. ]");
  logUnhandledRejection("Web3 Client ID missing. Using preview client fallback.");
}

export const client = createThirdwebClient({
  clientId,
});
