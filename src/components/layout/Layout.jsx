import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './Navbar';
import { NetworkSwitchModal } from '../web3/NetworkSwitchModal';
import { useAppStore } from '../../store/useAppStore';
import { logCommLinkSubscription, isTelemetryConfigured } from '../../lib/api/telemetry';
import { Link, useLocation } from 'react-router-dom';
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import SafeIcon from '../../common/SafeIcon';
import { arbitrum } from 'thirdweb/chains';

export function Layout({ children }) {
  const { isCorrectNetwork, setIsCorrectNetwork, addToast, telemetryLogs, setIsSigning, ingressStatus } = useAppStore();
  const location = useLocation();
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const isMismatched = account && chain && chain.id !== 42161 && chain.id !== 421614;

  useEffect(() => {
    setIsSigning(false);
  }, [location.pathname, setIsSigning]);
  const [queueDepth, setQueueDepth] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);


  useEffect(() => {
    const QUEUE_KEY = 'apf_telemetry_queue';
    const updateQueueDepth = () => {
      try {
        const queueStr = localStorage.getItem(QUEUE_KEY);
        if (queueStr) {
          const queue = JSON.parse(queueStr);
          setQueueDepth(queue.length);
        } else {
          setQueueDepth(0);
        }
      } catch (e) {
        setQueueDepth(0);
      }
    };

    updateQueueDepth();
    const intervalId = setInterval(updateQueueDepth, 2000); // Check every 2 seconds

    return () => {
        clearInterval(intervalId);
    };
  }, []);



  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email ? e.target.email.value : e.target.value;
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      useAppStore.getState().addToast("[ INTELLIGENCE FEED: INVALID EMAIL FORMAT ]", "error");
      return;
    }

    const now = Date.now();
    const lastSub = parseInt(localStorage.getItem('apf_last_sub') || '0', 10);
    if (now - lastSub < 5000) {
      useAppStore.getState().addToast("[ INTELLIGENCE FEED: SUBSCRIPTION LOCKOUT ACTIVE ]", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      if (isMounted.current) {
        if (res.ok) {
          localStorage.setItem('apf_last_sub', now.toString());
          logCommLinkSubscription();
          useAppStore.getState().addToast("[ INTELLIGENCE FEED: SUBSCRIPTION CONFIRMED ]", "success");
          if (e.target.reset) {
            e.target.reset();
          } else if (e.target.form) {
            e.target.form.reset();
          }
        } else {
          throw new Error("Subscription failed");
        }
      }
    } catch (error) {
      if (isMounted.current) {
        useAppStore.getState().addToast("[ INTELLIGENCE FEED: SUBSCRIPTION REJECTED ]", "error");
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  /*
   * Both lines below used to be constants.
   *
   * "[ INGRESS: CLOUDFLARE_EDGE_ACTIVE ]" was printed on every page whether or not the
   * client had ever sent anything, and "SECURE NODE ESTABLISHED." asserted a security
   * state nothing had checked. `functions/api/telemetry.js` has no durable sink, so even
   * a 200 means "validated and edge-logged", never "stored" — the copy says that now.
   */
  const ingressLine = (() => {
    if (!isTelemetryConfigured) return '[ INGRESS: DISABLED — NO PROJECT CONFIGURED ]';
    switch (ingressStatus?.state) {
      case 'accepted':
        return `[ INGRESS: EDGE ACCEPTED ${ingressStatus.count} EVENT(S) // NO SINK ]`;
      case 'rejected':
        return `[ INGRESS: EDGE REJECTED HTTP ${ingressStatus.http} ]`;
      case 'unreachable':
        return `[ INGRESS: EDGE UNREACHABLE // ${queueDepth} QUEUED ]`;
      default:
        return '[ INGRESS: NO TRANSMISSION THIS SESSION ]';
    }
  })();

  // `isSecureContext` is a browser-provided fact, not a claim we are making up.
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

  return (
    <div className="apf-root-container relative flex min-h-screen flex-col bg-surface-950">
      <NetworkSwitchModal
        isWrongNetwork={Boolean(isMismatched && !isCorrectNetwork)}
        onSwitchNetwork={async () => {
          // Actually ask the wallet to switch, rather than flipping a local flag and
          // reporting success while the wallet stays on a different chain.
          try {
            await switchChain(arbitrum);
            setIsCorrectNetwork(true);
          } catch (e) {
            addToast('[ NET_OPS: CHAIN SWITCH REJECTED - STAYING ON CURRENT NETWORK ]', 'error');
          }
        }}
        onDismiss={() => setIsCorrectNetwork(true)}
      />

      {/* One quiet atmosphere layer instead of three parallax grids and a fixed scanline
          overlay. The CRT texture now belongs to the terminal panel only. */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-hero-glow opacity-70" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-faint opacity-[0.35] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" aria-hidden="true" />

      <Navbar />

      <main className="relative z-10 flex-grow pt-16">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] bg-surface-950">
        <div className="apf-container py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
            <div className="md:col-span-2 lg:col-span-5">
              <Link to="/" className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-apf-purple/15 ring-1 ring-inset ring-apf-purple/30">
                  <SafeIcon name="Anchor" className="h-5 w-5 text-apf-purpleLight" />
                </span>
                <span className="font-display text-[15px] font-semibold tracking-tight text-white">
                  American Pirate Federation
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                A member-owned civic organization. Open source, read-only treasury, and no
                third-party tracking.
              </p>
              <p className="mt-4 font-terminal text-[11px] uppercase tracking-[0.18em] text-ink-dim">
                {isSecureContext ? '[ CONTEXT: SECURE ]' : '[ CONTEXT: NOT SECURE ]'} · AGPL-3.0
              </p>
            </div>

            <div className="min-w-0 lg:col-span-2">
              <h3 className="font-terminal text-[11px] uppercase tracking-[0.18em] text-ink-dim">Explore</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ['Intelligence', '/intelligence'],
                  ['Directives', '/policies'],
                  ['Fleet Muster', '/events'],
                  ['The Signal', '/podcast'],
                  ['Armory', '/shop']
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link to={href} className="text-ink-muted transition-colors hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 lg:col-span-2">
              <h3 className="font-terminal text-[11px] uppercase tracking-[0.18em] text-ink-dim">Instruments</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ['Balance Calculator', '/calculator'],
                  ['Treasury Ledger', '/ledger'],
                  ['Pay Ratio Explorer', '/pay-ratio'],
                  ['Governance', '/governance']
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link to={href} className="text-ink-muted transition-colors hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 md:col-span-2 lg:col-span-3">
              <h3 className="font-terminal text-[11px] uppercase tracking-[0.18em] text-ink-dim">Intelligence feed</h3>
              <p className="mt-3 text-sm text-ink-muted">Occasional dispatches. No tracking, no resale.</p>
              <form onSubmit={handleSubscribeSubmit} className="mt-3 flex gap-2">
                <input
                  type="email"
                  name="email"
                  aria-label="Email address"
                  placeholder="you@example.com"
                  className="min-h-[40px] w-full min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-surface-900 px-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubscribeSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[40px] rounded-lg bg-apf-purple px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#A21CE8] disabled:opacity-50"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 font-terminal text-[11px] uppercase tracking-[0.14em] text-ink-dim">
            <span className="flex items-center gap-2 text-emerald-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              edge telemetry
            </span>
            <span>{ingressLine}</span>
            <span>{queueDepth} queued</span>
            {telemetryLogs[0] && <span className="text-ink-dim">{telemetryLogs[0]}</span>}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-ink-dim sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} American Pirate Federation. Source under AGPL-3.0.</p>
            <p className="font-terminal uppercase tracking-[0.16em]">No third-party pixels · read-only treasury</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
