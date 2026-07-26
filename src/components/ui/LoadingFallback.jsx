import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';

export function LoadingFallback() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Debounce the loading fallback by 250ms
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="min-h-screen bg-apf-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-vt323">
      <div className="scanlines !pointer-events-none" />
      <div className="fixed inset-0 neon-grid opacity-20 !pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center animate-pulse">
        <SafeIcon name="Terminal" className="h-16 w-16 text-apf-purple mb-4" />
        <div className="text-apf-purple tracking-widest uppercase text-xl border border-apf-purple/30 bg-black/50 p-4 shadow-[0_0_15px_rgba(148,0,255,0.3)]">
          [ ESTABLISHING SECURE CONNECTION... ]
        </div>
      </div>
    </div>
  );
}
