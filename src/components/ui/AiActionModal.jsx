import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

export function AiActionModal() {
  const pendingAiAction = useAppStore(state => state.pendingAiAction);
  const clearPendingAiAction = useAppStore(state => state.clearPendingAiAction);
  const enqueueTx = useAppStore(state => state.enqueueTx);
  const addToast = useAppStore(state => state.addToast);
  const isOpen = !!pendingAiAction;
  const commandPayload = pendingAiAction?.command;
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape' && !isExecuting) {
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
      setIsExecuting(false);
      setErrorState(null);
    }
  }, [isOpen, clearPendingAiAction, isExecuting]);

  const handleAuthorize = async () => {
    setIsExecuting(true);
    setErrorState(null);
    console.info('[ ACTION_AUTHORIZED ]');

    try {
        // Simulate execution loading before dispatching
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!commandPayload) {
            throw new Error("Invalid command payload");
        }

        enqueueTx({ id: Date.now(), command: commandPayload });
        clearPendingAiAction();
        addToast('[ ACTION DISPATCHED TO QUEUE ]', 'success');
    } catch (error) {
        console.error('[ ACTION_FAILED ]', error);
        setErrorState(error.message || 'Execution Failed');
        addToast(`[ ERROR: ${error.message || 'EXECUTION FAILED'} ]`, 'error');
        setIsExecuting(false);
    }
  };

  const handleRollback = () => {
      setErrorState(null);
      clearPendingAiAction();
      addToast('[ ACTION ROLLED BACK ]', 'info');
  };

  const displayPayload = typeof commandPayload === 'object'
    ? JSON.stringify(commandPayload, null, 2)
    : (commandPayload || 'No payload provided.');

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
                <div className="text-amber-500 mb-2 uppercase text-xs tracking-widest border-b border-amber-500/30 pb-1 flex justify-between">
                  <span>Proposed Command Payload:</span>
                  {errorState && <span className="text-red-500">[ ERROR ]</span>}
                </div>

                {isExecuting ? (
                    <div className="flex flex-col space-y-2 py-4">
                        <div className="h-4 bg-amber-500/20 animate-pulse w-3/4"></div>
                        <div className="h-4 bg-amber-500/20 animate-pulse w-1/2"></div>
                        <div className="h-4 bg-amber-500/20 animate-pulse w-5/6"></div>
                        <div className="text-amber-500 text-sm tracking-widest mt-4 text-center">[ EXECUTING COMMAND SEQUENCE... ]</div>
                    </div>
                ) : errorState ? (
                    <div className="text-red-500 text-sm py-4">
                        SYSTEM ERROR: {errorState}
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap text-sm text-green-400 break-words max-h-60 overflow-y-auto">
                      {displayPayload}
                    </pre>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                {errorState ? (
                    <button
                        onClick={handleRollback}
                        className="px-6 py-3 font-vt323 text-lg uppercase tracking-widest border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                        [ ROLLBACK ]
                    </button>
                ) : (
                    <>
                        <button
                          onClick={clearPendingAiAction}
                          disabled={isExecuting}
                          className="px-6 py-3 font-vt323 text-lg uppercase tracking-widest border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          [ CANCEL ACTION ]
                        </button>
                        <button
                          onClick={handleAuthorize}
                          disabled={isExecuting}
                          className="px-6 py-3 font-vt323 text-lg uppercase tracking-widest border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 relative group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {isExecuting ? '[ PROCESSING... ]' : '[ AUTHORIZE & SIGN ]'}
                        </button>
                    </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
