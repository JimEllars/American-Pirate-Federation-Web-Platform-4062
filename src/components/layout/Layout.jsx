import React from 'react';
import { Navbar } from './Navbar';
import { NetworkSwitchModal } from '../web3/NetworkSwitchModal';
import { useAppStore } from '../../store/useAppStore';
import { useParallax } from '../../hooks/useParallax';
import { motion } from 'framer-motion';

export function Layout({ children }) {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queueCount, setQueueCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateQueueCount = () => {
      try {
        const queueStr = localStorage.getItem('apf_telemetry_queue');
        if (queueStr) {
          const queue = JSON.parse(queueStr);
          setQueueCount(queue.length);
        } else {
          setQueueCount(0);
        }
      } catch(e) {
        setQueueCount(0);
      }
    };

    updateQueueCount();
    // Poll to keep queue count accurate across tabs/events
    const interval = setInterval(updateQueueCount, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  const { isCorrectNetwork, setIsCorrectNetwork, setTreasuryDeploymentStatus, telemetryLogs, networkBackoffDelay } = useAppStore();
  const scrollOffset = useParallax();

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
        <div className="text-[#10B981] font-vt323 text-sm space-y-1 tracking-widest">
          <div className="border-b border-[#10B981]/30 pb-1 mb-2">
            <div>
              {networkBackoffDelay > 0
                ? `[ NET_BACKOFF_CIRCUIT: ACTIVE // RETRY_DELAY: ${networkBackoffDelay}MS ]`
                : (isOnline ? '[ AXiM INGRESS: ALL SYSTEMS NOMINAL // LEDGER LIVE ]' : '[ NETWORK DETACHED: LOCAL STAGING ACTIVE ]')}
            </div>
            <div className="text-[10px]">BUFFER QUEUE: {queueCount} STAGED</div>
          </div>
          {telemetryLogs.length === 0 ? (
            <div>[ AXiM CORE: STANDBY FOR INGRESS ]</div>
          ) : (
            telemetryLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))
          )}
        </div>
      </div>

      <footer className="border-t border-apf-purple/20 bg-apf-black/80 py-8 text-center text-sm font-vt323 text-gray-500 relative z-10 pointer-events-auto">
        <p>SECURE NODE ESTABLISHED. APF © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
