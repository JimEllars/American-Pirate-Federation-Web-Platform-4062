import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AiActionModal } from './components/ui/AiActionModal';








import { NotFound } from "./pages/NotFound";
import { LoadingFallback } from "./components/ui/LoadingFallback";

const LazyHome = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const LazyPolicies = React.lazy(() => import('./pages/Policies').then(m => ({ default: m.Policies })));
const LazyEvents = React.lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const LazyIntelligenceHub = React.lazy(() => import('./pages/IntelligenceHub').then(m => ({ default: m.IntelligenceHub })));
const LazyTransmissionHub = React.lazy(() => import('./pages/TransmissionHub').then(m => ({ default: m.TransmissionHub })));
const LazyArmory = React.lazy(() => import('./pages/Armory').then(m => ({ default: m.Armory })));
const LazyPropose = React.lazy(() => import('./pages/Propose').then(m => ({ default: m.Propose })));

const LazyDonate = React.lazy(() => import('./pages/Donate').then(m => ({ default: m.Donate })));
const LazyCalculator = React.lazy(() => import('./pages/Calculator').then(m => ({ default: m.Calculator })));
const LazyLedger = React.lazy(() => import('./pages/Ledger').then(m => ({ default: m.Ledger })));
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { ToastContainer } from './components/ui/ToastContainer';
import { logUnhandledRejection } from './lib/api/telemetry';
import { supabase } from './lib/api/supabaseClient';
import { useAppStore } from './store/useAppStore';


function App() {
  const addToast = useAppStore((state) => state.addToast);
  const removeToast = useAppStore((state) => state.removeToast);
  const refreshPassport = useAppStore((state) => state.refreshPassport);
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
    // Boot the Pirate Passport once, then keep it in step with the Supabase session.
    // Audit F38: the app used to subscribe to auth events only to log them, so an OTP
    // sign-in changed the session and nothing else — the next modal open showed the
    // sign-in form again, and "Clearance" came from localStorage instead of the account.
    refreshPassport();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        refreshPassport();
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [refreshPassport]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ScrollToTop />
          <React.Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<ErrorBoundary><LazyHome /></ErrorBoundary>} />
              <Route path="/intelligence" element={<ErrorBoundary><LazyIntelligenceHub /></ErrorBoundary>} />
              <Route path="/policies" element={<ErrorBoundary><LazyPolicies /></ErrorBoundary>} />
              <Route path="/events" element={<ErrorBoundary><LazyEvents /></ErrorBoundary>} />
              <Route path="/podcast" element={<ErrorBoundary><LazyTransmissionHub /></ErrorBoundary>} />
              <Route path="/shop" element={<ErrorBoundary><LazyArmory /></ErrorBoundary>} />
              <Route path="/propose" element={<ErrorBoundary><LazyPropose /></ErrorBoundary>} />
              <Route path="/donate" element={<ErrorBoundary><LazyDonate /></ErrorBoundary>} />
              {/* SOP Playbook D: the Great Balance Calculator and the Pay Ratio Explorer are
                  named deliverables. /pay-ratio renders the ledger with that panel selected. */}
              <Route path="/calculator" element={<ErrorBoundary><LazyCalculator /></ErrorBoundary>} />
              <Route path="/ledger" element={<ErrorBoundary><LazyLedger key="ledger" /></ErrorBoundary>} />
              <Route path="/pay-ratio" element={<ErrorBoundary><LazyLedger key="pay-ratio" initialTab="pay-ratio" /></ErrorBoundary>} />
              {/* Governance and the proposal floor are the same surface. /propose is the
                  actionable URL the navigation uses; /governance is the SOP's name for it. */}
              <Route path="/governance" element={<ErrorBoundary><LazyPropose key="governance" /></ErrorBoundary>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
          </React.Suspense>
          <ToastContainer />
        <AiActionModal />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
