import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './Navbar';
import { ContributeButton } from '../web3/ContributeButton';
import { NetworkSwitchModal } from '../web3/NetworkSwitchModal';
import { useAppStore } from '../../store/useAppStore';
import { useParallax } from '../../hooks/useParallax';
import { generateChecksum, logCommLinkSubscription } from '../../lib/api/telemetry';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';

export function Layout({ children }) {
  const { isCorrectNetwork, setIsCorrectNetwork, setTreasuryDeploymentStatus, telemetryLogs, setIsSigning } = useAppStore();
  const location = useLocation();
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const isMismatched = account && chain && chain.id !== 42161 && chain.id !== 421614;

  useEffect(() => {
    setIsSigning(false);
  }, [location.pathname, setIsSigning]);
  const scrollOffset = useParallax();
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
      const res = await fetch("https://api.emailit.com/v1/subscribers", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_EMAILIT_API_KEY || ""}`
        },
        body: JSON.stringify({ email })
      });
      if (isMounted.current) {
        if (res.ok) {
          localStorage.setItem('apf_last_sub', now.toString());
          logCommLinkSubscription(email);
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

  return (
    <div className="min-h-screen relative apf-root-container flex flex-col bg-apf-black">
      <NetworkSwitchModal
        isWrongNetwork={Boolean(isMismatched && !isCorrectNetwork)}
        onSwitchNetwork={() => setIsCorrectNetwork(true)}
        onDismiss={() => { setIsCorrectNetwork(true); setTreasuryDeploymentStatus('idle'); }}
      />
      {/* Scanlines overlay */}
      <div className="scanlines !pointer-events-none" />

      {/* Triple-Layered Digital Sea Parallax Grid */}
      {/* Deepest Horizon Layer */}
      <motion.div
        className="fixed inset-0 bg-digital-sea !pointer-events-none"
        style={{ y: -scrollOffset * 0.15, scale: 2, zIndex: 0, opacity: 0.03 }}
      />

      {/* Mid Layer */}
      <motion.div
        className="fixed inset-0 bg-digital-sea opacity-20 !pointer-events-none"
        style={{ y: -scrollOffset * 0.4, scale: 1.5, zIndex: 0 }}
      />

      {/* Fore Layer */}
      <motion.div
        className="fixed inset-0 bg-digital-sea opacity-30 !pointer-events-none"
        style={{ y: -scrollOffset, zIndex: 0 }}
      />

      <Navbar />
      <div className="fixed bottom-4 left-4 z-50">
        <ContributeButton />
      </div>

      <main className="flex-grow pt-16 relative z-10 pointer-events-auto">
        {children}
      </main>


      {/* Telemetry Terminal */}
      <div className="fixed bottom-4 right-4 z-50 w-64 bg-black/80 border border-[#10B981]/50 p-2 pointer-events-none">
        <div className="text-[#10B981] font-mono text-xs space-y-1">
          {telemetryLogs.length === 0 ? (
            <div>[ AXiM CORE: STANDBY FOR INGRESS ]</div>
          ) : (
            telemetryLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))
          )}
          <div className="font-vt323 border-t border-[#10B981]/30 pt-1 mt-1">
            [ QUEUE_DEPTH: {queueDepth}_PENDING_PACKETS ]
          </div>
          <div className="font-vt323 border-t border-[#10B981]/30 pt-1 mt-1 text-apf-emerald">
            [ INGRESS: CLOUDFLARE_EDGE_ACTIVE ]
          </div>
        </div>
      </div>


      <footer className="border-t border-apf-purple/20 bg-apf-black/80 py-8 text-center text-sm font-vt323 text-gray-500 relative z-10 pointer-events-auto">
        <div className="max-w-md mx-auto mb-8">
          <h3 className="text-apf-purple uppercase tracking-widest mb-4">JOIN THE INTELLIGENCE FEED</h3>
          <form onSubmit={handleSubscribeSubmit} className="flex gap-2">
            <input
              type="email"
              name="email"
              placeholder="ENTER COMM-LINK ADDRESS..."
              className="flex-1 bg-black/50 border border-apf-purple/30 px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-apf-purple"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubscribeSubmit(e);
                }
              }}
            />
            <button type="submit" disabled={isSubmitting} className="bg-apf-purple hover:bg-apf-purpleLight text-white px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50">INITIALIZE</button>
          </form>
        </div>
        <p>SECURE NODE ESTABLISHED. APF © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
