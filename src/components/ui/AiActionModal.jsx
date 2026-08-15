import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

export function AiActionModal() {
  const pendingAiAction = useAppStore(state => state.pendingAiAction);
  const clearPendingAiAction = useAppStore(state => state.clearPendingAiAction);
  const enqueueTx = useAppStore(state => state.enqueueTx);
  const isOpen = !!pendingAiAction;
  const commandPayload = pendingAiAction?.command;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          clearPendingAiAction();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, clearPendingAiAction]);


  const handleAuthorize = () => {
    console.info('[ ACTION_AUTHORIZED ]');
    enqueueTx({ id: Date.now(), command: commandPayload });
    clearPendingAiAction();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-black/90 border-2 border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)] p-6 relative overflow-hidden"
          >
            {/* Scanline overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,0,0,0.03)_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px] z-0"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-500/30">
                <div className="w-10 h-10 flex items-center justify-center bg-red-500/20 border border-red-500 text-red-500">
                  <SafeIcon name="AlertTriangle" className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-vt323 text-red-500 tracking-widest uppercase">
                    [ SYSTEM NOTICE ]
                  </h2>
                  <p className="font-vt323 text-red-400/80 text-sm tracking-wider uppercase">
                    AI PROPOSING POLICY UPDATE
                  </p>
                </div>
              </div>

              <div className="mb-8 font-vt323 text-gray-300 bg-black border border-amber-500/30 p-4">
                <div className="text-amber-500 mb-2 uppercase text-xs tracking-widest border-b border-amber-500/30 pb-1">
                  Proposed Command Payload:
                </div>
                <pre className="whitespace-pre-wrap text-sm text-green-400 break-words">
                  {commandPayload || 'No payload provided.'}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={clearPendingAiAction}
                  className="px-6 py-3 font-vt323 text-lg uppercase tracking-widest border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  [ DENY & PURGE ]
                </button>
                <button
                  onClick={handleAuthorize}
                  className="px-6 py-3 font-vt323 text-lg uppercase tracking-widest border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 relative group"
                >
                  <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  [ AUTHORIZE & SIGN ]
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
