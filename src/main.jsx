import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThirdwebProvider, embeddedWallet, metamaskWallet, safeWallet } from "@thirdweb-dev/react";
import { Arbitrum, ArbitrumSepolia } from "@thirdweb-dev/chains";
import App from './App.jsx';
import './index.css';

const root = createRoot(document.getElementById('root'));

function AppWrapper() {
  let hasClientId = false;
  try {
    if (import.meta.env.VITE_THIRDWEB_CLIENT_ID) {
      hasClientId = true;
    }
  } catch (e) {
    // Suppress error in static build environments
  }

  if (!hasClientId) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center p-8">
        <div className="text-red-500 font-vt323 text-2xl uppercase tracking-widest animate-pulse border border-red-500/30 bg-red-500/10 p-8 text-center max-w-4xl shadow-2xl">
          [ SYSTEM HALT: CRITICAL ENVIRONMENT VARIABLES (THIRDWEB_CLIENT_ID) MISSING FROM HOST INFRASTRUCTURE ]
        </div>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <ThirdwebProvider
        activeChain={import.meta.env.VITE_ACTIVE_CHAIN === "sepolia" ? ArbitrumSepolia : Arbitrum}
        supportedChains={[Arbitrum, ArbitrumSepolia]}
        clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ''}
        supportedWallets={[
          embeddedWallet({
            auth: {
              options: ["google", "apple", "email"],
            },
          }),
          metamaskWallet(),
          safeWallet(),
        ]}
      >
        <App />
      </ThirdwebProvider>
    </React.StrictMode>
  );
}

root.render(<AppWrapper />);