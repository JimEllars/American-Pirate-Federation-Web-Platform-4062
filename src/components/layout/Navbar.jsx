import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { motion } from 'framer-motion';
import { useActiveWallet, useActiveAccount, useConnect, useDisconnect } from 'thirdweb/react';
import { client as thirdwebClient } from '../../lib/web3/client';
import { embeddedWallet } from 'thirdweb/wallets';
import { useAppStore } from '../../store/useAppStore';
import { PassportModal } from '../auth/PassportModal';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const address = useActiveAccount()?.address;
  const wallet = useActiveWallet();
  const connectionStatus = wallet ? "connected" : "disconnected";

  const { connect } = useConnect({ client: thirdwebClient });
  const { disconnect } = useDisconnect();
  // Identity comes from the Passport (the Supabase session and the member row it owns), not
  // from a connected wallet. Audit F38: the badge used to show a guild label derived from
  // `localStorage` as soon as a wallet was connected.
  const {
    passport,
    guildAlignment,
    activeTxQueue,
    clearTxQueue,
    isPassportOpen,
    openPassport,
    closePassport
  } = useAppStore();
  const member = passport.member;

  const handleConnect = async () => {
    try {
      await connect(embeddedWallet());
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { name: 'Intel', path: '/intelligence' },
    { name: 'Transmissions', path: '/podcast' },
    { name: 'Directives', path: '/policies' },
    { name: 'Fleet Muster', path: '/events' },
    { name: 'Armory', path: '/shop' },
    { name: 'Governance', path: '/governance' },
    { name: 'Donate', path: '/donate' }
  ];

  // SOP Playbook D tools. They live behind one control because the desktop bar has a hard
  // one-row budget at 1280 px (see audit F18) — nine top-level links do not fit, and a
  // wrapped row renders the wallet control underneath the 64 px header.
  const toolLinks = [
    { name: 'Balance Calculator', path: '/calculator' },
    { name: 'Treasury Ledger', path: '/ledger' },
    { name: 'Pay Ratio Explorer', path: '/pay-ratio' }
  ];

  // The queue has no processor. `handleProcessTx` used to be an empty function behind a
  // pulsing, hoverable "[ N PENDING TX ]" button, so a member who submitted a draft saw a
  // permanent alert that promised an action nobody could take. Nothing in this build
  // broadcasts a transaction (the write path is the Safe-treasury task, audit F16), so the
  // indicator is now a status readout that says what the queue actually is: local drafts.
  const handlePurgeQueue = () => clearTxQueue();

  const getGuildIcon = () => {
      switch(guildAlignment) {
          case "Shipwright's Guild": return "Terminal";
          case "Surgeon's Dispensary": return "Cross";
          case "Quartermaster's Provisions": return "Package";
          case "Navigator's Guild": return "Compass";
          default: return "Shield";
      }
  };

  const linkClass = (active) =>
    `rounded-lg px-2.5 py-2 text-[13px] font-medium leading-none transition-colors whitespace-nowrap ${
      active ? 'bg-white/[0.06] text-white' : 'text-ink-muted hover:bg-white/[0.04] hover:text-white'
    }`;

  return (
    <>
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl">
      <div className="apf-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="American Pirate Federation home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-apf-purple/15 ring-1 ring-inset ring-apf-purple/30 transition-colors group-hover:bg-apf-purple/25">
              <SafeIcon name="Anchor" className="h-5 w-5 text-apf-purpleLight" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-semibold tracking-tight text-white">
                <span className="hidden 2xl:inline">American Pirate Federation</span>
                <span className="2xl:hidden">APF</span>
              </span>
              <span className="mt-1 font-terminal text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                PirateUSA.org
              </span>
            </span>
          </Link>

          <div className="hidden xl:block">
            <div className="flex items-center justify-end gap-1">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className={linkClass(location.pathname === link.path)}>
                  {link.name}
                </Link>
              ))}

              <details className="relative">
                <summary
                  className={`${linkClass(toolLinks.some((tool) => tool.path === location.pathname))} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}
                >
                  Tools
                  <SafeIcon name="ChevronDown" className="h-3.5 w-3.5 opacity-60" />
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-white/10 bg-surface-800 p-1.5 shadow-lift">
                  {toolLinks.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                      className={`block rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                        location.pathname === tool.path
                          ? 'bg-apf-purple/15 text-white'
                          : 'text-ink-muted hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </details>

              {member ? (
                  <div className="ml-1 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-2.5 pr-3" title={`Filed on the muster roll · ${member.role}`}>
                      <SafeIcon name={getGuildIcon()} className="h-3.5 w-3.5 text-apf-purpleLight" />
                      <div className="flex flex-col leading-none">
                          <span className="text-[9px] uppercase tracking-[0.14em] text-ink-dim">{guildAlignment}</span>
                          <span className="mt-1 max-w-[100px] truncate text-[11px] font-medium text-emerald-300">
                              {member.alias}
                          </span>
                      </div>
                  </div>
              ) : (
                  <a href="/#join" className="ml-1 inline-flex min-h-[36px] items-center rounded-lg bg-apf-purple px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#A21CE8]">
                    Join the Fleet
                  </a>
              )}

              {/* Law 4: the Pirate Passport is the primary identity path (Email OTP),
                  with wallet connection remaining entirely optional. */}
              <button
                onClick={openPassport}
                className="ml-1 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 text-[13px] font-medium text-ink transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <SafeIcon name="Key" className="h-3.5 w-3.5 text-apf-purpleLight" /> Passport
              </button>

              {activeTxQueue?.length > 0 && (
                <div className="ml-1 flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-2.5 py-1.5"
                    title="Drafts saved in this browser. No transaction has been broadcast."
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-medium text-amber-300">
                      {activeTxQueue.length} local draft{activeTxQueue.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <button onClick={handlePurgeQueue} className="rounded-md px-1.5 py-1 text-[11px] text-ink-dim transition-colors hover:bg-red-500/10 hover:text-red-400" title="Discard local drafts">
                    Clear
                  </button>
                </div>
              )}

              {(connectionStatus === "connecting" || connectionStatus === "unknown") ? (
                <button
                  disabled
                  className="ml-1 inline-flex min-h-[36px] cursor-not-allowed items-center rounded-lg border border-white/10 px-3 text-[12px] text-ink-dim"
                >
                  Connecting wallet…
                </button>
              ) : !address ? (
                <button
                  onClick={handleConnect}
                  className="ml-1 inline-flex min-h-[36px] items-center rounded-lg border border-white/[0.12] px-3 text-[13px] font-medium text-ink-muted transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={() => disconnect(wallet)}
                  className="ml-1 inline-flex min-h-[36px] items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-3 transition-colors hover:border-emerald-400/40"
                  title="Disconnect wallet"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px] text-emerald-300">
                    {`${address?.substring(0, 4)}…${address?.substring(address?.length - 4)}`}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 xl:hidden">
              {activeTxQueue?.length > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-2 py-1.5"
                  title={`${activeTxQueue.length} draft(s) saved in this browser. Nothing has been broadcast.`}
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-medium text-amber-300">
                    {activeTxQueue.length} draft{activeTxQueue.length === 1 ? '' : 's'}
                  </span>
                </span>
              )}
              {address && (
                <span
                  className="flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-2 py-1.5"
                  title={`${address?.substring(0, 4)}…${address?.substring(address?.length - 4)}`}
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span className="truncate font-mono text-[11px] text-emerald-300">
                    {`${address?.substring(0, 4)}…${address?.substring(address?.length - 4)}`}
                  </span>
                </span>
              )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-white"
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
            >
              <SafeIcon name={isOpen ? "X" : "Menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/[0.06] bg-surface-950 xl:hidden"
        >
          <div className="apf-container space-y-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                  location.pathname === link.path
                    ? 'bg-white/[0.06] text-white'
                    : 'text-ink-muted hover:bg-white/[0.04] hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-2 border-t border-white/[0.06] pt-3">
              <span className="apf-kicker block px-3 pb-1 text-ink-dim">Tools</span>
              {toolLinks.map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  {tool.name}
                </Link>
              ))}
            </div>

            <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
              {member ? (
                  <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <SafeIcon name={getGuildIcon()} className="h-4 w-4 text-apf-purpleLight" />
                      <div className="flex min-w-0 flex-col leading-none">
                          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-dim">{guildAlignment}</span>
                          <span className="mt-1 truncate text-sm font-medium text-emerald-300">{member.alias}</span>
                      </div>
                  </div>
              ) : (
                  <a href="/#join" onClick={() => setIsOpen(false)} className="apf-btn apf-btn-primary w-full">
                    Join the Fleet
                  </a>
              )}

              <button
                onClick={() => { openPassport(); setIsOpen(false); }}
                className="apf-btn apf-btn-ghost w-full"
              >
                <SafeIcon name="Key" className="h-4 w-4 text-apf-purpleLight" /> Pirate Passport
              </button>

              {(connectionStatus === "connecting" || connectionStatus === "unknown") ? (
                <button disabled className="apf-btn w-full cursor-not-allowed border border-white/10 text-ink-dim">
                  Connecting wallet…
                </button>
              ) : !address ? (
                <button
                  onClick={() => { handleConnect(); setIsOpen(false); }}
                  className="apf-btn apf-btn-ghost w-full"
                >
                  Connect wallet
                </button>
              ) : (
                <button
                  onClick={() => { disconnect(wallet); setIsOpen(false); }}
                  className="apf-btn w-full border border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Disconnect {`${address?.substring(0, 4)}…${address?.substring(address?.length - 4)}`}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
    <PassportModal isOpen={isPassportOpen} onClose={closePassport} />
    </>
  );
}
