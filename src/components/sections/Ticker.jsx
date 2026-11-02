import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
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
  const duplicatedUpdates = [...updates, ...updates, ...updates];

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border-y border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 overflow-hidden py-2 flex items-center">
      <div className="w-full relative flex whitespace-nowrap overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20
          }}
          className="flex gap-8 items-center text-apf-purpleLight font-vt323 text-lg uppercase tracking-wider"
        >
          {duplicatedUpdates.map((text, i) => (
            <div key={i} className="flex items-center gap-4">
              <SafeIcon name="Radio" className="text-apf-purple" />
              <span>{text}</span>
              <span className="text-apf-purple/50">|</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
