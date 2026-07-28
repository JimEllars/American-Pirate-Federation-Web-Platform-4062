import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';







import { NotFound } from "./pages/NotFound";
import { LoadingFallback } from "./components/ui/LoadingFallback";

const LazyHome = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const LazyPolicies = React.lazy(() => import('./pages/Policies').then(m => ({ default: m.Policies })));
const LazyEvents = React.lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const LazyIntelligenceHub = React.lazy(() => import('./pages/IntelligenceHub').then(m => ({ default: m.IntelligenceHub })));
const LazyTransmissionHub = React.lazy(() => import('./pages/TransmissionHub').then(m => ({ default: m.TransmissionHub })));
const LazyArmory = React.lazy(() => import('./pages/Armory').then(m => ({ default: m.Armory })));
const LazyPropose = React.lazy(() => import('./pages/Propose').then(m => ({ default: m.Propose })));
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { ToastContainer } from './components/ui/ToastContainer';
import { logUnhandledRejection } from './lib/api/telemetry';
import { supabase } from './lib/api/supabaseClient';
import { useAppStore } from './store/useAppStore';


function App() {
  const addToast = useAppStore((state) => state.addToast);
  const removeToast = useAppStore((state) => state.removeToast);
  const [offlineToastId, setOfflineToastId] = React.useState(null);

  React.useEffect(() => {
    const handleOffline = () => {
      const id = addToast('[ CRITICAL: SECURE CONNECTION LOST - AWAITING SIGNAL ]', 'critical', true);
      setOfflineToastId(id);
    };

    const handleOnline = () => {
      if (offlineToastId) {
        removeToast(offlineToastId);
        setOfflineToastId(null);
      }
      addToast('[ NET_OPS: SIGNAL RESTORED ]', 'success');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
        handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast, removeToast, offlineToastId]);

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
          <React.Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LazyHome />} />
              <Route path="/intelligence" element={<LazyIntelligenceHub />} />
              <Route path="/policies" element={<LazyPolicies />} />
              <Route path="/events" element={<LazyEvents />} />
              <Route path="/podcast" element={<LazyTransmissionHub />} />
              <Route path="/shop" element={<LazyArmory />} />
              <Route path="/propose" element={<LazyPropose />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
          </React.Suspense>
          <ToastContainer />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
