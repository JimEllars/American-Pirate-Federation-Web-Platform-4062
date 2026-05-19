import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../hooks/usePirateIntel';
import DOMPurify from 'isomorphic-dompurify';

export function TransmissionHub() {
  const { data: episodes, loading, error } = usePirateIntel('posts?_embed&per_page=5');
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  const togglePlay = (episode) => {
    if (activeEpisode?.id === episode.id) {
      setIsPlaying(!isPlaying);
    } else {
      setIsGlitching(true);
      setTimeout(() => {
        setActiveEpisode(episode);
        setIsPlaying(true);
        setIsGlitching(false);
      }, 300); // 300ms glitch duration
    }
  };

  const getMetadata = (episode) => {
    const author = episode._embedded?.author?.[0]?.name || "Anonymous Deckhand";
    const duration = Math.floor(Math.random() * 40 + 20) + ":" + Math.floor(Math.random() * 60).toString().padStart(2, '0');

    // Map all dispatches to the new Articles (XI-XX)
    const newArticles = [
      "Article XI: The Right to Shelter",
      "Article XII: Sovereign Sustenance",
      "Article XIII: Innovation Beyond Extraction",
      "Article XIV: Equitable Contribution",
      "Article XV: The Strength of the Union",
      "Article XVI: Liberation Through Learning",
      "Article XVII: Temporal Limits of Authority",
      "Article XVIII: Generational Stewardship",
      "Article XIX: Public Domain Infrastructure",
      "Article XX: Restriction of Corporate Reign"
    ];

    // Use episode.id to deterministically pick one of the new articles
    const correlation = newArticles[episode.id % 10];

    return { author, duration, correlation };
  };

  return (
    <Layout>
      <SEO title="The Signal | Assembly Records" description="Bridge Dispatches and Assembly Records of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Radio" className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
                The Signal
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-vt323 text-lg border-l-2 border-apf-purple pl-6">
              Bridge Dispatches from the core. Unfiltered tactical analysis and federation updates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Audio Player Panel */}
            <div className="lg:col-span-1">
               <div className={`sticky top-24 bg-black/60 border ${isPlaying ? 'border-apf-purple shadow-[0_0_30px_rgba(148,0,255,0.3)]' : 'border-apf-purple/30'} p-6 backdrop-blur-md transition-all duration-500 ${isGlitching ? 'glitch-hover animate-pulse grayscale opacity-50' : ''}`}>
                 <div className="mb-6 border-b border-gray-800 pb-4 relative min-h-[80px]">
                    <span className="font-vt323 text-xs uppercase text-apf-purple tracking-widest block mb-2">Current Frequency</span>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={activeEpisode ? activeEpisode.id : 'empty'}
                        initial={{ opacity: 0, x: isGlitching ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isGlitching ? 10 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-xl font-bold text-white line-clamp-2"
                      >
                         {activeEpisode ? (
                            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeEpisode.title.rendered) }} />
                         ) : "TUNING..."}
                      </motion.h3>
                    </AnimatePresence>
                 </div>

                 {/* Custom Audio Visualizer (SVG) */}
                 <div className="h-24 w-full bg-gray-900 mb-6 flex items-end justify-center gap-[2px] overflow-hidden relative border border-gray-800 p-2">
                    {!activeEpisode && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-gray-600">AWAITING_SIGNAL</span>}
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-full ${isPlaying ? 'bg-apf-purple shadow-[0_0_5px_rgba(148,0,255,0.8)]' : 'bg-gray-700'}`}
                        animate={(isPlaying && activeEpisode) || isGlitching ? {
                          height: [`${Math.random() * 20 + 10}%`, `${Math.random() * 80 + 20}%`, `${Math.random() * 20 + 10}%`],
                          opacity: [0.5, 1, 0.5]
                        } : { height: '5%', opacity: 0.3 }}
                        transition={{
                          duration: isGlitching ? 0.1 : Math.random() * 0.4 + 0.2,
                          repeat: Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                 </div>

                 {/* Meta Info */}
                 {activeEpisode && (
                   <div className="mb-6 space-y-2 border-b border-gray-800 pb-4">
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Op. Lead:</span>
                       <span className="text-apf-purpleLight">{getMetadata(activeEpisode).author}</span>
                     </div>
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Duration:</span>
                       <span className="text-white">{getMetadata(activeEpisode).duration}</span>
                     </div>
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Correlation:</span>
                       <span className="text-apf-purpleLight">{getMetadata(activeEpisode).correlation}</span>
                     </div>
                   </div>
                 )}

                 {/* Player Controls */}
                 <div className="flex items-center justify-between mt-4">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon name="SkipBack" />
                    </button>
                    <button
                      onClick={() => activeEpisode && togglePlay(activeEpisode)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        activeEpisode ? 'bg-apf-purple hover:bg-apf-purpleLight text-white cursor-pointer shadow-[0_0_15px_rgba(148,0,255,0.5)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!activeEpisode || isGlitching}
                    >
                      <SafeIcon name={isPlaying ? "Pause" : "Play"} className="h-6 w-6 ml-1" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <SafeIcon name="SkipForward" />
                    </button>
                 </div>

                 {activeEpisode && (
                   <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                     <span className={`font-vt323 text-xs uppercase tracking-[0.2em] ${isPlaying ? 'text-apf-emerald animate-pulse' : 'text-gray-500'}`}>
                       {isPlaying ? 'BROADCASTING_LIVE' : 'SIGNAL_PAUSED'}
                     </span>
                   </div>
                 )}
               </div>
            </div>

            {/* Episode List */}
            <div className="lg:col-span-2 space-y-6">
               <h2 className="font-vt323 text-2xl text-white uppercase tracking-widest border-b border-white/10 pb-2">Assembly Records</h2>

               {loading ? (
                  <div className="py-12 flex items-center text-apf-purple font-vt323">
                    <SafeIcon name="Loader" className="animate-spin mr-2 h-5 w-5" />
                    SCANNING FREQUENCIES...
                  </div>
               ) : error || !episodes ? (
                  <div className="py-12 text-red-500 font-vt323">
                     [COMM_LINK_DOWN]
                  </div>
               ) : (
                  episodes.map((episode) => {
                    const meta = getMetadata(episode);
                    return (
                    <div
                      key={episode.id}
                      className={`p-6 border transition-all cursor-pointer ${
                        activeEpisode?.id === episode.id ? 'border-apf-purple bg-apf-purple/5' : 'border-gray-800 bg-black/60 hover:border-apf-purple/40'
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

                       {/* Full Transcript Area */}
                       {activeEpisode?.id === episode.id ? (
                         <div className="mt-4 border-t border-apf-purple/30 pt-4">
                           <h4 className="font-vt323 text-apf-purpleLight text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                             <SafeIcon name="FileText" className="h-4 w-4" /> Bridge Transcript
                           </h4>
                           <div
                             className="prose prose-invert max-w-none text-gray-300 font-sans text-sm bg-black/50 p-4 border border-gray-800/50 max-h-96 overflow-y-auto custom-scrollbar"
                             dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.content.rendered) }}
                           />
                         </div>
                       ) : (
                         <div
                          className="prose prose-invert prose-sm text-gray-400 line-clamp-2 font-sans mb-4"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.excerpt.rendered) }}
                         />
                       )}

                      <div className="flex gap-4 font-vt323 text-xs text-gray-500 border-t border-gray-800/50 pt-4 mt-4">
                         <span>Op: {meta.author}</span>
                         <span>Len: {meta.duration}</span>
                         <span className="text-apf-purpleLight ml-auto">{meta.correlation}</span>
                      </div>
                    </div>
                  )})
               )}
            </div>

          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
