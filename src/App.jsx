import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { Home } from './pages/Home';
import { Policies } from './pages/Policies';
import { Events } from './pages/Events';
import { NewsArchive } from './pages/NewsArchive';
import { TransmissionHub } from './pages/TransmissionHub';
import { Armory } from './pages/Armory';

// Placeholder for remaining routes
const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center font-mono text-apf-purple bg-apf-black">
    <div className="text-center">
      <div className="text-4xl mb-4 font-black">[{title.toUpperCase()} PROTOCOL]</div>
      <div className="text-xs uppercase tracking-[0.5em] text-gray-600 animate-pulse">Pending Activation... Space-Time Sync Required</div>
    </div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<NewsArchive />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/events" element={<Events />} />
            <Route path="/podcast" element={<TransmissionHub />} />
            <Route path="/shop" element={<Armory />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;