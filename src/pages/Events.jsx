import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { FleetMuster } from '../components/sections/FleetMuster';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiTarget } = FiIcons;

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

export function Events() {
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
              <SafeIcon icon={FiIcons.FiArchive} className="text-apf-purple" />
              Past Musters / Dispatch Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="group cursor-pointer">
                  <div className="h-48 bg-gray-900 border border-gray-800 overflow-hidden relative mb-4">
                     <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay group-hover:bg-transparent transition-colors z-10" />
                     <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60" alt="Past Event" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                  </div>
                  <div className="font-mono text-sm text-apf-purple mb-1">JAN 2024 // LOS ANGELES</div>
                  <h3 className="text-xl font-bold text-white group-hover:text-apf-purpleLight transition-colors">West Coast Assembly</h3>
                  <a href="#" className="text-xs text-gray-500 underline mt-2 block hover:text-white">View Dispatch Report</a>
               </div>
               <div className="group cursor-pointer">
                  <div className="h-48 bg-gray-900 border border-gray-800 overflow-hidden relative mb-4">
                     <div className="absolute inset-0 bg-apf-purple/20 mix-blend-overlay group-hover:bg-transparent transition-colors z-10" />
                     <img src="https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&auto=format&fit=crop&q=60" alt="Past Event" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                  </div>
                  <div className="font-mono text-sm text-apf-purple mb-1">NOV 2023 // CHICAGO</div>
                  <h3 className="text-xl font-bold text-white group-hover:text-apf-purpleLight transition-colors">Great Lakes Node Sync</h3>
                  <a href="#" className="text-xs text-gray-500 underline mt-2 block hover:text-white">View Dispatch Report</a>
               </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}