import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { PolicyCard } from '../components/sections/PolicyCard';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiBookOpen } = FiIcons;

const POLICIES = [
  {
    title: "Digital Sovereignty Act",
    code: "APF-001",
    summary: "Ensuring individual ownership of data and cryptographic identity across all federation nodes.",
    status: "Active",
    consensus: 94,
    sponsor: "Navigator's Guild",
    lastRevision: "2023.11.04"
  },
  {
    title: "The Fleet Mutual Aid Pact",
    code: "APF-002",
    summary: "Protocol for resource sharing and legal defense of federation members under state pressure.",
    status: "Active",
    consensus: 88,
    sponsor: "Surgeon's Dispensary",
    lastRevision: "2024.01.12"
  },
  {
    title: "Decentralized Governance Draft",
    code: "APF-003",
    summary: "Proposed framework for liquid democracy voting on federation resource allocation.",
    status: "In Review",
    consensus: 62,
    sponsor: "Quartermaster's Provisions",
    lastRevision: "2024.02.28"
  },
  {
    title: "Intellectual Property Abolition",
    code: "APF-004",
    summary: "The federation's stance on the open-source requirement for all assistive technologies.",
    status: "Active",
    consensus: 75,
    sponsor: "Shipwright's Guild",
    lastRevision: "2023.09.15"
  }
];

export function Policies() {
  return (
    <Layout>
      <SEO title="Policies | The Chartroom" description="The legislative drafts and sovereign protocols of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon icon={FiBookOpen} className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                The Chartroom
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg border-l-2 border-apf-purple pl-6">
              Sovereignty is not given; it is coded. These are the foundational protocols governing the American Pirate Federation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {POLICIES.map((policy) => (
              <PolicyCard key={policy.code} {...policy} />
            ))}
          </div>


          <div className="mt-16 p-8 border border-dashed border-gray-800 bg-black/20 text-center">
            <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">Proposed Amendments (Drafts)</h3>
            <p className="text-gray-500 font-mono text-sm mb-6 max-w-2xl mx-auto">
              Unverified members can view upcoming motions before they reach the active voting floor. Upgrade clearance to cast a signal.
            </p>
            <div className="flex flex-col gap-4 text-left max-w-2xl mx-auto">
                <div className="border-l-2 border-gray-600 pl-4 py-2">
                    <div className="text-gray-400 font-mono text-xs uppercase mb-1">DRAFT-001 // Signal Protocol</div>
                    <div className="text-white font-bold">Standardized Encryption for Comms</div>
                </div>
                <div className="border-l-2 border-gray-600 pl-4 py-2">
                    <div className="text-gray-400 font-mono text-xs uppercase mb-1">DRAFT-002 // Fleet Logistics</div>
                    <div className="text-white font-bold">Decentralized Supply Chain Verification</div>
                </div>
            </div>
          </div>

          <div className="mt-20 p-8 border border-dashed border-gray-800 text-center">
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
              [ End of Current Legislative Stack ]
            </p>
            <button className="mt-4 text-apf-purple hover:text-white font-mono text-xs uppercase underline underline-offset-4">
              Propose New Protocol Revision
            </button>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
