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
    status: "Active"
  },
  {
    title: "The Fleet Mutual Aid Pact",
    code: "APF-002",
    summary: "Protocol for resource sharing and legal defense of federation members under state pressure.",
    status: "Active"
  },
  {
    title: "Decentralized Governance Draft",
    code: "APF-003",
    summary: "Proposed framework for liquid democracy voting on federation resource allocation.",
    status: "In Review"
  },
  {
    title: "Intellectual Property Abolition",
    code: "APF-004",
    summary: "The federation's stance on the open-source requirement for all assistive technologies.",
    status: "Active"
  }
];

export function Policies() {
  return (
    <Layout>
      <SEO title="Policies | The Code" description="The legislative drafts and sovereign protocols of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon icon={FiBookOpen} className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                The Code
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg border-l-2 border-apf-purple pl-6">
              Sovereignty is not given; it is coded. These are the foundational protocols governing the American Pirate Federation and its autonomous nodes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {POLICIES.map((policy) => (
              <PolicyCard key={policy.code} {...policy} />
            ))}
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