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
        </div>
      </PageTransition>
    </Layout>
  );
}