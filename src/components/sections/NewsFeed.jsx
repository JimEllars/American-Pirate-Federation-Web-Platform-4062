import React from 'react';
import TransmissionModal from '../ui/TransmissionModal';
import { useWPContent } from '../../hooks/useWPContent';
import DOMPurify from 'isomorphic-dompurify';
import { stripHtml } from '../../lib/api/formatting';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function NewsFeed() {
  const { data: posts, isLoading, error } = useWPContent();
  const [activePost, setActivePost] = React.useState(null);


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
          <span className="font-vt323 text-apf-emerald/80 text-xl tracking-widest uppercase">[ LOADING DISPATCHES FROM THE CMS... ]</span>
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


  // Law 1: this used to render three invented dispatches — "Federation Core Operational",
  // "New Protocols Initiated", "Maintenance Schedule" — whenever the CMS was unreachable
  // or returned nothing, each stamped with a fresh timestamp. Fabricated news on a
  // political organisation's home page is the single worst thing this codebase could do,
  // so an empty wire now says it is empty.
  const hasOfflineError = error || !posts || posts.length === 0;

  if (hasOfflineError) {
    return (
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10 border-b border-apf-purple/30 pb-4">
          <SafeIcon name="Terminal" className="text-apf-purple h-6 w-6" />
          <h2 className="text-3xl font-black uppercase text-white tracking-widest">Pirate News</h2>
        </div>
        <div className="border border-dashed border-gray-800 bg-black/40 p-10 text-center">
          <SafeIcon name="Radio" className="mx-auto h-10 w-10 text-gray-600 mb-4" />
          <div className="font-vt323 text-xl text-gray-300 uppercase tracking-widest mb-2">
            [ NO DISPATCHES ON THE WIRE ]
          </div>
          <p className="font-sans text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            The Federation newsroom has published nothing yet, or the CMS is unreachable from
            this node. This page never fills the gap with sample stories.
          </p>
        </div>
      </div>
    );
  }

  const displayPosts = posts;

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-10 border-b border-apf-purple/30 pb-4">
        <SafeIcon name="Terminal" className="text-apf-purple h-6 w-6" />
        <h2 className="text-3xl font-black uppercase text-white tracking-widest">Pirate News</h2>
      </div>

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
                <button onClick={() => setActivePost(post)} className="mt-4 text-sm font-vt323 uppercase tracking-widest text-apf-purpleLight hover:text-white flex items-center gap-2 self-start">
                  Read Dispatch <SafeIcon name="ArrowRight" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
            <TransmissionModal
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
      />
    </div>
  );
}
