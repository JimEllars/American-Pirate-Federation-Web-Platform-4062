import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { motion } from 'framer-motion';
import { usePirateIntel } from '../hooks/usePirateIntel';
import DOMPurify from 'isomorphic-dompurify';

export function TransmissionHub() {
  // Mocking audio feed with WP posts for now (e.g. category podcast)
  // In a real scenario, this would parse an RSS feed or query a specific podcast endpoint
  const { data: episodes, loading, error } = usePirateIntel('posts?_embed&per_page=5');
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (episode) => {
    if (activeEpisode?.id === episode.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveEpisode(episode);
      setIsPlaying(true);
    }
  };

  return (
    <Layout>
      <SEO title="The Signal | Direct Transmissions" description="Direct Transmissions from the Bridge. The official APF podcast." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Radio" className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                The Signal
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg border-l-2 border-apf-purple pl-6">
              Direct Transmissions from the Bridge. Unfiltered tactical analysis and federation updates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Audio Player Panel */}
            <div className="lg:col-span-1">
               <div className="sticky top-24 bg-black/60 border border-apf-purple/30 p-6 backdrop-blur-md">
                 <div className="mb-6 border-b border-gray-800 pb-4">
                    <span className="font-vt323 text-xs uppercase text-apf-purple tracking-widest block mb-2">Current Frequency</span>
                    <h3 className="text-xl font-bold text-white line-clamp-2">
                       {activeEpisode ? (
                          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeEpisode.title.rendered) }} />
                       ) : "TUNING..."}
                    </h3>
                 </div>

                 {/* Custom Audio Visualizer (SVG) */}
                 <div className="h-24 w-full bg-gray-900 mb-6 flex items-end justify-center gap-1 overflow-hidden relative">
                    {!activeEpisode && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-gray-600">AWAITING_SIGNAL</span>}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 bg-apf-purple"
                        animate={isPlaying && activeEpisode ? {
                          height: [`${Math.random() * 20 + 10}%`, `${Math.random() * 80 + 20}%`, `${Math.random() * 20 + 10}%`]
                        } : { height: '10%' }}
                        transition={{
                          duration: Math.random() * 0.5 + 0.3,
                          repeat: Infinity,
                          repeatType: "mirror"
                        }}
                      />
                    ))}
                 </div>

                 {/* Player Controls */}
                 <div className="flex items-center justify-between mt-4">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon name="SkipBack" />
                    </button>
                    <button
                      onClick={() => activeEpisode && togglePlay(activeEpisode)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        activeEpisode ? 'bg-apf-purple hover:bg-apf-purpleLight text-white cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!activeEpisode}
                    >
                      <SafeIcon name={isPlaying ? "Pause" : "Play"} className="h-6 w-6 ml-1" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon name="SkipForward" />
                    </button>
                 </div>

                 {activeEpisode && (
                   <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                     <span className="font-vt323 text-xs text-apf-purple animate-pulse">BROADCASTING_LIVE</span>
                   </div>
                 )}
               </div>
            </div>

            {/* Episode List */}
            <div className="lg:col-span-2 space-y-6">
               <h2 className="font-vt323 text-2xl text-white uppercase tracking-widest border-b border-white/10 pb-2">Transmission Logs</h2>

               {loading ? (
                  <div className="py-12 flex items-center text-apf-purple font-mono">
                    <SafeIcon name="Loader" className="animate-spin mr-2 h-5 w-5" />
                    SCANNING FREQUENCIES...
                  </div>
               ) : error || !episodes ? (
                  <div className="py-12 text-red-500 font-mono">
                     [COMM_LINK_DOWN]
                  </div>
               ) : (
                  episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className={`p-6 border transition-all cursor-pointer ${
                        activeEpisode?.id === episode.id ? 'border-apf-purple bg-apf-purple/5' : 'border-gray-800 bg-black/40 hover:border-apf-purple/50'
                      }`}
                      onClick={() => togglePlay(episode)}
                    >
                       <div className="flex justify-between items-start mb-2">
                         <span className="font-vt323 text-apf-purple text-sm">EP_{episode.id} // {new Date(episode.date).toLocaleDateString()}</span>
                         {activeEpisode?.id === episode.id && isPlaying && (
                            <SafeIcon name="Volume2" className="text-apf-purple h-4 w-4 animate-pulse" />
                         )}
                       </div>
                       <h3
                         className="text-xl font-bold text-white mb-3"
                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.title.rendered) }}
                       />
                       <div
                        className="prose prose-invert prose-sm text-gray-400 line-clamp-2 font-mono"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.excerpt.rendered) }}
                      />
                    </div>
                  ))
               )}
            </div>

          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
