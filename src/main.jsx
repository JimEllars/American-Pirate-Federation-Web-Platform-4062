import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThirdwebProvider, embeddedWallet, metamaskWallet, safeWallet } from "@thirdweb-dev/react";
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain="arbitrum"
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
