import React, { useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { logNetworkTransition } from '../../lib/api/telemetry';

export function NetworkSwitchModal({ isWrongNetwork, onSwitchNetwork, onDismiss }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onDismiss) {
        handleDismiss();
      }
    };

    if (isWrongNetwork) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isWrongNetwork, onDismiss]);

  const handleDismiss = () => {
    document.body.style.overflow = 'unset';
    try {
      logNetworkTransition(42161, false);
    } catch (e) { // console.error(e);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleSwitch = async () => {
    if (onSwitchNetwork) {
      try {
        await onSwitchNetwork();
        logNetworkTransition(42161, true);
      } catch (error) {
        logNetworkTransition(42161, false);
      }
    }
  };

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="apf-card relative z-10 flex w-full max-w-md flex-col items-center p-8 text-center">
        <SafeIcon name="AlertTriangle" className="mb-4 h-8 w-8 text-amber-400" />

        <h2 className="mb-2 text-xl font-semibold text-white">
          Wrong network
        </h2>

        <p className="mb-8 text-sm leading-relaxed text-ink-muted">
          This wallet is connected to a different chain. Switch to Arbitrum One to use the treasury and shop surfaces.
        </p>

        <div className="flex flex-col gap-3 w-full relative z-10">
          <button
            onClick={handleSwitch}
            className="apf-btn apf-btn-primary w-full"
          >
            Align to Arbitrum One
          </button>

          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="apf-btn apf-btn-ghost w-full"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
