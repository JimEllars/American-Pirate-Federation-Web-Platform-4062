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

function App() {
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
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
