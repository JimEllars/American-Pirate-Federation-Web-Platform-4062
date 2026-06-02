import React from 'react';
import { usePirateIntel } from '../../hooks/usePirateIntel';
import DOMPurify from 'isomorphic-dompurify';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function NewsFeed() {
  const { data: posts, loading, error } = usePirateIntel('posts?_embed&per_page=3');

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-apf-purple font-mono">
        <SafeIcon name="Loader" className="animate-spin mr-2" />
        ESTABLISHING SECURE CONNECTION...
      </div>
    );
  }

  // AXiM Stability Protocol: Graceful degradation on intel failure
  if (error || !posts) {
    return (
      <div className="py-12 flex justify-center">
        <div className="border border-red-500/50 bg-red-500/10 p-6 rounded text-red-400 font-mono flex items-center gap-3">
          <SafeIcon name="AlertTriangle" className="h-6 w-6" />
          <span>[SIGNAL_INTERRUPTED] - UNABLE TO FETCH INTEL DECK</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-10 border-b border-apf-purple/30 pb-4">
        <SafeIcon name="Terminal" className="text-apf-purple h-6 w-6" />
        <h2 className="text-3xl font-black uppercase text-white tracking-widest">Pirate News</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, index) => {
          const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={post.id} 
              className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 overflow-hidden group"
            >
              {featuredMedia && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={featuredMedia} 
                    alt="" 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )}
              <div className="p-6">
                <p className="text-apf-purple text-xs font-mono mb-2">
                  {new Date(post.date).toLocaleDateString()}
                </p>
                <h3 
                  className="text-xl font-bold mb-3 text-gray-100"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.title.rendered) }}
                />
                <div 
                  className="prose prose-invert prose-sm text-gray-400 line-clamp-3 font-mono"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.excerpt.rendered) }}
                />
                <button className="mt-4 text-sm font-mono text-apf-purpleLight hover:text-white flex items-center gap-2">
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