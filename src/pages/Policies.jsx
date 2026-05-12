import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { PolicyCard } from '../components/sections/PolicyCard';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

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
,  {
    title: "Corporate Housing Nullification",
    code: "APF-005",
    summary: "Human Right Provision: Legal protocols to remove for-profit corporations from single-family housing markets.",
    status: "Active",
    consensus: 85,
    sponsor: "Quartermaster's Provisions",
    lastRevision: "2024.03.15"
  },
  {
    title: "Universal Resource Guarantee",
    code: "APF-006",
    summary: "Human Right Provision: Blueprint for public water and food distribution infrastructure.",
    status: "Active",
    consensus: 91,
    sponsor: "Surgeon's Dispensary",
    lastRevision: "2024.03.20"
  },
  {
    title: "Green Transit Initiative",
    code: "APF-007",
    summary: "Fossil Fuel Divestment Directive: Transitioning public infrastructure to renewable energy-based transportation.",
    status: "In Review",
    consensus: 78,
    sponsor: "Shipwright's Guild",
    lastRevision: "2024.04.02"
  },
  {
    title: "The 1950s Tax Restoration Act",
    code: "APF-008",
    summary: "Equitable Contribution Directive: Implementing high-bracket taxes on excessive wealth hoarding.",
    status: "Active",
    consensus: 95,
    sponsor: "Federation Reserve",
    lastRevision: "2024.04.10"
  },
  {
    title: "Fleet Labor Accord",
    code: "APF-009",
    summary: "Union Assembly Protection: Comprehensive tools for immediate unionization support and collective bargaining.",
    status: "Active",
    consensus: 89,
    sponsor: "Navigator's Guild",
    lastRevision: "2024.04.18"
  },
  {
    title: "Open Academy Protocol",
    code: "APF-010",
    summary: "Human Right Provision: Framework for free, high-tier decentralized education solutions.",
    status: "In Review",
    consensus: 82,
    sponsor: "Shipwright's Guild",
    lastRevision: "2024.04.25"
  }
];

export function Policies() {
  const navigate = useNavigate();
  const { proposedAmendments } = useAppStore();

  return (
    <Layout>
      <SEO title="Policies | American Pirate Federation" description="The legislative drafts and sovereign protocols of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon icon={FiBookOpen} className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                Policies
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


          <div className="mt-16 p-8 border border-dashed border-gray-800 bg-black/20 text-center relative overflow-hidden">
             <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
            <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest relative z-10">Proposed Amendments (Drafts)</h3>
            <p className="text-gray-500 font-mono text-sm mb-8 max-w-2xl mx-auto relative z-10">
              Unverified members can view upcoming motions before they reach the active voting floor. Upgrade clearance to cast a signal.
            </p>
            <div className="flex flex-col gap-6 text-left max-w-3xl mx-auto relative z-10">
                {proposedAmendments && proposedAmendments.length > 0 ? (
                    proposedAmendments.map((draft, idx) => (
                        <div key={idx} className="border border-gray-800 bg-black/40 p-6 hover:border-apf-purple transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-gray-400 font-vt323 text-xs uppercase tracking-widest border border-gray-800 px-2 py-1 bg-black">{draft.id}</div>
                                <div className="text-gray-600 font-vt323 text-xs">{new Date(draft.date).toLocaleDateString()}</div>
                            </div>
                            <h4 className="text-white font-bold text-xl mb-2">{draft.title}</h4>
                            <p className="text-gray-400 font-vt323 text-sm mb-4 leading-relaxed">{draft.summary}</p>

                            <div className="flex flex-wrap gap-4 text-xs font-vt323 border-t border-gray-800/50 pt-4 mt-auto">
                                <span className="text-apf-emerald flex items-center gap-1">
                                    <SafeIcon name="CheckCircle" className="h-3 w-3" /> Alignment: {draft.alignment}
                                </span>
                                <span className="text-apf-purpleLight flex items-center gap-1">
                                    <SafeIcon name="User" className="h-3 w-3" /> Sponsor: {draft.sponsor}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="border-l-2 border-gray-600 pl-4 py-2 opacity-50">
                        <div className="text-gray-400 font-vt323 text-xs uppercase mb-1">SYSTEM_NOTICE</div>
                        <div className="text-white font-bold">No active drafts in the queue.</div>
                    </div>
                )}
            </div>
          </div>

          <div className="mt-20 p-8 border border-dashed border-gray-800 text-center">
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
              [ End of Current Legislative Stack ]
            </p>
            <button onClick={() => navigate('/propose')} className="mt-4 text-apf-purple hover:text-white font-mono text-xs uppercase underline underline-offset-4 tracking-widest">
              Propose New Protocol Revision
            </button>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
