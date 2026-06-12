import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error' || toast.type === 'warning';
          const borderColor = isError ? 'border-apf-purple' : 'border-apf-emerald';
          const textColor = isError ? 'text-apf-purple' : 'text-apf-emerald';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`bg-black/80 backdrop-blur-2xl border font-vt323 text-sm tracking-widest px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-auto ${borderColor} ${textColor}`}
            >
              {toast.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
