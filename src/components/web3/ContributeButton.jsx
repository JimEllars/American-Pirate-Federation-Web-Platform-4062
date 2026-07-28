import React, { useState, useEffect } from 'react';
import { PayEmbed } from 'thirdweb/react';
import { logCheckoutException } from '../../lib/api/telemetry';
import SafeIcon from '../../common/SafeIcon';
import { client } from '../../lib/web3/client';

export function ContributeButton() {
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
        className="flex items-center gap-2 px-6 py-3 border border-apf-purple text-apf-purple font-vt323 tracking-widest text-lg uppercase bg-black/50 hover:bg-apf-purple hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(148,0,255,0.3)] hover:shadow-[0_0_25px_rgba(148,0,255,0.6)]"
      >
        <SafeIcon name="DollarSign" className="h-5 w-5" />
        Contribute to the Federation
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-black border border-apf-purple/50 shadow-[0_0_30px_rgba(148,0,255,0.2)]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
              aria-label="Close Checkout"
            >
              <SafeIcon name="X" className="h-6 w-6" />
            </button>
            <div className="p-1">
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
