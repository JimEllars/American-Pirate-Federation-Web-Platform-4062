import React from 'react';
import { useWPContent } from '../../hooks/useWPContent';
import DOMPurify from 'isomorphic-dompurify';
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
            [ DECRYPTING INCOMING TRANSMISSIONS... ]
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 bg-[#050505] border border-apf-emerald/20 animate-pulse shadow-2xl transition-all duration-500 rounded-sm"
            >
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && (error || !posts || posts.length === 0)) {
    return (
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10 border-b border-apf-purple/30 pb-4">
          <SafeIcon name="Terminal" className="text-apf-purple h-6 w-6" />
          <h2 className="text-3xl font-black uppercase text-white tracking-widest">Pirate News</h2>
        </div>
        <div className="py-12 flex justify-center bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500">
          <div className="border border-apf-purple/50 bg-apf-purple/10 p-6 text-apf-purple font-vt323 flex items-center gap-3 text-xl">
            <SafeIcon name="AlertTriangle" className="h-6 w-6" />
            <span>[ FEDERATION COMM-LINK CURRENTLY OFFLINE. RETRYING CONNECTION... ]</span>
          </div>
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
              className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 overflow-hidden group"
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
                <p className="text-apf-purple text-xs font-vt323 tracking-widest mb-2">
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
                <button className="mt-4 text-sm font-vt323 uppercase tracking-widest text-apf-purpleLight hover:text-white flex items-center gap-2">
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