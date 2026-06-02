import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import DOMPurify from 'isomorphic-dompurify';
import { usePirateIntel } from '../hooks/usePirateIntel';

export function IntelligenceHub() {
  const { data: posts, loading, error } = usePirateIntel('posts?_embed&per_page=12');

  const nodes = [
      'US-EAST-1', 'US-WEST-2', 'EU-CENTRAL-1', 'AP-SOUTH-1', 'SA-EAST-1'
  ];

  return (
    <Layout>
      <SEO title="Intelligence Hub | Pirate Federation" description="Organizational health, fleet telemetry, and dispatch logs of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Activity" className="h-10 w-10 text-apf-emerald" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                Consolidated Intelligence Core
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg border-l-2 border-apf-emerald pl-6">
              Real-time synchronization status, fleet telemetry, and decrypted intelligence logs from the American Pirate Federation network.
            </p>
          </div>

          {/* Section 1: Fleet Telemetry (Census) */}
          <section className="space-y-8 bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white border-b-2 border-apf-purple/50 pb-2 flex items-center gap-3">
                 <SafeIcon name="Database" className="text-apf-purple h-8 w-8" /> Fleet Telemetry
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Personnel Distribution */}
                  <div className="lg:col-span-1 bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-6 neon-grid relative overflow-hidden group">
                      <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                      <div className="relative z-10">
                          <h3 className="font-vt323 text-xl text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                              <SafeIcon name="Users" className="h-5 w-5 text-apf-purpleLight" /> Active Personnel
                          </h3>

                          <div className="space-y-4">
                              <div className="flex items-center justify-between mt-2">
                                  <span className="font-vt323 text-white uppercase text-sm">Shipwright's Guild (Engineering)</span>
                                  <span className="font-vt323 text-apf-emerald font-bold">42%</span>
                              </div>
                              <div className="w-full bg-gray-900 h-2">
                                  <div className="bg-apf-emerald h-2" style={{ width: '42%' }}></div>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                  <span className="font-vt323 text-white uppercase text-sm">Surgeon's Dispensary (Healthcare)</span>
                                  <span className="font-vt323 text-apf-purple font-bold">28%</span>
                              </div>
                              <div className="w-full bg-gray-900 h-2">
                                  <div className="bg-apf-purple h-2" style={{ width: '28%' }}></div>
                              </div>
                               <div className="flex items-center justify-between mt-2">
                                  <span className="font-vt323 text-white uppercase text-sm">Quartermaster's (Logistics)</span>
                                  <span className="font-vt323 text-apf-emerald font-bold">19%</span>
                              </div>
                              <div className="w-full bg-gray-900 h-2">
                                  <div className="bg-apf-emerald h-2" style={{ width: '19%' }}></div>
                              </div>
                               <div className="flex items-center justify-between mt-2">
                                  <span className="font-vt323 text-white uppercase text-sm">Navigator's Guild (Agitprop)</span>
                                  <span className="font-vt323 text-apf-purple font-bold">11%</span>
                              </div>
                              <div className="w-full bg-gray-900 h-2">
                                  <div className="bg-apf-purple h-2" style={{ width: '11%' }}></div>
                              </div>
                              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                                  <span className="font-vt323 text-apf-purpleLight uppercase tracking-widest text-sm flex items-center gap-2">
                                      <SafeIcon name="Heart" className="h-4 w-4" /> Social Stability
                                  </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                  <span className="font-vt323 text-white uppercase text-xs">Labor Union Density Tracking</span>
                                  <span className="font-vt323 text-apf-emerald font-bold">82%</span>
                              </div>
                              <div className="w-full bg-gray-900 h-1 mb-2">
                                  <div className="bg-apf-emerald h-1" style={{ width: '82%' }}></div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                  <span className="font-vt323 text-white uppercase text-xs">Resource Security Index</span>
                                  <span className="font-vt323 text-apf-purple font-bold">91%</span>
                              </div>
                              <div className="w-full bg-gray-900 h-1 mb-2">
                                  <div className="bg-apf-purple h-1" style={{ width: '91%' }}></div>
                              </div>
                          </div>
                      </div>
                  </div>

                   {/* Consensus Velocity */}
                   <div className="lg:col-span-1 bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-6 neon-grid relative overflow-hidden group">
                       <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                       <div className="relative z-10 flex flex-col h-full">
                          <h3 className="font-vt323 text-xl text-apf-purpleLight uppercase tracking-widest mb-6 flex items-center gap-2">
                              <SafeIcon name="TrendingUp" className="h-5 w-5" /> Consensus Velocity
                          </h3>
                          <div className="flex-grow flex items-end justify-between gap-2 h-32 pt-4">
                               {/* Simulated Bar Chart */}
                               {[40, 65, 30, 80, 55, 90, 75].map((height, i) => (
                                   <motion.div
                                      key={i}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${height}%` }}
                                      transition={{ duration: 1, delay: i * 0.1 }}
                                      className="w-full bg-apf-purple/80 hover:bg-apf-emerald transition-colors"
                                      title={`Policy Authorizations: ${height}`}
                                   />
                               ))}
                          </div>
                          <div className="mt-4 text-center font-vt323 text-gray-500 text-xs uppercase tracking-widest border-t border-gray-800 pt-2">
                              Policy Authorizations / 7 Days
                          </div>
                       </div>
                   </div>

                    {/* Readiness Score */}
                    <div className="lg:col-span-1 bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-6 neon-grid relative overflow-hidden flex flex-col justify-center items-center text-center">
                        <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                        <div className="relative z-10">
                            <SafeIcon name="Shield" className="h-12 w-12 text-apf-emerald mx-auto mb-4 animate-pulse" />
                            <div className="text-6xl font-black text-white font-cinzel mb-2">94<span className="text-3xl text-apf-emerald">%</span></div>
                            <div className="font-vt323 text-apf-purple uppercase tracking-[0.2em] text-sm">Fleet Readiness Index</div>
                            <div className="mt-4 text-xs text-gray-500 font-vt323 uppercase">Status: Optimal</div>
                        </div>
                    </div>
              </div>

              {/* Node Heatmap Placeholder */}
              <div className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-8 relative overflow-hidden">
                 <div className="absolute inset-0 neon-grid opacity-30 z-0 pointer-events-none" />
                 <div className="relative z-10">
                      <h3 className="font-vt323 text-2xl text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                          <SafeIcon name="Map" className="h-6 w-6 text-apf-purple" /> Active Synchronization Clusters
                      </h3>
                      <div className="h-64 border border-gray-800/50 bg-black/50 relative overflow-hidden flex items-center justify-center">
                         <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-10" />
                         {/* Stylized Abstract SVG Map Placeholder */}
                         <svg viewBox="0 0 800 400" className="w-full h-full opacity-60">
                            <path d="M100,100 Q150,50 200,150 T300,100 T400,200 T500,150 T600,250 T700,100" fill="none" stroke="#9400FF" strokeWidth="2" className="opacity-50" />
                            <path d="M50,200 Q100,100 250,250 T450,150 T650,300" fill="none" stroke="#10B981" strokeWidth="1" className="opacity-30" />

                            {/* Heatmap Nodes */}
                            <circle cx="200" cy="150" r="15" fill="#10B981" className="animate-pulse opacity-80" />
                            <circle cx="400" cy="200" r="25" fill="#9400FF" className="animate-ping opacity-40" />
                            <circle cx="400" cy="200" r="10" fill="#9400FF" className="opacity-90" />
                            <circle cx="600" cy="250" r="18" fill="#10B981" className="animate-pulse opacity-70" />
                            <circle cx="300" cy="100" r="8" fill="#9400FF" className="opacity-60" />
                            <circle cx="700" cy="100" r="12" fill="#10B981" className="opacity-50" />
                            <circle cx="250" cy="250" r="20" fill="#9400FF" className="animate-pulse opacity-60" />
                         </svg>
                         <div className="absolute bottom-4 right-4 font-vt323 text-xs text-gray-500 uppercase pointer-events-none">
                             [ LIVE TELEMETRY FEED ]
                         </div>
                      </div>
                 </div>
              </div>


              {/* Terminal Feed */}
              <div className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-6 relative overflow-hidden">
                 <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                 <div className="relative z-10">
                     <h4 className="font-vt323 text-apf-purpleLight uppercase tracking-widest text-sm mb-4 border-b border-gray-800 pb-2">
                         [ RESOLVED_NODE_CONNECTIONS ]
                     </h4>
                     <div className="font-vt323 text-gray-400 text-xs flex flex-col gap-1 h-24 overflow-hidden">
                         {nodes.map((node, i) => (
                             <motion.div
                                 key={node + i}
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 className="flex gap-4"
                             >
                                 <span className="text-gray-600">{new Date().toISOString().split('T')[1].substring(0,8)}</span>
                                 <span className="text-apf-emerald">NODE_SYNC</span>
                                 <span className="truncate">{node} connected to consensus cluster</span>
                             </motion.div>
                         ))}
                     </div>
                 </div>
              </div>
          </section>

          {/* Section 2: Fleet Transmissions (Bridge Dispatches) */}
          <section className="space-y-8 bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white border-b-2 border-apf-purple/50 pb-2 flex items-center gap-3">
                 <SafeIcon name="Terminal" className="text-apf-purple h-8 w-8" /> Fleet Transmissions
              </h2>

              {loading ? (
                <div className="py-12 flex justify-center text-apf-purple font-mono bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-8">
                  <SafeIcon name="Loader" className="animate-spin mr-2 h-8 w-8" />
                  SYNCING ARCHIVES...
                </div>
              ) : error || !posts ? (
                <div className="py-12 flex justify-center bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 p-8">
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
                        className="bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500 overflow-hidden group flex flex-col"
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
                <div className="mt-12 p-8 text-center bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl hover:border-apf-purple/40 transition-all duration-500">
                   <button className="text-apf-purple hover:text-white font-mono text-xs uppercase tracking-widest border border-apf-purple/50 px-6 py-3 hover:bg-apf-purple/10 transition-colors">
                     Load Older Transmissions
                   </button>
                </div>
              )}
          </section>

        </div>
      </PageTransition>
    </Layout>
  );
}
