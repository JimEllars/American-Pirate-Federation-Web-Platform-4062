import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThirdwebProvider, embeddedWallet, metamaskWallet, safeWallet } from "@thirdweb-dev/react";
import { Arbitrum, ArbitrumSepolia } from "@thirdweb-dev/chains";
import App from './App.jsx';
import './index.css';

const root = createRoot(document.getElementById('root'));
const cfAnalyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN;

if (cfAnalyticsToken) {
  const analyticsScript = document.createElement('script');
  analyticsScript.defer = true;
  analyticsScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  analyticsScript.setAttribute('data-cf-beacon', JSON.stringify({ token: cfAnalyticsToken }));
  document.head.appendChild(analyticsScript);
}

function AppWrapper() {
  let hasRequiredEnv = false;
  try {
    if (
      import.meta.env.VITE_THIRDWEB_CLIENT_ID &&
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      hasRequiredEnv = true;
    }
  } catch (e) {
    // Suppress error in static build environments
  }

  if (!hasRequiredEnv) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center p-8">
        <div className="text-red-500 font-vt323 text-2xl uppercase tracking-widest animate-pulse border border-red-500/30 bg-red-500/10 p-8 text-center max-w-4xl shadow-2xl">
          [ SYSTEM HALT: CRITICAL ENVIRONMENT CONFIGURATION MISSING ]
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