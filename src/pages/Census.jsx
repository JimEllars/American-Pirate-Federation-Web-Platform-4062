import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';

export function Census() {
  return (
    <Layout>
      <SEO title="Fleet Census | Pirate Federation" description="Organizational health and readiness of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[calc(100vh-64px)] flex flex-col relative z-10">
          <div className="mb-12">
             <div className="flex items-center gap-4 mb-6">
                <SafeIcon name="Activity" className="h-10 w-10 text-apf-purple" />
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
                  Fleet Census
                </h1>
              </div>
              <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
                Real-time organizational telemetry and federation readiness metrics.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Member Distribution (Skills) */}
              <div className="bg-black/60 border border-apf-purple/50 p-6 neon-grid relative overflow-hidden group">
                  <div className="absolute inset-0 scanlines opacity-50 z-0" />
                  <div className="relative z-10">
                      <h3 className="font-vt323 text-xl text-apf-emerald uppercase tracking-widest mb-6 flex items-center gap-2">
                          <SafeIcon name="Users" className="h-5 w-5" /> Active Personnel
                      </h3>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between">
                              <span className="font-vt323 text-white uppercase text-sm">Shipwright's Guild (Code)</span>
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
                              <span className="font-vt323 text-white uppercase text-xs">Labor Solidarity</span>
                              <span className="font-vt323 text-apf-emerald font-bold">82%</span>
                          </div>
                          <div className="w-full bg-gray-900 h-1 mb-2">
                              <div className="bg-apf-emerald h-1" style={{ width: '82%' }}></div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                              <span className="font-vt323 text-white uppercase text-xs">Resource Security</span>
                              <span className="font-vt323 text-apf-purple font-bold">91%</span>
                          </div>
                          <div className="w-full bg-gray-900 h-1 mb-2">
                              <div className="bg-apf-purple h-1" style={{ width: '91%' }}></div>
                          </div>


                      </div>
                  </div>
              </div>

               {/* Consensus Velocity */}
               <div className="bg-black/60 border border-apf-purple/50 p-6 neon-grid relative overflow-hidden group">
                   <div className="absolute inset-0 scanlines opacity-50 z-0" />
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
                <div className="bg-black/60 border border-apf-purple/50 p-6 neon-grid relative overflow-hidden flex flex-col justify-center items-center text-center">
                    <div className="absolute inset-0 scanlines opacity-50 z-0" />
                    <div className="relative z-10">
                        <SafeIcon name="Shield" className="h-12 w-12 text-apf-emerald mx-auto mb-4 animate-pulse" />
                        <div className="text-6xl font-black text-white font-cinzel mb-2">94<span className="text-3xl text-apf-emerald">%</span></div>
                        <div className="font-vt323 text-apf-purple uppercase tracking-[0.2em] text-sm">Fleet Readiness Index</div>
                        <div className="mt-4 text-xs text-gray-500 font-vt323 uppercase">Status: Optimal</div>
                    </div>
                </div>
          </div>

          {/* Node Heatmap Placeholder */}
          <div className="bg-black/80 border border-gray-800 p-8 relative overflow-hidden">
             <div className="absolute inset-0 neon-grid opacity-30 z-0" />
             <div className="relative z-10">
                  <h3 className="font-vt323 text-2xl text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <SafeIcon name="Map" className="h-6 w-6 text-apf-purple" /> Active Synchronization Clusters
                  </h3>
                  <div className="h-64 border border-gray-800/50 bg-black/50 relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 scanlines opacity-50 z-10 pointer-events-none" />
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
                     <div className="absolute bottom-4 right-4 font-vt323 text-xs text-gray-500 uppercase">
                         [ LIVE TELEMETRY FEED ]
                     </div>
                  </div>
             </div>
          </div>

        </div>
      </PageTransition>
    </Layout>
  );
}
