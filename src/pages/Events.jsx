import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { FleetMuster } from '../components/sections/FleetMuster';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { AnimatePresence, motion } from 'framer-motion';

const { FiTarget, FiArchive, FiX } = FiIcons;

const EVENTS = [
  {
    title: "Node Zero Synchronization",
    date: "14 MAR",
    location: "Virtual / Encrypted",
    time: "22:00 UTC",
    capacity: "Unlimited"
  },
  {
    title: "East Coast Fleet Muster",
    date: "22 APR",
    location: "Brooklyn, NY",
    time: "19:00 EST",
    capacity: "200 Units"
  },
  {
    title: "The Signal: Live Broadcast",
    date: "05 MAY",
    location: "Distributed Signal",
    time: "20:00 CST",
    capacity: "Open"
  }
];

const PAST_EVENTS = [
    {
        id: "west-coast",
        title: "West Coast Assembly",
        date: "JAN 2024",
        location: "LOS ANGELES",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
        report: `
### Dispatch Code: WCA-0124
**Operation Status:** Successful Sync
**Nodes Activated:** 42

The assembly at the Los Angeles coordinates achieved a 98% synchronization rate. Key protocols were distributed among the local guilds, and encrypted comms relays were successfully stress-tested under simulated disruption scenarios.

* "A massive step forward for the West Coast fleet." - Guild Master Cipher
* Resource requisition requests have been forwarded to the Quartermaster.

Next sync point is being determined. Maintain radio silence until broadcast.
        `
    },
    {
        id: "great-lakes",
        title: "Great Lakes Node Sync",
        date: "NOV 2023",
        location: "CHICAGO",
        image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&auto=format&fit=crop&q=60",
        report: `
### Dispatch Code: GLN-1123
**Operation Status:** Partial Disruption
**Nodes Activated:** 18

The synchronization sequence was initiated but faced localized signal interference. Backup relays were activated successfully, preventing data loss. The Surgeon's Dispensary conducted local mutual aid training, distributing crucial medical knowledge offline.

**Action Items:**
1. Upgrade localized mesh-network hardware.
2. Review Article VII protocols regarding signal obfuscation.

The fleet remains resilient.
        `
    }
];

export function Events() {
  const [activeReport, setActiveReport] = useState(null);

  return (
    <Layout>
      <SEO title="Events | Fleet Muster" description="Upcoming gatherings and synchronization points for the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon icon={FiTarget} className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                Fleet Muster
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg">
              Physical and digital convergence points for the federation. Presence is participation.
            </p>
          </div>

          <div className="border-t border-gray-800">
            {EVENTS.map((event, idx) => (
              <FleetMuster key={idx} event={event} />
            ))}
          </div>

          <div className="mt-24 border-t border-gray-800 pt-16">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-3">
              <SafeIcon icon={FiArchive} className="text-apf-purple" />
              Past Musters / Dispatch Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {PAST_EVENTS.map(event => (
                   <div key={event.id} className="group flex flex-col bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500 p-6 cursor-pointer" onClick={() => setActiveReport(event)}>
                      <div className="h-48 bg-black/40 overflow-hidden relative mb-4">
                         <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay group-hover:bg-transparent transition-colors z-10" />
                         <img src={event.image} alt="Past Event" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                      </div>
                      <div className="font-vt323 text-sm text-apf-purple mb-1 uppercase tracking-widest">{event.date} // {event.location}</div>
                      <h3 className="text-xl font-bold text-white group-hover:text-apf-purpleLight transition-colors cursor-pointer" onClick={() => setActiveReport(event)}>
                          {event.title}
                      </h3>
                      <button onClick={() => setActiveReport(event)} className="text-xs font-vt323 text-gray-500 uppercase underline tracking-widest mt-2 block hover:text-white w-fit text-left">
                          View Dispatch Report
                      </button>
                   </div>
               ))}
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Dispatch Report Modal */}
      <AnimatePresence>
          {activeReport && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                  <motion.div
                      initial={{ scale: 0.95, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 20 }}
                      className="bg-apf-black border border-apf-purple/50 max-w-2xl w-full max-h-[80vh] flex flex-col relative overflow-hidden neon-grid"
                  >
                      <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />

                      <div className="relative z-10 flex justify-between items-center p-4 border-b border-gray-800 bg-black/80">
                          <h3 className="font-vt323 text-xl text-white uppercase tracking-widest flex items-center gap-2">
                              <SafeIcon name="FileText" className="text-apf-purple" /> Dispatch Report
                          </h3>
                          <button onClick={() => setActiveReport(null)} className="text-gray-500 hover:text-white transition-colors">
                              <SafeIcon icon={FiX} className="h-6 w-6" />
                          </button>
                      </div>

                      <div className="relative z-10 p-6 overflow-y-auto custom-scrollbar flex-grow bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all duration-500">
                          <div className="font-vt323 text-apf-purple mb-2 uppercase tracking-widest text-sm">
                              {activeReport.date} // {activeReport.location}
                          </div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-6">
                              {activeReport.title}
                          </h2>
                          <div className="prose prose-invert prose-p:font-vt323 prose-p:text-lg prose-p:text-gray-300 prose-a:text-apf-purple prose-strong:text-white max-w-none" dangerouslySetInnerHTML={{ __html: require('isomorphic-dompurify').sanitize(require('marked').parse(activeReport.report)) }} />
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </Layout>
  );
}
