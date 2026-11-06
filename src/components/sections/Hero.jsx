import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

const FACTS = [
  ['20', 'Articles of the Code'],
  ['14', 'Protocols of record'],
  ['AGPL-3.0', 'Open source'],
  ['Arbitrum One', 'Treasury network']
];

const STATUS_LINES = [
  ['identity', 'Passport · email OTP'],
  ['treasury', 'Read-only · Safe multisig'],
  ['analytics', 'First-party only'],
  ['source', 'AGPL-3.0 · public'],
  ['network', 'Arbitrum One']
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="apf-container pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <p className="apf-kicker">American Pirate Federation</p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.25rem]">
              A federation built for{' '}
              <span className="text-apf-purpleLight">people</span>,
              <br className="hidden sm:block" /> not platforms.
            </h1>

            <p className="apf-lede mt-6 max-w-xl">
              Sovereign data. Shared resources. A government that answers to its members.
              We publish the code, the ledger and the rules — and we leave the door open.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#join" className="apf-btn apf-btn-primary">
                Join the fleet
                <SafeIcon name="ArrowRight" className="h-4 w-4" />
              </a>
              <Link to="/policies" className="apf-btn apf-btn-ghost">
                Read the Code
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/[0.07] pt-8 sm:grid-cols-4">
              {FACTS.map(([value, label]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">{label}</dt>
                  <dd className="mt-1.5 font-display text-xl font-semibold tracking-tight text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-5"
          >
            <div className="apf-terminal-panel scanlines relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-apf-emerald/70" />
                </div>
                <span className="font-terminal text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                  federation status
                </span>
              </div>

              <div className="relative z-10 space-y-3 px-5 py-5 font-mono text-[12px] leading-relaxed">
                {STATUS_LINES.map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-6">
                    <span className="text-ink-dim">{key}</span>
                    <span className="text-right text-ink">{value}</span>
                  </div>
                ))}
                <div className="border-t border-white/[0.07] pt-3 font-terminal text-[11px] uppercase tracking-[0.16em] text-apf-emerald">
                  [ NO THIRD-PARTY PIXELS ]
                </div>
              </div>
            </div>

            <p className="mt-3 text-center font-terminal text-[10px] uppercase tracking-[0.2em] text-ink-dim">
              Read-only by design · no custody
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
