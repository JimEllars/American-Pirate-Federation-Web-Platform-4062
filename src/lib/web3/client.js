import { createThirdwebClient } from "thirdweb";

const rawClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;
const clientId = (rawClientId && rawClientId.trim() !== "" && rawClientId !== "your_client_id_here")
  ? rawClientId
  : "apf-preview-client-id";

export const client = createThirdwebClient({
  clientId,
});

export const isWeb3Configured = Boolean(
  rawClientId &&
  rawClientId.trim() !== "" &&
  rawClientId !== "your_client_id_here" &&
  rawClientId !== "apf-preview-client-id"
);
