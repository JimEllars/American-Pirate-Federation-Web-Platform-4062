import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';

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
      <div className="bg-[#0A0A0A] border border-[#10B981] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col font-mono shadow-2xl shadow-[#10B981]/20">

        {/* Header */}
        <div className="border-b border-[#10B981] p-4 flex justify-between items-center bg-[#10B981]/10">
          <div>
            <div className="text-[#10B981] text-xs mb-1">SECURE TRANSMISSION [{formattedDate}]</div>
            <h2 className="text-[#9400FF] text-xl uppercase tracking-wider font-bold">{cleanTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#10B981] hover:text-[#9400FF] transition-colors border border-transparent hover:border-[#9400FF] px-3 py-1 text-sm uppercase"
          >
            [ CLOSE DECRYPT ]
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto text-gray-300 text-sm leading-relaxed prose prose-invert prose-p:mb-4 prose-a:text-[#10B981] hover:prose-a:text-[#9400FF] scrollbar-thin scrollbar-thumb-[#10B981]/50 scrollbar-track-transparent">
          <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
        </div>

        {/* Footer line */}
        <div className="border-t border-[#10B981]/30 p-2 text-center text-[10px] text-[#10B981]/50 uppercase tracking-widest">
          END OF FILE
        </div>
      </div>
    </div>
  );
}
