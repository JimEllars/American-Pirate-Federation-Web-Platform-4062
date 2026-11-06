import React, { useState, useEffect } from 'react';

export function LoadingFallback() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Debounce: a route chunk that resolves quickly should not flash a skeleton.
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6" role="status" aria-label="Loading">
      <div className="w-full max-w-sm animate-pulse space-y-3">
        <div className="h-2 w-20 rounded-full bg-white/[0.08]" />
        <div className="h-7 w-3/4 rounded-lg bg-white/[0.07]" />
        <div className="h-3 w-full rounded bg-white/[0.04]" />
        <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
        <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}
