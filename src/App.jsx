import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { Policies } from './pages/Policies';
import { Events } from './pages/Events';
import { IntelligenceHub } from './pages/IntelligenceHub';
import { TransmissionHub } from './pages/TransmissionHub';
import { Armory } from './pages/Armory';
import { Propose } from "./pages/Propose";
import { NotFound } from "./pages/NotFound";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { ToastContainer } from './components/ui/ToastContainer';
import { logUnhandledRejection } from './lib/api/telemetry';
import { supabase } from './lib/api/supabaseClient';


function App() {
  React.useEffect(() => {
    const handleRejection = (event) => {
      logUnhandledRejection(event.reason);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection); // Explicit cleanup retained
    };
  }, []);

  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          // Silently handle session refresh without UI interruption
          console.info(`[ SYSTEM ALERT: SUPABASE SESSION EVENT DETECTED: ${event} ]`);
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/intelligence" element={<IntelligenceHub />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/events" element={<Events />} />
              <Route path="/podcast" element={<TransmissionHub />} />
              <Route path="/shop" element={<Armory />} />
              <Route path="/propose" element={<Propose />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
          <ToastContainer />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
