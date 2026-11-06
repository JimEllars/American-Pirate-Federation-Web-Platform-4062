import React, { useState, useEffect } from 'react';
import { PayEmbed } from 'thirdweb/react';
import { logCheckoutException } from '../../lib/api/telemetry';
import SafeIcon from '../../common/SafeIcon';
import { client } from '../../lib/web3/client';

export function ContributeButton({ className = '', showLabel = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleTransactionError = (error) => {
    logCheckoutException(error?.message || 'Transaction error');
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-surface-900/90 text-sm font-medium text-white shadow-lift backdrop-blur transition-colors hover:border-white/15 hover:bg-surface-800 ${
          showLabel ? 'px-4' : 'h-11 w-11 p-0'
        } ${className}`}
        aria-label="Contribute to the federation"
        title="Contribute to the federation"
      >
        <SafeIcon name="DollarSign" className="h-4 w-4 text-emerald-300" />
        {showLabel && 'Contribute'}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-surface-900 shadow-lift">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close checkout"
            >
              <SafeIcon name="X" className="h-5 w-5" />
            </button>
            <div className="p-2">
               <PayEmbed
                 client={client}
                 theme="dark"
                 onTransactionError={handleTransactionError}
                 onPaymentError={handleTransactionError}
               />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
