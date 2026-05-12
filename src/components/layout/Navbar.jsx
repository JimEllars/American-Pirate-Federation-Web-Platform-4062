import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { musterRollDraft, guildAlignment } = useAppStore();

  const navLinks = [
    { name: 'Census', path: '/census' },
    { name: 'News', path: '/news' },
    { name: 'Policies', path: '/policies' },
    { name: 'Events', path: '/events' },
    { name: 'Podcast', path: '/podcast' },
    { name: 'Shop', path: '/shop' },
  ];

  const getGuildIcon = () => {
    switch(guildAlignment) {
      case "Shipwright's Guild": return "Tool";
      case "Surgeon's Dispensary": return "Heart";
      case "Quartermaster's Provisions": return "Package";
      case "Navigator's Guild": return "Compass";
      case "Federation Reserve": return "Anchor";
      default: return "Shield";
    }
  };

  return (
    <nav className="fixed top-0 w-full z-40 bg-apf-black/80 backdrop-blur-md border-b border-apf-purple/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <span className="logo-text text-xl sm:text-2xl">
              P<span className="skewed-i">I</span>RATE FEDERATION
            </span>
          </Link>

          <div className="hidden md:flex items-center">
            <div className="ml-10 flex items-baseline space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-300 hover:text-apf-purple transition-colors px-3 py-2 rounded-md text-sm font-vt323 font-medium uppercase"
                >
                  {link.name}
                </Link>
              ))}

              {musterRollDraft.walletAddress ? (
                  <div className="flex items-center gap-3 px-4 py-1.5 border border-apf-purple/30 bg-black/50 rounded group hover:border-apf-purple transition-colors cursor-default">
                      <SafeIcon name={getGuildIcon()} className="h-4 w-4 text-apf-purple" />
                      <div className="flex flex-col">
                          <span className="font-vt323 text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">{guildAlignment}</span>
                          <span className="font-vt323 text-xs text-apf-emerald uppercase tracking-wider leading-none">
                              {musterRollDraft.walletAddress.substring(0, 6)}...{musterRollDraft.walletAddress.substring(musterRollDraft.walletAddress.length - 4)}
                          </span>
                      </div>
                  </div>
              ) : (
                  <a href="/#enlist" className="bg-apf-purple hover:bg-apf-purpleLight text-white font-bold py-2 px-4 rounded transition-all shadow-[0_0_15px_rgba(113,0,255,0.5)] hover:shadow-[0_0_25px_rgba(113,0,255,0.8)] font-vt323 tracking-widest text-lg">
                    ENLIST
                  </a>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <SafeIcon name={isOpen ? "X" : "Menu"} className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-apf-black border-b border-apf-purple/20"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-300 hover:text-apf-purple block px-3 py-2 rounded-md text-base font-vt323 font-medium uppercase"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
             {musterRollDraft.walletAddress ? (
                  <div className="flex items-center gap-3 px-3 py-2 mt-4 border-t border-apf-purple/30">
                      <SafeIcon name={getGuildIcon()} className="h-5 w-5 text-apf-purple" />
                      <div className="flex flex-col">
                          <span className="font-vt323 text-xs text-gray-500 uppercase tracking-widest">{guildAlignment}</span>
                          <span className="font-vt323 text-sm text-apf-emerald uppercase tracking-wider">
                              {musterRollDraft.walletAddress.substring(0, 8)}...{musterRollDraft.walletAddress.substring(musterRollDraft.walletAddress.length - 6)}
                          </span>
                      </div>
                  </div>
              ) : (
                  <a href="/#enlist" onClick={() => setIsOpen(false)} className="block mt-4 text-center bg-apf-purple hover:bg-apf-purpleLight text-white font-bold py-2 px-4 rounded transition-all font-vt323 tracking-widest text-lg">
                    ENLIST
                  </a>
              )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
