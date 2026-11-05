import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAXiMHydration } from '../../hooks/useAXiMHydration';

/**
 * Status strip on the home page.
 *
 * Law 1 (Anti-Theater & Ground Truth): this strip used to announce invented metrics —
 * "$12,450 ALLOCATED TO GUILD 4", "+42 RECRUITS", "Q3 FILED PUBLICLY", "SIGNAL STRENGTH:
 * OPTIMAL" — while the treasury ledger, muster roll and events tables were all empty. It
 * was the first band a visitor read, and every figure in it was fiction.
 *
 * Every line below is now either a verifiable fact about the deployment or a count read
 * from Supabase. When the database is empty the counts say so in words instead of
 * rendering a confident zero.
 */

const DEPLOYMENT_FACTS = [
  'NETWORK: ARBITRUM ONE',
  'TREASURY GLASS: READ-ONLY VIEW OF THE SAFE',
  'POLICY STACK: 14 PROTOCOLS OF RECORD',
  'IDENTITY: PIRATE PASSPORT · EMAIL OTP',
  'LICENSE: AGPL-3.0 · SOURCE OPEN',
  'ANALYTICS: NO THIRD-PARTY PIXELS'
];

export function Ticker() {
  const { fetchLiveLedger, fetchActiveEvents, fetchActiveProposals } = useAXiMHydration();
  const [liveUpdates, setLiveUpdates] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadCounts = async () => {
      try {
        const [ledger, events, proposals] = await Promise.all([
          fetchLiveLedger(),
          fetchActiveEvents(),
          fetchActiveProposals()
        ]);
        if (!isMounted) return;

        const settlements = Array.isArray(ledger) ? ledger.length : 0;
        const dispatches = Array.isArray(events) ? events.length : 0;
        const motions = Array.isArray(proposals) ? proposals.length : 0;

        setLiveUpdates([
          settlements === 0
            ? 'LEDGER: NO ON-CHAIN SETTLEMENTS RECORDED'
            : `LEDGER: ${settlements} SETTLEMENT${settlements === 1 ? '' : 'S'} ON RECORD`,
          dispatches === 0
            ? 'FLEET MUSTER: NO ACTIVE DISPATCHES'
            : `FLEET MUSTER: ${dispatches} ACTIVE DISPATCH${dispatches === 1 ? '' : 'ES'}`,
          motions === 0
            ? 'GOVERNANCE FLOOR: NO MOTIONS FILED'
            : `GOVERNANCE FLOOR: ${motions} MOTION${motions === 1 ? '' : 'S'} FILED`
        ]);
      } catch (err) {
        // Hydration already reports its own failures; the strip simply stays factual.
      }
    };

    loadCounts();
    return () => { isMounted = false; };
  }, [fetchLiveLedger, fetchActiveEvents, fetchActiveProposals]);

  const updates = [...liveUpdates, ...DEPLOYMENT_FACTS];
  const loop = [...updates, ...updates];

  return (
    <div className="border-y border-white/[0.06] bg-surface-900/50">
      <div className="apf-container flex items-center gap-4 py-2.5">
        <span className="hidden shrink-0 items-center gap-2 font-terminal text-[10px] uppercase tracking-[0.2em] text-ink-dim sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-apf-emerald" />
          status
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 60 }}
            className="flex w-max items-center whitespace-nowrap font-terminal text-[11px] uppercase tracking-[0.14em] text-ink-muted"
          >
            {loop.map((text, i) => (
              <span key={i} className="flex items-center gap-3 pr-10">
                <span className="text-apf-purple/70" aria-hidden="true">/</span>
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
