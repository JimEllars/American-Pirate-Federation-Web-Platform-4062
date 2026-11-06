import React, { useState, useEffect } from 'react';
import { ContributeButton } from '../web3/ContributeButton';
import SafeIcon from '../../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../../hooks/usePirateIntel';
import { useAXiMHydration } from '../../hooks/useAXiMHydration';
import { useAppStore } from '../../store/useAppStore';
import DOMPurify from 'isomorphic-dompurify';
import { useAPFContract } from '../../hooks/useAPFContract';

const GUILDS = [
  {
    id: 'surgeons',
    name: "Surgeon's Dispensary",
    icon: "Activity",
    content: "The heart of mutual aid. We develop open-source medical protocols, coordinate decentralized care networks, and ensure Article III is upheld.",
    meta: "SEC_MED_01"
  },
  {
    id: 'shipwrights',
    name: "Shipwright's Guild",
    icon: "Tool",
    content: "Architects of the new digital seas. We build the physical and software infrastructure required for federation sovereignty.",
    meta: "SEC_ENG_02"
  },
  {
    id: 'quartermasters',
    name: "Quartermaster's Provisions",
    icon: "Package",
    content: "Logistics and resource distribution. From community gardens to local mesh networks, we ensure fair plunder for all.",
    meta: "SEC_LOG_03"
  },
  {
    id: 'navigators',
    name: "Navigator's Observatory",
    icon: "Compass",
    content: "Intelligence and legal defense. We map the ever-changing regulatory landscape and chart safe courses for the fleet.",
    meta: "SEC_INT_04"
  }
];

export function TheTreasury() {
  const { treasuryBalance, treasurySymbol, isLoadingBalance, isConfigured } = useAPFContract();
  const { addToast, isCoreSynced, setIsCoreSynced } = useAppStore();
  const [activeTab, setActiveTab] = useState('guilds'); // 'guilds' or 'ledger'

  const [activeGuild, setActiveGuild] = useState(GUILDS[0]);
  const { data: guides, loading, error } = usePirateIntel('posts?categories=3');

  // Ledger state starts empty by design. Rows appear only when Supabase returns them
  // (Architectural Law 1: Anti-Theater & Ground Truth). No seeded fixtures.
  const { fetchLiveLedger, loading: ledgerLoading } = useAXiMHydration();
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadLedger = async () => {
      try {
        const data = await fetchLiveLedger();
        setIsCoreSynced(true);
        if (isMounted) {
          setLedger(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setIsCoreSynced(true);
          setLedger([]);
          addToast('[ TELEMETRY INGRESS FAILED - LEDGER UNAVAILABLE ]', 'warning');
        }
      }
    };

    loadLedger();

    return () => {
      isMounted = false;
    };
  }, [fetchLiveLedger, addToast, setIsCoreSynced]);

  const treasuryAddress = import.meta.env.VITE_APF_TREASURY_ADDRESS;
  const hasTreasuryAddress =
    Boolean(treasuryAddress) &&
    treasuryAddress !== '0x0000000000000000000000000000000000000000';
  const explorerUrl = hasTreasuryAddress ? `https://arbiscan.io/address/${treasuryAddress}` : null;

  return (
    <>
    <section className="relative border-b border-white/[0.06] py-20 sm:py-24">
      <div className="apf-container">
        <div className="flex flex-col gap-8 border-b border-white/[0.07] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="apf-kicker">Federation assets</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Where the money goes
            </h2>
            <p className="apf-lede mt-4">
              Guild programmes and settled allocations, published as they happen. The
              treasury is read-only from this site — no page here can move a dollar.
            </p>
          </div>

          <div className="apf-card px-6 py-5">
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">Vault balance</span>
            {/* Audit F43: this used to print "0.00 ETH" whenever the read failed, which
                for a Safe address was always — the panel called a getBalance() view the
                Safe does not implement. The reading is now the address's real native
                balance, and an absent reading says so. */}
            <div className="mt-2 font-mono text-2xl font-semibold text-emerald-300">
              {(() => {
                if (!isConfigured) return 'Not published';
                if (isLoadingBalance) return 'Reading chain…';
                if (treasuryBalance === null || treasuryBalance === undefined) return 'Unavailable';
                return `${treasuryBalance} ${treasurySymbol || ''}`.trim();
              })()}
            </div>
            <div className="mt-1 font-terminal text-[10px] uppercase tracking-[0.16em] text-ink-dim">
              Arbitrum One · read-only
            </div>
          </div>
        </div>

        <div className="mt-8 inline-flex rounded-xl border border-white/[0.08] bg-surface-900/70 p-1">
          <button
            onClick={() => setActiveTab('guilds')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'guilds' ? 'bg-white/[0.08] text-white' : 'text-ink-muted hover:text-white'}`}
          >
            Guilds &amp; blueprints
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ledger' ? 'bg-white/[0.08] text-white' : 'text-ink-muted hover:text-white'}`}
          >
            Treasury ledger
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'guilds' ? (
            <motion.div
              key="guilds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 grid gap-8 lg:grid-cols-12"
            >
              <div className="lg:col-span-4">
                <div className="space-y-2">
                  {GUILDS.map((guild) => (
                    <button
                      key={guild.id}
                      onClick={() => setActiveGuild(guild)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                        activeGuild.id === guild.id
                        ? 'border-apf-purple/40 bg-apf-purple/[0.08] text-white'
                        : 'border-white/[0.07] bg-surface-900/60 text-ink-muted hover:border-white/15 hover:text-white'
                      }`}
                    >
                      <SafeIcon name={guild.icon} className={activeGuild.id === guild.id ? 'h-5 w-5 text-apf-purpleLight' : 'h-5 w-5'} />
                      <span className="text-sm font-medium">{guild.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="apf-card relative overflow-hidden p-6 sm:p-8 lg:col-span-8">
                <div className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                  {activeGuild.meta}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeGuild.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-apf-purple/15 ring-1 ring-inset ring-apf-purple/30">
                        <SafeIcon name={activeGuild.icon} className="h-5 w-5 text-apf-purpleLight" />
                      </div>
                      <h3 className="text-xl font-semibold text-white sm:text-2xl">{activeGuild.name}</h3>
                    </div>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
                      {activeGuild.content}
                    </p>

                    <div className="mt-8 border-t border-white/[0.06] pt-6">
                      <h4 className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">Guild blueprints · public record</h4>
                      {loading && <p className="mt-4 text-sm text-ink-dim">Loading blueprints…</p>}
                      {error && <p className="mt-4 text-sm text-red-400">Blueprints unavailable: {error}</p>}
                      {!loading && !error && guides && guides.length > 0 && (
                        <ul className="mt-3 divide-y divide-white/[0.06]">
                          {guides.map((guide) => (
                            <li key={guide.id}>
                               <a
                                 href={guide.link}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="flex items-center justify-between gap-4 py-3 text-sm text-ink transition-colors hover:text-apf-purpleLight"
                               >
                                  <span>{DOMPurify.sanitize(guide.title?.rendered || 'Untitled document')}</span>
                                  <SafeIcon name="ArrowUpRight" className="h-4 w-4 text-ink-dim" />
                               </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!loading && !error && (!guides || guides.length === 0) && (
                         <p className="mt-4 text-sm text-ink-dim">No blueprints published for this guild yet.</p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : !isCoreSynced ? (

            <motion.div
              key="ledger-skeleton"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8"
            >
              <div className="apf-card h-[480px] animate-pulse p-8">
                 <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                   <div>
                     <div className="mb-2 h-8 w-64 rounded bg-white/[0.06]"></div>
                     <div className="h-4 w-96 rounded bg-white/[0.04]"></div>
                   </div>
                   <div className="h-10 w-48 rounded bg-white/[0.04]"></div>
                 </div>
                 <div className="mt-8 h-64 rounded-xl bg-white/[0.03]"></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8"
            >
              <div className="apf-card p-6 sm:p-8">
                 <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                   <div>
                     <h3 className="text-xl font-semibold text-white sm:text-2xl">Treasury transparency</h3>
                     <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                       Ledger entries below are read directly from the Federation&rsquo;s Supabase ledger table. Nothing here is simulated.
                       {ledger.length === 0 && ' No on-chain settlements have been recorded yet.'}
                     </p>
                   </div>
                   {explorerUrl ? (
                     <a
                       href={explorerUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="apf-btn apf-btn-ghost shrink-0"
                       aria-label="Verify the APF Safe multisig on Arbiscan"
                     >
                       <SafeIcon name="ExternalLink" className="h-4 w-4" /> Verify on Arbiscan
                     </a>
                   ) : (
                     <span
                       className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm text-ink-dim"
                       title="No treasury address is configured, so there is nothing to verify on-chain yet."
                     >
                       <SafeIcon name="Lock" className="h-4 w-4" /> No Safe deployed
                     </span>
                   )}
                 </div>

                 {/* Honest audit state. There is no published IPFS audit yet, so we say so
                     rather than rendering a hash and a "verification: SUCCESS" banner. */}
                 <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/30 p-5">
                   <div className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">Audit status</div>
                   <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                     {explorerUrl
                       ? 'Treasury balances and transfers are verifiable directly against the Arbiscan explorer link above. A signed, IPFS-pinned allocation report has not been published yet; when it is, its CID and Merkle root will be listed here.'
                       : 'The APF Arbitrum Safe multisig is not deployed yet, so there is no audit to publish. This panel will populate with a signed report CID once the Treasury is live.'}
                   </p>
                 </div>

                 <div className="mt-6 flex flex-col justify-between gap-4 rounded-xl border border-apf-purple/20 bg-apf-purple/[0.05] p-5 md:flex-row md:items-center">
                    <div>
                      <h4 className="text-base font-semibold text-white">Federation funding</h4>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        Card contributions route to APF Action (501(c)(4)) and are not tax-deductible. Crypto contributions settle on Arbitrum One.
                      </p>
                    </div>
                    <div className="w-full md:w-auto">
                       <ContributeButton showLabel className="w-full md:w-48" />
                    </div>
                 </div>

                 <div className="mt-8 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                          <th className="px-3 py-3 font-medium">Tx hash</th>
                          <th className="px-3 py-3 font-medium">Date</th>
                          <th className="px-3 py-3 font-medium">Allocation</th>
                          <th className="px-3 py-3 font-medium">Target</th>
                          <th className="px-3 py-3 font-medium">Directive</th>
                          <th className="px-3 py-3 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {ledgerLoading ? (
                           <tr>
                             <td colSpan="6" className="py-12 text-center text-ink-dim">
                               Loading ledger…
                             </td>
                           </tr>
                        ) : ledger.length === 0 ? (
                           <tr>
                             <td colSpan="6" className="px-4 py-16 text-center">
                               <div className="text-base font-medium text-white">No entries yet</div>
                               <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                                 The Federation has not recorded any settled treasury allocations. Rows appear only when a settled transaction is published to its ledger.
                               </p>
                             </td>
                           </tr>
                        ) : (
                          ledger.map((tx, idx) => (
                            <tr key={idx} className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]">
                              <td className="max-w-[140px] truncate px-3 py-3.5 font-mono text-xs text-apf-purpleLight">{DOMPurify.sanitize(tx.txId)}</td>
                              <td className="px-3 py-3.5 text-ink-muted">{DOMPurify.sanitize(tx.date)}</td>
                              <td className="px-3 py-3.5 font-medium text-white">{DOMPurify.sanitize(tx.amount)}</td>
                              <td className="px-3 py-3.5 text-ink-muted">{DOMPurify.sanitize(tx.target)}</td>
                              <td className="px-3 py-3.5 text-emerald-300">{DOMPurify.sanitize(tx.alignment)}</td>
                              <td className="px-3 py-3.5 text-right">
                                 <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${
                                   tx.status === 'Settled' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'
                                 }`}>
                                   {DOMPurify.sanitize(tx.status)}
                                 </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                 </div>

                {!hasTreasuryAddress ? (
                  <div className="mt-8 rounded-xl border border-white/[0.07] bg-black/30 p-6 text-center">
                    <span className="text-sm font-medium text-white">Safe ratification pending</span>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                      The APF Arbitrum Safe multisig is not deployed yet. Treasury rows will appear here once the Safe is live and a settled transaction is published.
                    </p>
                  </div>
                ) : null}

                 <p className="mt-6 text-center font-terminal text-[10px] uppercase tracking-[0.18em] text-ink-dim">
                   Article II · radical transparency
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
    </>
  );
}
