#!/bin/bash
cat << 'INNER_EOF' > ./src/components/layout/Layout.jsx
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
        className="bg-grid-pattern bg-grid-parallax opacity-30 pointer-events-none"
        style={{ y: -scrollOffset * 0.5, scale: 1.5, zIndex: 0 }}
      />

      <motion.div
        className="bg-grid-pattern bg-grid-parallax pointer-events-none"
        style={{ y: -scrollOffset, zIndex: 0 }}
      />

      <Navbar />

      <main className="flex-grow pt-16 relative z-10">
        {children}
      </main>

      <footer className="border-t border-apf-purple/20 bg-apf-black/80 py-8 text-center text-sm font-vt323 text-gray-500 relative z-10">
        <p>SECURE NODE ESTABLISHED. APF © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > ./src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'News', path: '/news' },
    { name: 'Policies', path: '/policies' },
    { name: 'Events', path: '/events' },
    { name: 'Podcast', path: '/podcast' },
    { name: 'Shop', path: '/shop' },
  ];

  return (
    <nav className="fixed top-0 w-full z-40 bg-apf-black/80 backdrop-blur-md border-b border-apf-purple/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <span className="logo-text text-xl sm:text-2xl">
              P<span className="skewed-i">I</span>RATE FEDERATION
            </span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-300 hover:text-apf-purple transition-colors px-3 py-2 rounded-md text-sm font-vt323 font-medium"
                >
                  {link.name}
                </Link>
              ))}
              <a href="#enlist" className="bg-apf-purple hover:bg-apf-purpleLight text-white font-bold py-2 px-4 rounded transition-all shadow-[0_0_15px_rgba(113,0,255,0.5)] hover:shadow-[0_0_25px_rgba(113,0,255,0.8)]">
                ENLIST
              </a>
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
                className="text-gray-300 hover:text-apf-purple block px-3 py-2 rounded-md text-base font-vt323 font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
INNER_EOF

sed -i 's/pointer-events: none;/pointer-events: none !important;/g' ./src/index.css

cat << 'INNER_EOF' > ./src/components/sections/PolicyCard.jsx
import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

const { FiChevronRight, FiShield, FiUsers, FiClock, FiActivity } = FiIcons;

export function PolicyCard({ title, code, summary, status, consensus, sponsor, lastRevision }) {
  const [showHistory, setShowHistory] = useState(false);
  const { userRole, policySignals, signalPolicy } = useAppStore();

  const hasSignaled = policySignals[code] || false;
  const canSignal = ['Navigator', 'Guild Master'].includes(userRole);
  const currentConsensus = hasSignaled ? Math.min(100, consensus + 2) : consensus; // simulate QV bump

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-apf-purple/50 p-6 transition-all group relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity pointer-events-none">
        <SafeIcon icon={FiShield} className="h-24 w-24 text-apf-purple" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-vt323 px-2 py-1 bg-apf-purple/20 text-apf-purpleLight border border-apf-purple/30">
            {code}
          </span>
          <span className={`text-[10px] font-vt323 uppercase tracking-tighter ${
            status === 'Active' ? 'text-green-500' : 'text-yellow-500'
          }`}>
            ● {status}
          </span>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-vt323 text-gray-500 hover:text-apf-purple transition-colors uppercase tracking-widest"
        >
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-apf-purpleLight transition-colors relative z-10">
        {title}
      </h3>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col relative z-10"
          >
            <p className="text-sm text-gray-400 font-sans line-clamp-2 mb-6 flex-grow">
              {summary}
            </p>

            <div className="border-t border-gray-800 pt-4 mb-4 space-y-3">
               {consensus && (
                 <div>
                   <div className="flex justify-between text-[10px] font-vt323 uppercase text-gray-500 mb-1">
                     <span>Consensus (QV)</span>
                     <span className="text-apf-purple">{currentConsensus}%</span>
                   </div>
                   <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentConsensus}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-apf-purple/50 to-apf-purple"
                      />
                   </div>
                 </div>
               )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow relative z-10 border-t border-gray-800 pt-4 mb-4 text-xs font-vt323 text-gray-400 space-y-2"
          >
             <div className="flex justify-between">
               <span className="text-gray-500">Authorized By:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon icon={FiUsers} className="h-3 w-3"/> {sponsor}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Last Revision:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon icon={FiClock} className="h-3 w-3"/> {lastRevision}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Status:</span>
               <span className="text-apf-purpleLight flex items-center gap-1"><SafeIcon icon={FiActivity} className="h-3 w-3"/> {status}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-auto pt-2 relative z-10 border-t border-gray-800/50">
        <button className="flex items-center gap-2 text-xs font-vt323 text-apf-purple hover:text-white transition-colors uppercase tracking-widest">
          Review Protocol <SafeIcon icon={FiChevronRight} />
        </button>

        {canSignal && (
          <button
            onClick={() => signalPolicy(code)}
            className={`px-3 py-1 text-xs font-vt323 uppercase tracking-widest transition-all border ${
              hasSignaled
                ? 'bg-apf-purple/20 border-apf-purple text-apf-purpleLight'
                : 'border-gray-800 text-gray-500 hover:border-apf-purple/50 hover:text-apf-purple'
            }`}
          >
            {hasSignaled ? 'Signal Active' : 'Signal Support'}
          </button>
        )}
        {!canSignal && (
          <span className="text-[10px] font-vt323 text-gray-600 uppercase tracking-widest border border-gray-800/50 px-2 py-1">
            Nav Clearance Reqd
          </span>
        )}
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > ./src/components/sections/TheTreasury.jsx
import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../../hooks/usePirateIntel';

const GUILDS = [
  {
    id: 'quartermaster',
    name: "The Quartermaster’s Exchange",
    icon: 'Package',
    meta: "Supply Rating: Nominal",
    content: "Guides on localized agriculture, securing surplus electronics, and building community mesh-networks.",
    category: "quartermaster"
  },
  {
    id: 'shipwright',
    name: "The Shipwright’s Guild",
    icon: 'Tool',
    meta: "Infrastructure: Expanding",
    content: "Open-source 3D printing schematics, off-grid power systems, and repair guides for proprietary hardware.",
    category: "shipwright"
  },
  {
    id: 'navigator',
    name: "The Navigator’s Charts",
    icon: 'Compass',
    meta: "Civic Action: High",
    content: "FOIA templates, campaign finance trackers, and lobbying strategies for the people.",
    category: "navigator"
  },
  {
    id: 'surgeon',
    name: "The Surgeon’s Dispensary",
    icon: 'PlusSquare',
    meta: "Aid Priority: Critical",
    content: "Mental health resources, mutual aid network directories, and medical supply chain maps.",
    category: "surgeon"
  }
];

export function TheTreasury() {
  const [activeTab, setActiveTab] = useState('guilds'); // 'guilds' or 'ledger'
  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);
  const [ledger, setLedger] = useState([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const { data: guides, loading, error } = usePirateIntel(`posts?search=${activeGuild.category}&_embed&per_page=3`);

  // Simulate fetching live ledger data
  useEffect(() => {
    if (activeTab === 'ledger' && ledger.length === 0) {
      setTimeout(() => {
        setLedger([
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '12,450 USDC', target: 'Tactical Funding: Community Aid', status: 'Settled', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '4,200 USDC', target: 'Resource Allocation: Node Expansion', status: 'Settled', date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '8,900 USDC', target: 'Tactical Funding: Legal Defense', status: 'Pending', date: new Date().toISOString().split('T')[0] },
          { txId: '0x' + Math.random().toString(16).substr(2, 8), amount: '1,500 USDC', target: 'Resource Allocation: Server Upkeep', status: 'Settled', date: new Date(Date.now() - 432000000).toISOString().split('T')[0] },
        ]);
      }, 800);
    }
  }, [activeTab, ledger.length]);

  return (
    <section className="py-24 bg-apf-black neon-grid relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-800 pb-4">
           <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Federation Assets</h2>
              <p className="font-vt323 text-apf-purple mt-2 tracking-widest">[ DECENTRALIZED_RESOURCE_ALLOCATION ]</p>
           </div>

           <div className="flex gap-4 mt-6 md:mt-0 font-vt323 text-sm uppercase">
             <button
               onClick={() => setActiveTab('guilds')}
               className={`pb-2 transition-colors ${activeTab === 'guilds' ? 'text-apf-purple border-b-2 border-apf-purple' : 'text-gray-500 hover:text-white'}`}
             >
               Intel & Blueprints
             </button>
             <button
               onClick={() => setActiveTab('ledger')}
               className={`pb-2 transition-colors ${activeTab === 'ledger' ? 'text-apf-purple border-b-2 border-apf-purple' : 'text-gray-500 hover:text-white'}`}
             >
               Mothership Ledger
             </button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'guilds' ? (
            <motion.div
              key="guilds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col lg:flex-row gap-12"
            >
              {/* Guilds List */}
              <div className="lg:w-1/3">
                <div className="space-y-4">
                  {GUILDS.map((guild) => (
                    <button
                      key={guild.id}
                      onClick={() => setActiveGuild(guild)}
                      className={`w-full text-left p-4 flex items-center gap-4 border transition-all ${
                        activeGuild.id === guild.id
                        ? 'border-apf-purple bg-apf-purple/10 text-white'
                        : 'border-white/5 bg-black/40 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <SafeIcon name={guild.icon} className={activeGuild.id === guild.id ? 'text-apf-purple' : ''} />
                      <span className="font-vt323 text-lg uppercase tracking-wider">{guild.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guild Details */}
              <div className="lg:w-2/3 min-h-[400px] border border-apf-purple/30 bg-black/60 backdrop-blur-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 font-vt323 text-apf-purple opacity-30">
                  {activeGuild.meta}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeGuild.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="prose prose-invert max-w-none"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-apf-purple/20 border border-apf-purple">
                        <SafeIcon name={activeGuild.icon} className="h-8 w-8 text-apf-purple" />
                      </div>
                      <h3 className="text-3xl font-cinzel uppercase m-0">{activeGuild.name}</h3>
                    </div>

                    <p className="font-vt323 text-apf-purpleLight text-xl leading-relaxed">
                      {activeGuild.content}
                    </p>

                    <div className="mt-8 pt-8 border-t border-white/10">
                      <h4 className="font-vt323 text-lg text-white mb-4 uppercase tracking-widest">[ DECRYPTED_BLUEPRINTS ]</h4>
                      {loading && <p className="font-vt323 text-gray-500 animate-pulse">Syncing Intel...</p>}
                      {error && <p className="font-vt323 text-red-500">SIGNAL INTERRUPTED: {error}</p>}
                      {!loading && !error && guides && guides.length > 0 && (
                        <ul className="space-y-3">
                          {guides.map((guide) => (
                            <li key={guide.id} className="border border-white/10 p-3 bg-black/40 hover:border-apf-purple transition-all cursor-pointer">
                               <a href={guide.link} target="_blank" rel="noreferrer" className="block text-apf-purple hover:text-white font-vt323 text-lg uppercase">
                                  &gt; {guide.title?.rendered || "CLASSIFIED_DOCUMENT"}
                               </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!loading && !error && (!guides || guides.length === 0) && (
                         <p className="font-vt323 text-gray-500">No active blueprints currently verified for this sector.</p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-black/60 border border-gray-800 p-8">
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                   <div>
                     <h3 className="text-2xl font-bold uppercase text-white">Treasury Transparency</h3>
                     <p className="font-vt323 text-gray-500 text-sm">Real-time ledger of federation resource allocation.</p>
                   </div>
                   <button
                     onClick={() => setIsAuditing(!isAuditing)}
                     className="flex items-center gap-2 border border-apf-purple text-apf-purple px-4 py-2 font-vt323 text-xs uppercase hover:bg-apf-purple hover:text-white transition-colors"
                   >
                     <SafeIcon name="Download" className="h-4 w-4" /> {isAuditing ? 'Close Audit View' : 'Verify Audit (IPFS)'}
                   </button>
                 </div>

                 {isAuditing && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-black border border-apf-purple/50 p-4 mb-8 font-vt323 text-xs text-apf-purple overflow-x-auto"
                   >
                     <div className="mb-2 text-white">IPFS Hash: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi</div>
                     <pre className="text-gray-400">
{JSON.stringify({
  "@context": "apf-ledger",
  "contract": "0xAPF...Treasury",
  "lastSync": new Date().toISOString(),
  "merkleRoot": "0x" + Math.random().toString(16).substring(2),
  "verification": "SUCCESS",
  "status": "Immutable"
}, null, 2)}
                     </pre>
                   </motion.div>
                 )}

                 <div className="overflow-x-auto">
                    <table className="w-full text-left font-vt323">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-900 border-b border-gray-800">
                        <tr>
                          <th className="px-6 py-3">TxHash</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Allocation</th>
                          <th className="px-6 py-3">Directive</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm relative min-h-[200px]">
                        {ledger.length === 0 ? (
                           <tr>
                             <td colSpan="5" className="text-center py-12 text-apf-purple animate-pulse">
                               SYNCING LEDGER FROM DECENTRALIZED NODES...
                             </td>
                           </tr>
                        ) : (
                          ledger.map((tx, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-apf-purple">{tx.txId}</td>
                              <td className="px-6 py-4 text-gray-400">{tx.date}</td>
                              <td className="px-6 py-4 text-white font-bold">{tx.amount}</td>
                              <td className="px-6 py-4 text-gray-300">{tx.target}</td>
                              <td className="px-6 py-4 text-right">
                                 <span className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${
                                   tx.status === 'Settled' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                                 }`}>
                                   {tx.status}
                                 </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                 </div>

                 <div className="mt-6 text-center font-vt323 text-gray-500 text-sm">
                   [ FULFILLING_ARTICLE_II: RADICAL_TRANSPARENCY ]
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
INNER_EOF

cat << 'INNER_EOF' > ./src/store/useAppStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      musterRollDraft: {
        alias: '',
        comms: '',
        skills: '',
        walletAddress: '',
        status: 'idle',
      },
      userRole: 'Unverified', // Roles: Unverified, Deckhand, Navigator, Guild Master
      policySignals: {}, // Track signaled policies { policyCode: true }
      reputationPoints: 100, // Mock reputation
      updateMusterRoll: (data) =>
        set((state) => {
          let newRole = state.userRole;

          // Basic logic to determine user role based on wallet or activity
          if (data.walletAddress && state.userRole === 'Unverified') {
            newRole = 'Deckhand';
          }

          if (data.status === 'committed' && newRole === 'Deckhand') {
              newRole = 'Navigator';
          }

          return {
            musterRollDraft: { ...state.musterRollDraft, ...data },
            userRole: newRole
          };
        }),
      clearMusterRoll: () =>
        set({
          musterRollDraft: { alias: '', comms: '', skills: '', walletAddress: '', status: 'idle' },
          userRole: 'Unverified'
        }),
      signalPolicy: (policyCode) =>
        set((state) => ({
          policySignals: { ...state.policySignals, [policyCode]: !state.policySignals[policyCode] }
        })),
      spendReputation: (amount) =>
        set((state) => ({
          reputationPoints: Math.max(0, state.reputationPoints - amount)
        })),
    }),
    {
      name: 'apf-muster-storage', // Save to local storage for resilience
      partialize: (state) => ({
        musterRollDraft: {
            alias: state.musterRollDraft.alias,
            walletAddress: state.musterRollDraft.walletAddress,
            status: state.musterRollDraft.status
        },
        userRole: state.userRole,
        policySignals: state.policySignals,
        reputationPoints: state.reputationPoints
      }), // Save only specific parts, ignoring volatile UI state like comms/skills draft
    }
  )
);
INNER_EOF

cat << 'INNER_EOF' > ./src/pages/TransmissionHub.jsx
import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../hooks/usePirateIntel';
import DOMPurify from 'isomorphic-dompurify';

export function TransmissionHub() {
  const { data: episodes, loading, error } = usePirateIntel('posts?_embed&per_page=5');
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  const togglePlay = (episode) => {
    if (activeEpisode?.id === episode.id) {
      setIsPlaying(!isPlaying);
    } else {
      setIsGlitching(true);
      setTimeout(() => {
        setActiveEpisode(episode);
        setIsPlaying(true);
        setIsGlitching(false);
      }, 300); // 300ms glitch duration
    }
  };

  const getMetadata = (episode) => {
    const author = episode._embedded?.author?.[0]?.name || "Anonymous Deckhand";
    const duration = Math.floor(Math.random() * 40 + 20) + ":" + Math.floor(Math.random() * 60).toString().padStart(2, '0');
    const correlation = `Article ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][Math.floor(Math.random() * 7)]}`;
    return { author, duration, correlation };
  };

  return (
    <Layout>
      <SEO title="The Signal | Direct Transmissions" description="Direct Transmissions from the Bridge. The official APF podcast." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Radio" className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                The Signal
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
              Direct Transmissions from the Bridge. Unfiltered tactical analysis and federation updates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Audio Player Panel */}
            <div className="lg:col-span-1">
               <div className={`sticky top-24 bg-black/60 border border-apf-purple/30 p-6 backdrop-blur-md transition-all ${isGlitching ? 'glitch-hover animate-pulse grayscale opacity-50' : ''}`}>
                 <div className="mb-6 border-b border-gray-800 pb-4 relative min-h-[80px]">
                    <span className="font-vt323 text-xs uppercase text-apf-purple tracking-widest block mb-2">Current Frequency</span>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={activeEpisode ? activeEpisode.id : 'empty'}
                        initial={{ opacity: 0, x: isGlitching ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isGlitching ? 10 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-xl font-bold text-white line-clamp-2"
                      >
                         {activeEpisode ? (
                            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeEpisode.title.rendered) }} />
                         ) : "TUNING..."}
                      </motion.h3>
                    </AnimatePresence>
                 </div>

                 {/* Custom Audio Visualizer (SVG) */}
                 <div className="h-24 w-full bg-gray-900 mb-6 flex items-end justify-center gap-1 overflow-hidden relative">
                    {!activeEpisode && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-gray-600">AWAITING_SIGNAL</span>}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 bg-apf-purple"
                        animate={(isPlaying && activeEpisode) || isGlitching ? {
                          height: [`${Math.random() * 20 + 10}%`, `${Math.random() * 80 + 20}%`, `${Math.random() * 20 + 10}%`]
                        } : { height: '10%' }}
                        transition={{
                          duration: isGlitching ? 0.1 : Math.random() * 0.5 + 0.3,
                          repeat: Infinity,
                          repeatType: "mirror"
                        }}
                      />
                    ))}
                 </div>

                 {/* Meta Info */}
                 {activeEpisode && (
                   <div className="mb-6 space-y-2 border-b border-gray-800 pb-4">
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Op. Lead:</span>
                       <span className="text-apf-purpleLight">{getMetadata(activeEpisode).author}</span>
                     </div>
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Duration:</span>
                       <span className="text-white">{getMetadata(activeEpisode).duration}</span>
                     </div>
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Correlation:</span>
                       <span className="text-apf-purpleLight">{getMetadata(activeEpisode).correlation}</span>
                     </div>
                   </div>
                 )}

                 {/* Player Controls */}
                 <div className="flex items-center justify-between mt-4">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon name="SkipBack" />
                    </button>
                    <button
                      onClick={() => activeEpisode && togglePlay(activeEpisode)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        activeEpisode ? 'bg-apf-purple hover:bg-apf-purpleLight text-white cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!activeEpisode || isGlitching}
                    >
                      <SafeIcon name={isPlaying ? "Pause" : "Play"} className="h-6 w-6 ml-1" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon name="SkipForward" />
                    </button>
                 </div>

                 {activeEpisode && (
                   <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                     <span className="font-vt323 text-xs text-apf-purple animate-pulse">BROADCASTING_LIVE</span>
                   </div>
                 )}
               </div>
            </div>

            {/* Episode List */}
            <div className="lg:col-span-2 space-y-6">
               <h2 className="font-vt323 text-2xl text-white uppercase tracking-widest border-b border-white/10 pb-2">Transmission Logs</h2>

               {loading ? (
                  <div className="py-12 flex items-center text-apf-purple font-vt323">
                    <SafeIcon name="Loader" className="animate-spin mr-2 h-5 w-5" />
                    SCANNING FREQUENCIES...
                  </div>
               ) : error || !episodes ? (
                  <div className="py-12 text-red-500 font-vt323">
                     [COMM_LINK_DOWN]
                  </div>
               ) : (
                  episodes.map((episode) => {
                    const meta = getMetadata(episode);
                    return (
                    <div
                      key={episode.id}
                      className={`p-6 border transition-all cursor-pointer ${
                        activeEpisode?.id === episode.id ? 'border-apf-purple bg-apf-purple/5' : 'border-gray-800 bg-black/40 hover:border-apf-purple/50'
                      }`}
                      onClick={() => togglePlay(episode)}
                    >
                       <div className="flex justify-between items-start mb-2">
                         <span className="font-vt323 text-apf-purple text-sm">EP_{episode.id} // {new Date(episode.date).toLocaleDateString()}</span>
                         {activeEpisode?.id === episode.id && isPlaying && (
                            <SafeIcon name="Volume2" className="text-apf-purple h-4 w-4 animate-pulse" />
                         )}
                       </div>
                       <h3
                         className="text-xl font-bold text-white mb-3"
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.title.rendered) }}
                       />
                       <div
                        className="prose prose-invert prose-sm text-gray-400 line-clamp-2 font-sans mb-4"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.excerpt.rendered) }}
                      />
                      <div className="flex gap-4 font-vt323 text-xs text-gray-500 border-t border-gray-800/50 pt-2">
                         <span>Op: {meta.author}</span>
                         <span>Len: {meta.duration}</span>
                         <span className="text-apf-purpleLight ml-auto">{meta.correlation}</span>
                      </div>
                    </div>
                  )})
               )}
            </div>

          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
INNER_EOF

cat << 'INNER_EOF' > ./src/pages/Armory.jsx
import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';

const PROVISIONS = [
  {
    id: 'badge-1',
    name: 'Federation Deckhand Pin',
    price: 15,
    type: 'Hardware',
    image: 'https://images.unsplash.com/photo-1614729939124-03290b5509ce?w=500&auto=format&fit=crop&q=60',
    requirement: 'Deckhand'
  },
  {
    id: 'hoodie-1',
    name: 'Stealth-Mesh Protocol Hoodie',
    price: 45,
    type: 'Apparel',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60',
    requirement: 'Unverified' // Open to all
  },
  {
    id: 'comms-1',
    name: 'Encrypted Comms Module',
    price: 120,
    type: 'Tech',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    requirement: 'Navigator'
  }
];

export function Armory() {
  const { userRole, musterRollDraft, reputationPoints, spendReputation } = useAppStore();
  const [procuring, setProcuring] = useState(null);

  const isEligible = (req) => {
    if (req === 'Unverified') return true;
    const isCommitted = musterRollDraft.status === 'committed';
    const hasWallet = !!musterRollDraft.walletAddress;

    if (req === 'Deckhand' && hasWallet && ['Deckhand', 'Navigator', 'Guild Master'].includes(userRole)) return true;
    if (req === 'Navigator' && hasWallet && isCommitted && ['Navigator', 'Guild Master'].includes(userRole)) return true;
    if (req === 'Guild Master' && hasWallet && isCommitted && userRole === 'Guild Master') return true;

    return false;
  };

  const handleRequisition = (item) => {
    if (reputationPoints >= item.price) {
      setProcuring(item.id);
      setTimeout(() => {
        spendReputation(item.price);
        setProcuring(null);
        // Alert is generally bad practice, but good enough for a mock
        // alert(`\${item.name} procured successfully.`);
      }, 1000);
    } else {
      // alert('Insufficient Reputation Points.');
    }
  };

  return (
    <Layout>
      <SEO title="The Armory | Quartermaster Provisions" description="Procure official Federation gear and sovereign hardware." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
               <div className="flex items-center gap-4 mb-6">
                <SafeIcon name="Shield" className="h-10 w-10 text-apf-purple" />
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                  The Armory
                </h1>
              </div>
              <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
                Quartermaster Provisions. High-grade equipment for verified Federation units.
              </p>
            </div>

            {/* Clearance Status */}
            <div className="bg-black/60 border border-gray-800 p-4 font-vt323 text-sm inline-block min-w-[250px]">
               <div className="text-gray-500 uppercase mb-1">Current Clearance</div>
               <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                 <div className={`h-2 w-2 rounded-full ${musterRollDraft.walletAddress ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 <span className={musterRollDraft.walletAddress ? 'text-white' : 'text-gray-400'}>
                   {userRole}
                 </span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500 uppercase">Reputation:</span>
                 <span className="text-apf-purpleLight font-bold">{reputationPoints} PTS</span>
               </div>
               {!musterRollDraft.walletAddress && (
                 <div className="mt-2 text-xs text-apf-purple">Connect wallet to upgrade clearance</div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {PROVISIONS.map((item) => {
               const eligible = isEligible(item.requirement);
               const canAfford = reputationPoints >= item.price;

               return (
                 <div key={item.id} className="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-apf-purple/50 transition-all group relative overflow-hidden flex flex-col">
                    {/* Item Image */}
                    <div className="h-64 relative overflow-hidden bg-gray-900 border-b border-white/5">
                      <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay z-10" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${eligible ? 'group-hover:scale-110' : 'grayscale opacity-50'}`}
                      />
                      {!eligible && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
                           <div className="text-center font-vt323">
                              <SafeIcon name="Lock" className="mx-auto h-8 w-8 text-red-500 mb-2" />
                              <div className="text-red-500 font-bold uppercase tracking-widest text-sm">Restricted Access</div>
                              <div className="text-gray-400 text-xs mt-1">Requires {item.requirement} Clearance</div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-grow flex flex-col">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <span className="font-vt323 text-xs text-apf-purple uppercase tracking-widest border border-apf-purple/30 px-2 py-1 mb-2 inline-block bg-apf-purple/10">
                             {item.type}
                           </span>
                           <h3 className="text-xl font-bold text-white leading-tight">{item.name}</h3>
                         </div>
                       </div>

                       <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-800/50">
                         <span className={`font-vt323 text-lg ${canAfford ? 'text-white' : 'text-red-500'}`}>
                           {item.price} PTS
                         </span>
                         <button
                           disabled={!eligible || procuring === item.id || !canAfford}
                           onClick={() => handleRequisition(item)}
                           className={`px-4 py-2 font-vt323 text-xs uppercase tracking-widest transition-all border ${
                             !eligible || !canAfford
                             ? 'border-gray-800 text-gray-600 cursor-not-allowed bg-black/50'
                             : 'border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white'
                           }`}
                         >
                           {procuring === item.id ? 'Requisitioning...' : (!eligible ? 'Locked' : (!canAfford ? 'Insufficient Pts' : 'Requisition'))}
                         </button>
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
INNER_EOF

cat << 'INNER_EOF' > ./src/components/sections/MusterRoll.jsx
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import SafeIcon from '../../common/SafeIcon';
import DOMPurify from 'isomorphic-dompurify';

export function MusterRoll() {
    const { musterRollDraft, updateMusterRoll } = useAppStore();

  const handleConnectWallet = async () => {
    // Simulated Web3 connection
    updateMusterRoll({ walletAddress: '0x' + Math.random().toString(16).substr(2, 40) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateMusterRoll({ status: 'queued' });

    const sanitizedData = {
      alias: DOMPurify.sanitize(musterRollDraft.alias),
      comms: DOMPurify.sanitize(musterRollDraft.comms),
      skills: DOMPurify.sanitize(musterRollDraft.skills),
      walletAddress: DOMPurify.sanitize(musterRollDraft.walletAddress)
    };

    // Simulate Firestore Backend Sync to /artifacts/apf/users/
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('Syncing to Firestore /artifacts/apf/users/ ...', sanitizedData);
      // alert('ENLISTMENT DATA COMMITTED TO THE SOVEREIGN LEDGER.');
      updateMusterRoll({ status: 'committed' });
    } catch (err) {
      updateMusterRoll({ status: 'error' });
    }
  };

  return (
    <div id="enlist" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-apf-gray border border-apf-purple/30 p-12 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-apf-purple to-transparent" />

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-cinzel font-black uppercase tracking-widest mb-4">
            Join the Fleet
          </h2>
          <p className="font-vt323 text-apf-purple text-lg uppercase tracking-[0.3em]">
            [ INITIALIZE_CONNECTION_SEQUENCE ]
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
               <button
                 type="button"
                 onClick={handleConnectWallet}
                 className="bg-apf-purple/20 hover:bg-apf-purple/40 border border-apf-purple text-white font-vt323 px-4 py-2 transition-colors flex items-center gap-2"
               >
                 <SafeIcon name="Key" />
                 {musterRollDraft.walletAddress ? 'Wallet Connected' : 'Connect Wallet (Web3)'}
               </button>
               {musterRollDraft.walletAddress && (
                 <span className="font-vt323 text-apf-purpleLight text-sm truncate max-w-[200px] block">
                   {musterRollDraft.walletAddress}
                 </span>
               )}
            </div>
            <p className="font-vt323 text-xs text-gray-500 uppercase">Article VII: Data Ownership. Connect wallet to claim sovereign identity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="alias">
                Alias_Callsign
              </label>
              <input
                id="alias"
                type="text"
                required
                value={musterRollDraft.alias}
                onChange={(e) => updateMusterRoll({ alias: e.target.value })}
                className="w-full bg-black border-b border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors"
                placeholder="Ex: Ghost_Vessel"
              />
            </div>

            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="comms">
                Signal_Endpoint
              </label>
              <input
                id="comms"
                type="text"
                required
                value={musterRollDraft.comms}
                onChange={(e) => updateMusterRoll({ comms: e.target.value })}
                className="w-full bg-black border-b border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors"
                placeholder="SIGNAL_ENDPOINT"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="skills">
              Primary_Skillset
            </label>
            <textarea
              id="skills"
              rows={3}
              value={musterRollDraft.skills}
              onChange={(e) => updateMusterRoll({ skills: e.target.value })}
              className="w-full bg-black border border-gray-800 p-4 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors resize-none"
              placeholder="Code, Logistics, Agitprop, Healthcare..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-apf-purple hover:bg-white hover:text-apf-black text-white font-cinzel font-bold py-5 px-8 transition-all uppercase tracking-widest flex justify-center items-center gap-3 text-xl shadow-[0_0_20px_rgba(148,0,255,0.3)]"
          >
            <SafeIcon name="UploadCloud" />
            Commit to Ledger
          </button>

          {musterRollDraft.status === 'queued' && (
             <div className="text-apf-purple font-vt323 text-center animate-pulse">
                STATUS: SYNCING_TO_LEDGER...
             </div>
          )}
          {musterRollDraft.status === 'committed' && (
             <div className="text-green-500 font-vt323 text-center">
                STATUS: ENLISTMENT_DATA_COMMITTED_TO_SOVEREIGN_LEDGER
             </div>
          )}
        </form>
      </div>
    </div>
  );
}
INNER_EOF

npm run build
git add .
git commit -m "feat: complete APF Phase 4 sovereign engine build plan"
