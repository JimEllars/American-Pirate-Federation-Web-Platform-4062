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
    status: "Active", consensus: 94, sponsor: "Navigator's Guild", lastRevision: "2024.11.04"
  },
  {
    title: "The Fleet Mutual Aid Pact",
    code: "APF-002",
    summary: "Protocol for resource sharing and legal defense of federation members under state pressure.",
    status: "Active", consensus: 88, sponsor: "Surgeon's Dispensary", lastRevision: "2025.01.12"
  },
  {
    title: "Decentralized Governance Draft",
    code: "APF-003",
    summary: "Proposed framework for liquid democracy voting on federation resource allocation.",
    status: "In Review", consensus: 62, sponsor: "Quartermaster's Provisions", lastRevision: "2025.02.28"
  },
  {
    title: "Intellectual Property Abolition",
    code: "APF-004",
    summary: "The federation's stance on the open-source requirement for all assistive technologies.",
    status: "Active", consensus: 75, sponsor: "Shipwright's Guild", lastRevision: "2024.09.15"
  },
  {
    title: "Corporate Housing Nullification Act",
    code: "APF-005",
    summary: "Legal and logistical frameworks designed to prevent for-profit corporations from purchasing single-family residential properties, protecting housing as a human asset.",
    status: "Active", consensus: 91, sponsor: "Quartermaster's Provisions", lastRevision: "2025.05.10"
  },
  {
    title: "Universal Sustenance Guarantee",
    code: "APF-006",
    summary: "Establishing secure public distribution infrastructure for water and food support, completely insulated from speculative corporate profiteering.",
    status: "Active", consensus: 89, sponsor: "Surgeon's Dispensary", lastRevision: "2025.06.01"
  },
  {
    title: "Green Transit & Energy Transition Accord",
    code: "APF-007",
    summary: "Strategic deployment blueprints for non-fossil fuel transportation networks and localized public energy infrastructure to end corporate resource extraction reliance.",
    status: "Active", consensus: 82, sponsor: "Shipwright's Guild", lastRevision: "2025.08.14"
  },
  {
    title: "The 1950s Tax Restoration Act",
    code: "APF-008",
    summary: "Re-establishing historical high-bracket tax tiers on multi-million dollar asset hoarding to redistribute resources away from institutional corruption.",
    status: "Active", consensus: 95, sponsor: "Navigator's Guild", lastRevision: "2025.10.19"
  },
  {
    title: "The Collective Labor Protection Mandate",
    code: "APF-009",
    summary: "Providing defensive legal assets, cryptographic coordination channels, and direct mutual aid to support union organization and basic worker autonomy across all sectors.",
    status: "Active", consensus: 87, sponsor: "Navigator's Guild", lastRevision: "2025.11.02"
  },
  {
    title: "Open Generations Education Protocol",
    code: "APF-010",
    summary: "A structural complete alternative to cost-prohibitive secondary degrees, deploying free, verified, open-source educational assets globally.",
    status: "Active", consensus: 93, sponsor: "Shipwright's Guild", lastRevision: "2026.01.20"
  },
  {
    title: "The Public Servant Accountability Directive",
    code: "APF-011",
    summary: "Enforcing absolute term limits across all branches of federal and local government to permanently eliminate career-politician corruption corridors.",
    status: "Active", consensus: 96, sponsor: "Navigator's Guild", lastRevision: "2026.03.04"
  },
  {
    title: "Generational Stewardship & Competency Cap",
    code: "APF-012",
    summary: "Amending administrative eligibility criteria to establish an upper age limit for government officials, ensuring active leadership remains synced with the working class.",
    status: "Active", consensus: 79, sponsor: "Navigator's Guild", lastRevision: "2026.03.15"
  },
  {
    title: "Industrial Infrastructure Permitting Sovereignty",
    code: "APF-013",
    summary: "Mandating that high-impact environmental or digital mega-projects, including corporate datacenters, receive direct, localized cryptographic consensus approval prior to asset allocation.",
    status: "Active", consensus: 86, sponsor: "Shipwright's Guild", lastRevision: "2026.04.11"
  },
  {
    title: "Corporate Free Reign Nullification Act",
    code: "APF-014",
    summary: "Aggressive regulatory framework defining corporate market dominance and currency manipulation as systemic corruption, enabling immediate asset reclamation.",
    status: "Active", consensus: 92, sponsor: "Quartermaster's Provisions", lastRevision: "2026.05.01"
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
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-cinzel">
                Policies
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-sans text-lg border-l-2 border-apf-purple pl-6">
              Sovereignty is not given; it is coded. These are the active foundational protocols and civic mandates governing the American Pirate Federation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {POLICIES.map((policy) => (
              <PolicyCard key={policy.code} {...policy} />
            ))}
          </div>


          <div className="mt-16 p-8 bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 text-center relative overflow-hidden">
             <div className="absolute inset-0 scanlines !pointer-events-none opacity-30" />
            <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest relative z-10">Proposed Amendments (Drafts)</h3>
            <p className="text-gray-500 font-sans text-sm mb-8 max-w-2xl mx-auto relative z-10">
              Unverified members can view upcoming motions before they reach the active voting floor. Upgrade clearance to Signal Consensus.
            </p>
            <div className="flex flex-col gap-6 text-left max-w-3xl mx-auto relative z-10">
                {proposedAmendments && proposedAmendments.length > 0 ? (
                    proposedAmendments.map((draft, idx) => (
                        <div key={idx} className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-gray-400 font-vt323 text-xs uppercase tracking-widest border border-gray-800 px-2 py-1 bg-black">{draft.id}</div>
                                <div className="text-gray-600 font-vt323 text-xs">{new Date(draft.date).toLocaleDateString()}</div>
                            </div>
                            <h4 className="text-white font-bold text-xl mb-2 font-cinzel">{draft.title}</h4>
                            <p className="text-gray-400 font-sans text-sm mb-4 leading-relaxed">{draft.summary}</p>

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
            <p className="text-gray-500 font-vt323 text-sm uppercase tracking-widest">
              [ End of Current Legislative Stack ]
            </p>
            <button onClick={() => navigate('/propose')} className="mt-4 text-apf-purple hover:text-white font-vt323 text-xs uppercase underline underline-offset-4 tracking-widest">
              Propose New Protocol Revision
            </button>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
