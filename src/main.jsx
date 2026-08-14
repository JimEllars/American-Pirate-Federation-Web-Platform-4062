import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThirdwebProvider } from "thirdweb/react";
import { client } from './lib/web3/client';
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
    console.warn('[ APF_ENV_ALERT: RUNNING IN PREVIEW/DEFENSIVE MODE - SOME WEB3/BACKEND FEATURES WILL EMULATE SAFELY ]');
  }

  return (
    <React.StrictMode>
      <ThirdwebProvider client={client}>
        <App />
      </ThirdwebProvider>
    </React.StrictMode>
  );
}

root.render(<AppWrapper />);
