import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import { DonateWidget } from '../components/donate/DonateWidget';
import SafeIcon from '../common/SafeIcon';

export function Donate() {
  return (
    <Layout>
      <SEO title="Donate | APF Action" description="Fund the American Pirate Federation through APF Action." />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1">
              <PageHeader
                icon="DollarSign"
                kicker="APF Action · 501(c)(4)"
                title="Fund the Fleet"
                lede="Card contributions route through APF Action for political operation and mutual aid. Crypto dues route to the DAO Safe. The two paths never mix."
                className="mb-8"
              />
              <div className="apf-card p-6">
                <h3 className="text-base font-semibold text-white">Where card contributions go</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
                  <li>Lobbying for the Zero-Data Protocol and anti-surveillance legislation</li>
                  <li>Direct mutual aid funding for aligned fleet members</li>
                  <li>Operational overhead for decentralized infrastructure</li>
                </ul>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-surface-900/60 p-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Card · APF Action</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    A 501(c)(4) social welfare organization. Contributions are not
                    tax-deductible. Card details stay on Stripe&apos;s domain.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-surface-900/60 p-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Crypto · DAO Safe</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    Member dues and crypto settle on Arbitrum One. This site can read the
                    Safe&apos;s balance; it cannot move funds.
                  </p>
                </div>
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
