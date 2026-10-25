import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { DonateWidget } from '../components/donate/DonateWidget';
import SafeIcon from '../common/SafeIcon';

export function Donate() {
  return (
    <Layout>
      <SEO title="Donate | APF Action" description="Fund the American Pirate Federation through APF Action." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <SafeIcon name="DollarSign" className="h-10 w-10 text-apf-emerald" />
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                  Fund the Fleet
                </h1>
              </div>
              <p className="text-gray-400 font-mono text-lg mb-8">
                The American Pirate Federation utilizes a Sidecar financial model.
                Credit card contributions route through APF Action (501c4) for immediate political operation and mutual aid.
                Cryptocurrency dues route directly to the DAO Safe multisig for decentralized treasury management.
              </p>
              <div className="bg-black/40 border border-apf-emerald/30 p-6 font-vt323 text-gray-300">
                <h3 className="text-xl text-apf-emerald mb-2 uppercase">[ APF Action Directives ]</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Lobbying for the Zero-Data Protocol and anti-surveillance legislation</li>
                  <li>Direct Mutual Aid funding for aligned fleet members</li>
                  <li>Operational overhead for decentralized infrastructure</li>
                </ul>
              </div>
            </div>

            <div className="w-full md:w-auto flex justify-center md:justify-end">
              <DonateWidget />
            </div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
