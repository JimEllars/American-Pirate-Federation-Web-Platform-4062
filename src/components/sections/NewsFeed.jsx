import React from 'react';
import { useWPContent } from '../../hooks/useWPContent';
import DOMPurify from 'isomorphic-dompurify';
import { stripHtml } from '../../lib/api/formatting';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function NewsFeed() {
  const { data: posts, isLoading, error } = useWPContent();

  if (isLoading) {
    return (
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10 border-b border-apf-purple/30 pb-4">
          <SafeIcon name="Terminal" className="text-apf-purple h-6 w-6 animate-pulse" />
          <h2 className="text-3xl font-black uppercase text-white tracking-widest animate-pulse">
            Pirate News
          </h2>
        </div>
        <div className="mb-8">
          <span className="font-vt323 text-apf-emerald/80 text-xl tracking-widest uppercase">[ DECRYPTING INCOMING TRANSMISSIONS... ]</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-[#050505] border border-apf-emerald/20 p-4 rounded-none shadow-2xl transition-all duration-500 h-64 flex flex-col justify-end"
            >
              <div className="bg-apf-purple/20 h-4 w-3/4 mb-2 animate-pulse"></div>
              <div className="bg-apf-emerald/10 h-3 w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const fallbackPosts = [
    {
      id: 'fallback-1',
      title: { rendered: 'Federation Core Operational' },
      excerpt: { rendered: '<p>All systems running at nominal capacity. Internal audits are green across the board.</p>' },
      date: new Date().toISOString()
    },
    {
      id: 'fallback-2',
      title: { rendered: 'New Protocols Initiated' },
      excerpt: { rendered: '<p>Standard operating procedures updated in the latest security patch deployed across all regional hubs.</p>' },
      date: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'fallback-3',
      title: { rendered: 'Maintenance Schedule' },
      excerpt: { rendered: '<p>Routine checks scheduled for tomorrow at 0400 hours local time. Expect minor latency spikes.</p>' },
      date: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  const hasOfflineError = error || !posts || posts.length === 0;
  const displayPosts = hasOfflineError ? fallbackPosts : posts;

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-10 border-b border-apf-purple/30 pb-4">
        <SafeIcon name="Terminal" className="text-apf-purple h-6 w-6" />
        <h2 className="text-3xl font-black uppercase text-white tracking-widest">Pirate News</h2>
      </div>

      {hasOfflineError && (
        <div className="mb-8">
          <div className="text-apf-purple font-vt323 text-xl inline-flex items-center gap-2">
            <SafeIcon name="AlertTriangle" className="h-6 w-6" />
            <span>[ FEDERATION COMM-LINK OFFLINE // DISPLAYING CACHED ARCHIVES ]</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayPosts.map((post, index) => {
          const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
          const dateStr = new Date(post.date);
          const formattedDate = dateStr.getFullYear() + '.' + String(dateStr.getMonth() + 1).padStart(2, '0') + '.' + String(dateStr.getDate()).padStart(2, '0');
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={post.id} 
              className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 overflow-hidden group flex flex-col"
            >
              {featuredMedia && (
                <div className="h-48 overflow-hidden shrink-0">
                  <img 
                    src={featuredMedia} 
                    alt="" 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <p className="text-apf-purple text-xs font-vt323 tracking-widest mb-2">
                    {formattedDate}
                  </p>
                  <h3
                    className="text-xl font-bold mb-3 text-gray-100"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(stripHtml(post.title.rendered)) }}
                  />
                  <div
                    className="prose prose-invert prose-sm text-gray-400 line-clamp-3 font-mono"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(stripHtml(post.excerpt.rendered)) }}
                  />
                </div>
                <button className="mt-4 text-sm font-vt323 uppercase tracking-widest text-apf-purpleLight hover:text-white flex items-center gap-2 self-start">
                  Read Decrypt <SafeIcon name="ArrowRight" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
