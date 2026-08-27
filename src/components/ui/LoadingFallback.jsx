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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-vt323">
      <div className="scanlines !pointer-events-none" />
      <div className="fixed inset-0 neon-grid opacity-20 !pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <SafeIcon name="Terminal" className="h-12 w-12 text-apf-purple mb-6 animate-pulse" />

        {/* High-contrast skeleton loader matching cyber-pirate aesthetic */}
        <div className="w-full bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(148,0,255,0.15)] p-6 relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-0"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-apf-purple/10 border border-apf-purple/30 animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-3 bg-gray-800 border border-gray-700/50 w-3/4"></div>
                        <div className="h-2 bg-gray-800 border border-gray-700/50 w-1/2"></div>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="h-2 bg-gray-800/80 w-full"></div>
                    <div className="h-2 bg-gray-800/80 w-5/6"></div>
                    <div className="h-2 bg-gray-800/80 w-4/6"></div>
                </div>

                <div className="border-t border-gray-800/50 pt-4 flex justify-between items-center">
                    <div className="h-3 bg-gray-800/80 w-20"></div>
                    <div className="h-8 w-24 bg-apf-purple/10 border border-apf-purple/20"></div>
                </div>
            </div>

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-apf-purple/50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-apf-purple/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-apf-purple/50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-apf-purple/50"></div>
        </div>

        <div className="text-apf-purple tracking-widest uppercase text-sm mt-6 animate-pulse border-b border-apf-purple/30 pb-1">
          [ ESTABLISHING SECURE CONNECTION... ]
        </div>
      </div>
    </div>
  );
}
