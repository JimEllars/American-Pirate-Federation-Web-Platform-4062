import React from 'react';
import { motion } from 'framer-motion';
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
    <section className="border-b border-white/[0.06] py-20 sm:py-24">
      <div className="apf-container">
        <div className="max-w-2xl">
          <p className="apf-kicker">The Pirate Code</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Twenty articles. One direction.
          </h2>
          <p className="apf-lede mt-4">
            The Federation&apos;s governing principles, each anchored to the constitutional
            provision it defends. This is the doctrine of record — not a campaign promise.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: (index % 3) * 0.04, ease: 'easeOut' }}
              className="apf-card flex flex-col p-6"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-apf-purpleLight">
                  Article {article.id}
                </span>
                <span className="text-right text-[10px] uppercase tracking-[0.12em] text-ink-dim">
                  {article.theme}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug text-white">
                {article.title}
              </h3>
              <p className="mb-4 mt-2.5 text-sm leading-relaxed text-ink-muted">
                {article.content}
              </p>
              {article.reference && (
                <p className="mt-auto border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-ink-dim">
                  <span className="text-ink-muted">Anchored:</span> {article.reference}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
