import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      <AnimatePresence>
        {toasts.slice(-3).map((toast) => {
          const isError = toast.type === 'error' || toast.type === 'warning' || toast.type === 'critical';
          const dotColor = toast.type === 'critical' || toast.type === 'error'
            ? 'bg-red-400'
            : toast.type === 'warning'
              ? 'bg-amber-400'
              : 'bg-emerald-400';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/[0.1] bg-surface-800/95 px-4 py-3 text-sm leading-snug text-ink shadow-lift backdrop-blur-xl"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
              <span>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
