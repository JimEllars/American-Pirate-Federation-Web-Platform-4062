import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { usePirateIntel } from '../hooks/usePirateIntel';
import DOMPurify from 'isomorphic-dompurify';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';

export function NewsArchive() {
  const { data: posts, loading, error } = usePirateIntel('posts?_embed&per_page=12');

  return (
    <Layout>
      <SEO title="News Archive | Pirate Federation" description="Latest transmissions and intel from the APF fleet." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Terminal" className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                Fleet Transmissions
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg border-l-2 border-apf-purple pl-6">
              Decrypted intelligence and dispatch logs from the American Pirate Federation network.
            </p>
          </div>

          {loading ? (
            <div className="py-24 flex justify-center text-apf-purple font-mono">
              <SafeIcon name="Loader" className="animate-spin mr-2 h-8 w-8" />
              SYNCING ARCHIVES...
            </div>
          ) : error || !posts ? (
            <div className="py-24 flex justify-center">
              <div className="border border-red-500/50 bg-red-500/10 p-6 rounded text-red-400 font-mono flex items-center gap-3">
                <SafeIcon name="AlertTriangle" className="h-6 w-6" />
                <span>[SIGNAL_INTERRUPTED] - UNABLE TO FETCH ARCHIVES</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => {
                const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={post.id}
                    className="bg-black/40 border border-gray-800 hover:border-apf-purple transition-colors overflow-hidden group flex flex-col"
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
                    <div className="p-6 flex-grow flex flex-col">
                      <p className="text-apf-purple text-xs font-mono mb-2">
                        {new Date(post.date).toLocaleDateString()}
                      </p>
                      <h3
                        className="text-xl font-bold mb-3 text-gray-100 group-hover:text-apf-purpleLight transition-colors"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.title.rendered) }}
                      />
                      <div
                        className="prose prose-invert prose-sm text-gray-400 line-clamp-3 font-mono flex-grow mb-4"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.excerpt.rendered) }}
                      />
                      <button className="mt-auto w-fit text-sm font-mono text-apf-purple hover:text-white flex items-center gap-2 uppercase tracking-widest">
                        Read Decrypt <SafeIcon name="ArrowRight" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && !error && posts && (
            <div className="mt-20 p-8 border border-dashed border-gray-800 text-center">
               <button className="text-apf-purple hover:text-white font-mono text-xs uppercase tracking-widest border border-apf-purple/50 px-6 py-3 hover:bg-apf-purple/10 transition-colors">
                 Load Older Transmissions
               </button>
            </div>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
