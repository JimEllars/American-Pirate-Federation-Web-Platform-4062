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
import { Census } from './pages/Census';
import { Propose } from './pages/Propose';

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
            <Route path="/census" element={<Census />} />
            <Route path="/propose" element={<Propose />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
