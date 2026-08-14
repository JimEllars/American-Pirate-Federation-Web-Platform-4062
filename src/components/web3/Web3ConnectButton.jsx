import React from "react";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { arbitrum, arbitrumSepolia } from "thirdweb/chains";
import { client, isWeb3Configured } from "../../lib/web3/client";
import { useAppStore } from "../../store/useAppStore";

const ARBITRUM_CHAIN_ID = 42161;
const AXIM_CORE_TELEMETRY_URL = "https://pvbcdndqjguzqeafhwhw.supabase.co/functions/v1/satellite-telemetry";

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "apple", "email"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
];

export default function Web3ConnectButton({ microAppName = "American-Pirate-Federation-UI" }) {
  const addToast = useAppStore((state) => state.addToast);

  const handleWalletConnectionTelemetry = async (wallet) => {
    try {
      const address = wallet.getAccount()?.address;
      const walletId = wallet.id;
      if (!address) return;

      const telemetryPayload = {
        meta: {
          source: microAppName,
          event_type: "wallet.connected",
          timestamp: new Date().toISOString()
        },
        telemetry: {
          wallet_address: address,
          connection_type: walletId,
          chain_id: ARBITRUM_CHAIN_ID,
          session_status: "active"
        }
      };

      await fetch(AXIM_CORE_TELEMETRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telemetryPayload)
      });
    } catch (error) {
      console.warn("[Web3Connect] Telemetry sync skipped safely:", error.message);
    }
  };

  const handleContainerClick = (e) => {
    if (!isWeb3Configured) {
      e.stopPropagation();
      e.preventDefault();
      addToast("[ NET_OPS: WEB3 INFRASTRUCTURE RUNNING IN SIMULATION MODE ]", "warning");
    }
  };

  return (
    <div className="axim-web3-button-wrapper" onClickCapture={handleContainerClick}>
      <ConnectButton
        client={client}
        wallets={wallets}
        chain={import.meta.env.VITE_ACTIVE_CHAIN === "sepolia" ? arbitrumSepolia : arbitrum}
        theme="dark"
        connectModal={{
          size: "compact",
          title: "Select Access Method",
          welcomeScreen: {
            title: "Core Link",
            subtitle: "Accessing decentralized network utility infrastructure.",
          }
        }}
        connectButton={{
          label: "Connect Ecosystem Wallet",
          className: "axim-core-btn text-sm font-mono tracking-wider transition-all duration-200 uppercase",
        }}
        onConnect={(wallet) => {
          handleWalletConnectionTelemetry(wallet);
        }}
      />
    </div>
  );
}
