import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const ARTICLES = [
  { id: 'I', title: "Every Pirate Matters", theme: "Unity & Equity", content: "Reject old-world hierarchies; unite as a single crew.", reference: "14th Amendment, Equal Protection Clause." },
  { id: 'II', title: "No Quarter for Corruption", theme: "Anti-Corruption", content: "Radical transparency; target Citizens United.", reference: "Article I, Section 9 (Emoluments Clause) & Target Citizens United." },
  { id: 'III', title: "Health of the Crew", theme: "Mutual Aid Healthcare", content: "Healthcare as a fundamental right; mutual aid networks.", reference: "Preamble (\"promote the general Welfare\")." },
  { id: 'IV', title: "A Fair Share of the Plunder", theme: "Economic Equity", content: "Fair wages; challenge crony capitalism.", reference: "16th Amendment / Progressive Reform." },
  { id: 'V', title: "Hoist the Sails for Knowledge", theme: "Open Source Infrastructure", content: "Open-source tech; anti-censorship; public information access.", reference: "1st Amendment / Freedom of Press." },
  { id: 'VI', title: "No Pirate Left Behind", theme: "Social Safety Nets", content: "Collective responsibility; strong social safety nets.", reference: "Preamble (\"promote the general Welfare\")." },
  { id: 'VII', title: "A Pirate’s Right to Privacy", theme: "Data Sovereignty", content: "Data as private property; end data-plunder.", reference: "4th Amendment." },
  { id: 'VIII', title: "No Taxation Without Representation", theme: "Economic Autonomy", content: "Ensure fair governance over community funds.", reference: "Article I, Section 8." },
  { id: 'IX', title: "Free Speech & Open Frequencies", theme: "Freedom of Expression", content: "Unfettered communication; protect whisteblowers.", reference: "1st Amendment / Whistleblower Protection." },
  { id: 'X', title: "Freedom of Religion", theme: "Liberty of Belief", content: "Protect all faiths and non-faiths alike from state coercion.", reference: "1st Amendment." },
  { id: 'XI', title: "The Right to Shelter", theme: "Housing Sovereignty", content: "Housing is for citizens, protected from corporate extraction.", reference: "9th Amendment." },
  { id: 'XII', title: "Sovereign Sustenance", theme: "Resource Security", content: "Guaranteed public baseline access to water and food.", reference: "Preamble." },
  { id: 'XIII', title: "Innovation Beyond Extraction", theme: "Energy Autonomy", content: "Committing infrastructure to renewable independence, moving completely away from oil reliance.", reference: "Article I, Section 8." },
  { id: 'XIV', title: "Equitable Contribution", theme: "Taxation of Excess", content: "Restoring brackets to 1950s levels to counter wealth hoarding.", reference: "16th Amendment." },
  { id: 'XV', title: "The Strength of the Union", theme: "Labor Assembly", content: "Complete support for worker assembly and collective bargaining rights.", reference: "1st Amendment." },
  { id: 'XVI', title: "Liberation Through Learning", theme: "Generational Investment", content: "Free or fully affordable education tiers to dismantle corporate degree profiteering.", reference: "1st Amendment." },
  { id: 'XVII', title: "Temporal Limits of Authority", theme: "Term Limits", content: "Strict limits on all political offices to stop systemic entrenchment.", reference: "22nd Amendment (Expanded)." },
  { id: 'XVIII', title: "Generational Stewardship", theme: "Age Caps", content: "Establishing upper age boundaries for public officials to sync leadership to the active workforce.", reference: "Systemic Reform Directive." },
  { id: 'XIX', title: "Local Infrastructure Consent", theme: "Civic Permitting", content: "Mega-scale private developments (e.g., Datacenters) require community consensus before seizing local energy/water resources.", reference: "Article I, Section 8 (General Welfare context)." },
  { id: 'XX', title: "Subversion of Corporate Dominance", theme: "Resource Protection", content: "Terminating corporate free reign over public capital; zero tolerance for corrupt business practice.", reference: "Article I, Section 8 (Commerce Clause context)." }
];

export function ThePirateCode() {
  return (
    <section className="py-24 bg-apf-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4 tracking-tighter">
            The Pirate Code
          </h2>
          <p className="font-vt323 text-apf-purple text-xl tracking-[0.2em]">
            [ PROTOCOL: THE TWENTY ARTICLES ]
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {ARTICLES.map((article, index) => (
            <motion.div
              key={article.id}
              whileHover={{ scale: 1.02 }}
              className="group relative bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8 border-l-4 border-l-apf-purple cursor-crosshair"
            >
              <div className="absolute inset-0 bg-apf-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="font-vt323 text-apf-purple text-2xl mb-2 block">ARTICLE {article.id}</span>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:glitch-hover transition-all duration-500">
                {article.title}
              </h3>
              <p className="font-vt323 text-gray-500 uppercase text-xs tracking-widest mb-4">
                {article.theme}
              </p>
              <div className="prose prose-invert prose-sm opacity-0 group-hover:opacity-100 transition-all duration-500">
                {article.reference ? (
                  <p className="font-vt323 text-gray-300 text-lg">
                    {article.content}{' '}
                    <span
                      className="text-apf-purple underline decoration-dotted cursor-help"
                      title={`Reference: ${article.reference}`}
                    >
                      [Citation]
                    </span>
                  </p>
                ) : (
                  <p className="font-vt323 text-gray-300 text-lg">{article.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}