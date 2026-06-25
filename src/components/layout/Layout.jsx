import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { NetworkSwitchModal } from '../web3/NetworkSwitchModal';
import { useAppStore } from '../../store/useAppStore';
import { useParallax } from '../../hooks/useParallax';
import { motion } from 'framer-motion';

export function Layout({ children }) {
  const { isCorrectNetwork, setIsCorrectNetwork, setTreasuryDeploymentStatus, telemetryLogs } = useAppStore();
  const scrollOffset = useParallax();
  const [queueDepth, setQueueDepth] = useState(0);

  useEffect(() => {
    const updateQueueDepth = () => {
      try {
        const queueStr = localStorage.getItem('apf_telemetry_queue');
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

    return () => clearInterval(intervalId);
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
