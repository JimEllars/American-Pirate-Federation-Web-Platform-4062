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
import { Propose } from './pages/Propose';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  if (!import.meta.env.VITE_THIRDWEB_CLIENT_ID) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center p-8">
        <div className="text-red-500 font-vt323 text-2xl uppercase tracking-widest animate-pulse border border-red-500/30 bg-red-500/10 p-8 text-center max-w-4xl shadow-2xl">
          [ SYSTEM HALT: CRITICAL ENVIRONMENT VARIABLES (THIRDWEB_CLIENT_ID) MISSING FROM HOST INFRASTRUCTURE ]
        </div>
      </div>
    );
  }

  return (

    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/intelligence" element={<IntelligenceHub />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/events" element={<Events />} />
              <Route path="/podcast" element={<TransmissionHub />} />
              <Route path="/shop" element={<Armory />} />
              <Route path="/propose" element={<Propose />} />
            </Routes>
          </AnimatePresence>
          <ToastContainer />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
