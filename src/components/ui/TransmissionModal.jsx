import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

export default function TransmissionModal({ isOpen, onClose, post }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const rawTitle = post.title?.rendered || '';
  const cleanTitle = rawTitle.replace(/<[^>]*>?/gm, ''); // stripHtml

  const rawContent = post.content?.rendered || post.excerpt?.rendered || '';
  const cleanContent = DOMPurify.sanitize(rawContent);

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-black/80 backdrop-blur-md fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="apf-card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
      >

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] bg-surface-900 p-4">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">
              {post.classification ? `${post.classification} TRANSMISSION` : 'PUBLIC DISPATCH'} [{formattedDate}]
            </div>
            <h2 className="text-lg font-semibold text-white">{cleanTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none overflow-y-auto p-6 text-sm leading-relaxed text-ink-muted prose-p:mb-4 prose-a:text-apf-purpleLight">
          <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
        </div>

        {/* Footer line */}
        <div className="border-t border-white/[0.06] p-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">
          End of record
        </div>
      </motion.div>
    </div>
  );
}
