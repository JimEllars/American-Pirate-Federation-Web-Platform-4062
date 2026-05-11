import React from 'react';
import { Navbar } from './Navbar';
import { useParallax } from '../../hooks/useParallax';
import { motion } from 'framer-motion';

export function Layout({ children }) {
  const scrollOffset = useParallax();

  return (
    <div className="min-h-screen relative apf-root-container flex flex-col">
      {/* Scanlines overlay */}
      <div className="scanlines pointer-events-none" />
      
      {/* Parallax Grid */}
      <motion.div 
        className="bg-grid-pattern bg-grid-parallax"
        style={{ y: -scrollOffset }}
      />

      <Navbar />
      
      <main className="flex-grow pt-16 relative z-10">
        {children}
      </main>

      <footer className="border-t border-apf-purple/20 bg-apf-black/80 py-8 text-center text-sm font-mono text-gray-500 relative z-10">
        <p>SECURE NODE ESTABLISHED. APF © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}