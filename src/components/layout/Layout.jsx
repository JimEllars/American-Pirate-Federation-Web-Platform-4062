import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { NetworkSwitchModal } from '../web3/NetworkSwitchModal';
import { useAppStore } from '../../store/useAppStore';
import { useParallax } from '../../hooks/useParallax';
import { generateChecksum } from '../../lib/api/telemetry';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function Layout({ children }) {
  const { isCorrectNetwork, setIsCorrectNetwork, setTreasuryDeploymentStatus, telemetryLogs, setIsSigning } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    setIsSigning(false);
  }, [location.pathname, setIsSigning]);
  const scrollOffset = useParallax();
  const [queueDepth, setQueueDepth] = useState(0);


  useEffect(() => {
    let isQueueProcessing = false;
    const QUEUE_KEY = 'apf_telemetry_queue';

    const processQueue = async () => {
      if (isQueueProcessing || typeof navigator === 'undefined' || !navigator.onLine) return;
      isQueueProcessing = true;

      try {
        const queueStr = localStorage.getItem(QUEUE_KEY);
        if (!queueStr) return;

        let queue = [];
        try {
          queue = JSON.parse(queueStr);
        } catch (e) {
          localStorage.removeItem(QUEUE_KEY);
          return;
        }

        if (queue.length === 0) return;

        let allFlushed = true;
        let remainingQueue = [];

        for (const item of queue) {
          // 1. Verify Payload Integrity
          if (item.integrityHash) {
             const payloadString = JSON.stringify(item.payload);
             const expectedChecksum = await generateChecksum(payloadString);
             if (item.integrityHash !== expectedChecksum) {
                 console.error('[ SECURITY EXCEPTION: CORRUPTED OFFLINE PAYLOAD DROP ENFORCED ]');
                 continue; // Drop the corrupted payload
             }
          }

          // 2. Enforce 2-hour TTL
          if (item.stagedAt) {
             const age = Date.now() - item.stagedAt;
             if (age > 7200000) { // 2 hours in ms
                 useAppStore.getState().addToast('[ TRANSACTION EXPIRED: SIGNATURE AGE EXCEEDED 2-HOUR MAX BOUNDS ]', 'error');
                 continue; // Drop the expired payload
             }
          }

          try {
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'MISSING_KEY';
            if (anonKey === 'MISSING_KEY') {
                useAppStore.getState().addTelemetryLog('[ UPLINK FAILED: MISSING CREDENTIALS ]');
                allFlushed = false;
                remainingQueue.push(item);
                continue;
            }
            const res = await fetch(item.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`
              },
              body: JSON.stringify(item.payload)
            });

            if (!res.ok) {
              allFlushed = false;
              remainingQueue.push(item);
            }
          } catch (e) {
            allFlushed = false;
            remainingQueue.push(item);
          }
        }

        if (allFlushed) {
          localStorage.removeItem(QUEUE_KEY);
          if (queue.length > 0) {
            useAppStore.getState().addToast('[ SYSTEM STATUS: STAGED TELEMETRY SIGNALS FLUSHED TO CORE ]', 'success');
          }
        } else {
          localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
        }
      } finally {
        isQueueProcessing = false;
      }
    };

    processQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', processQueue);
    }

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
        if (typeof window !== 'undefined') {
          window.removeEventListener('online', processQueue);
        }
    };
  }, []);


  return (
    <div className="min-h-screen relative apf-root-container flex flex-col bg-apf-black">
      <NetworkSwitchModal
        isWrongNetwork={!isCorrectNetwork}
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
        </div>
      </div>


      <footer className="border-t border-apf-purple/20 bg-apf-black/80 py-8 text-center text-sm font-vt323 text-gray-500 relative z-10 pointer-events-auto">
        <p>SECURE NODE ESTABLISHED. APF © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
