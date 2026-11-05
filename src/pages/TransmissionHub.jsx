import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { usePirateIntel } from '../hooks/usePirateIntel';
import { useAXiMHydration } from '../hooks/useAXiMHydration';
import DOMPurify from 'isomorphic-dompurify';

/**
 * The Signal — `/podcast`.
 *
 * Architectural Law 1 applies to transport controls as much as to numbers. This page used
 * to set `isPlaying` on any card click and then render "BROADCASTING_LIVE" over an animated
 * 40-bar equaliser, whether or not an audio file existed — and for every dispatch published
 * through the headless CMS, none does (WP posts carry no audio field, and `transmissions`
 * is empty). A visitor pressed play, watched a visualiser move, heard silence, and was told
 * a broadcast was live. That is the same theatre the ticker and readiness index were
 * removed for.
 *
 * The rules now:
 *   - a dispatch is playable only when it has a resolvable audio source;
 *   - with no source, the card opens the transcript and the player says NO AUDIO PUBLISHED;
 *   - the equaliser animates only while an audio element actually holds a source;
 *   - every metadata field rendered comes from the row, never from a default string.
 */

/**
 * Resolve a real audio source for an episode, from either backend.
 *
 * The Supabase row mapper returns `audioUrl` (from the `transmissions.audio_url` column);
 * this page previously read `episode.audio_url`, so a transmission with a recording would
 * still have played nothing. WordPress exposes a recording, when one exists, as the
 * `audio_url` custom field. Anything else — a bare post — has no audio at all.
 */
const audioSourceFor = (episode) => {
  if (!episode) return null;
  const candidates = [
    episode.audioUrl,
    episode.audio_url,
    episode.custom_fields?.audio_url?.[0],
    episode.custom_fields?.audioUrl?.[0]
  ];
  const found = candidates.find((value) => typeof value === 'string' && value.trim() !== '');
  return found ? found.trim() : null;
};

const formatPublished = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

export function TransmissionHub() {
  const { data: wpEpisodes, loading: wpLoading, error: wpError } = usePirateIntel('posts?_embed&per_page=5');
  const { fetchSecureTransmissions } = useAXiMHydration();

  const [activeEpisode, setActiveEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [secureTransmissions, setSecureTransmissions] = useState([]);
  const [transmissionsLoading, setTransmissionsLoading] = useState(true);
  const [playbackNotice, setPlaybackNotice] = useState(null);

  const audioRef = useRef(null);
  const glitchTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadTransmissions = async () => {
      try {
        const data = await fetchSecureTransmissions();
        if (isMounted && data) {
          setSecureTransmissions(data);
        }
      } catch (err) {
        // console.error('[ TRANSMISSION FETCH ERROR ]', err);
      } finally {
        if (isMounted) {
          setTransmissionsLoading(false);
        }
      }
    };

    loadTransmissions();

    return () => { isMounted = false; };
  }, [fetchSecureTransmissions]);

  // Audio Garbage Collection
  useEffect(() => {
    return () => {
      // Cleanup any active audio object
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setIsPlaying(false);

      // Clear glitch timeouts
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
      }
    };
  }, []);

  const activeAudio = audioSourceFor(activeEpisode);

  const togglePlay = (episode) => {
    const source = audioSourceFor(episode);

    // No recording exists. Open the dispatch, say so, and leave the transport stopped.
    if (!source) {
      setPlaybackNotice('[ NO AUDIO PUBLISHED FOR THIS DISPATCH — THE TRANSCRIPT BELOW IS THE RECORD ]');
      setActiveEpisode(episode);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      return;
    }

    setPlaybackNotice(null);

    if (activeEpisode?.id === episode.id) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      if (newIsPlaying) {
        audioRef.current?.play().catch(() => {
          setIsPlaying(false);
          setPlaybackNotice('[ PLAYBACK BLOCKED BY THIS BROWSER — PRESS PLAY AGAIN TO RETRY ]');
        });
      } else {
        audioRef.current?.pause();
      }
    } else {
      setIsGlitching(true);
      glitchTimeoutRef.current = setTimeout(() => {
        setActiveEpisode(episode);
        setIsGlitching(false);
        if (audioRef.current) {
          audioRef.current.src = source;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              // The element holds a real source but the browser refused to start it.
              // Do not leave the UI asserting a broadcast that is not happening.
              setIsPlaying(false);
              setPlaybackNotice('[ PLAYBACK BLOCKED BY THIS BROWSER — PRESS PLAY AGAIN TO RETRY ]');
            });
        } else {
          setIsPlaying(false);
        }
      }, 300); // 300ms glitch duration
    }
  };

  // `classification` is a column the row actually carries (migration 20261024000000,
  // DEFAULT 'PUBLIC'). The page used to stamp every Supabase row `isSecure: true` and print
  // SECURE_TRANSMISSION — an encryption claim nothing had checked, on a table with no
  // encryption metadata. The label now comes from the published field, or from the id when
  // there is none (CMS posts).
  const episodeLabel = (episode) =>
    episode.classification
      ? `${String(episode.classification).toUpperCase()}_TRANSMISSION`
      : `DISPATCH_${String(episode.id).slice(0, 8)}`;

  const episodes = [
    ...secureTransmissions.map((t) => ({
      ...t,
      title: { rendered: t.title },
      // `transmissions` has no body column. `summary` is the whole published record, so it
      // is both the excerpt and the transcript — no invented "Decrypting payload..." text.
      excerpt: { rendered: t.summary || '' },
      content: { rendered: t.summary || '' },
      // The mapper returns `publishedAt`; the page used to read `t.date` and fall back to
      // `new Date()`, which stamped every transmission with the day it was read.
      date: t.publishedAt || null
    })),
    ...(wpEpisodes || [])
  ];

  const loading = wpLoading && transmissionsLoading;
  // "Nothing published" and "the wire is down" are different facts and this page used to
  // print the same red [COMM_LINK_DOWN] for both.
  const hasError = Boolean(wpError) && secureTransmissions.length === 0;
  const isEmpty = !loading && !hasError && episodes.length === 0;

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
            <p className="max-w-2xl mt-4 text-gray-500 font-vt323 text-sm uppercase tracking-widest">
              [ Audio is published only where a recording exists. Everything else is a written dispatch. ]
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Audio Player Panel */}
            <div className="lg:col-span-1">
               <div className={`sticky top-24 bg-black/60 backdrop-blur-2xl border ${isPlaying ? 'border-apf-purple shadow-[0_0_30px_rgba(148,0,255,0.3)]' : 'border-white/5 shadow-2xl hover:border-apf-purple/40'} p-6 transition-all duration-500 ${isGlitching ? 'glitch-hover animate-pulse grayscale opacity-50' : ''}`}>
                 <div className="mb-6 border-b border-gray-800 pb-4 relative min-h-[80px]">
                    <span className="font-vt323 text-xs uppercase text-apf-purple tracking-widest block mb-2">On The Player</span>
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
                         ) : "NOTHING SELECTED"}
                      </motion.h3>
                    </AnimatePresence>
                    {activeEpisode && (
                      <span className="mt-2 block font-vt323 text-[11px] uppercase tracking-widest text-gray-500">
                        {formatPublished(activeEpisode.date) || 'Publication date not recorded'}
                      </span>
                    )}
                 </div>

                 {/* Hidden Audio Element. A source is only ever assigned when one exists. */}
                 <audio
                   ref={audioRef}
                   onEnded={() => setIsPlaying(false)}
                   onError={() => {
                     // A source that will not load must not leave the player claiming to
                     // broadcast. Stop, and say what happened.
                     setIsPlaying(false);
                     setPlaybackNotice('[ THIS RECORDING COULD NOT BE LOADED FROM ITS SOURCE ]');
                   }}
                 />

                 {/* Audio Visualizer (SVG). Dormant unless audio is actually playing. */}
                 <div className="h-24 w-full bg-gray-900 mb-6 flex items-end justify-center gap-[2px] overflow-hidden relative border border-gray-800 p-2">
                    {!activeEpisode && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-gray-600">AWAITING_SIGNAL</span>}
                    {activeEpisode && !activeAudio && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-amber-500 text-sm uppercase tracking-widest">NO AUDIO PUBLISHED</span>}
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-full ${isPlaying && activeAudio ? 'bg-apf-purple shadow-[0_0_5px_rgba(148,0,255,0.8)]' : 'bg-gray-700'}`}
                        animate={(isPlaying && activeAudio) || isGlitching ? {
                          height: [`${0.5 * 20 + 10}%`, `${0.5 * 80 + 20}%`, `${0.5 * 20 + 10}%`],
                          opacity: [0.5, 1, 0.5]
                        } : { height: '5%', opacity: 0.3 }}
                        transition={{
                          duration: isGlitching ? 0.1 : 0.5 * 0.4 + 0.2,
                          repeat: Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                 </div>

                 {/* Meta Info — only fields the record actually carries. */}
                 {activeEpisode && (
                   <div className="mb-6 space-y-2 border-b border-gray-800 pb-4">
                     {activeEpisode.classification && (
                       <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                         <span>Classification:</span>
                         <span className="text-apf-emerald">{activeEpisode.classification}</span>
                       </div>
                     )}
                     <div className="flex justify-between font-vt323 text-xs text-gray-500 uppercase">
                       <span>Format:</span>
                       <span className="text-white">{activeAudio ? 'AUDIO' : 'WRITTEN'}</span>
                     </div>
                   </div>
                 )}

                 {/* Transport */}
                 <div className="flex items-center justify-center mt-4">
                    <button
                      type="button"
                      onClick={() => activeEpisode && togglePlay(activeEpisode)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        activeAudio ? 'bg-apf-purple hover:bg-apf-purpleLight text-white cursor-pointer shadow-[0_0_15px_rgba(148,0,255,0.5)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!activeAudio || isGlitching}
                      aria-label={activeAudio ? (isPlaying ? 'Pause recording' : 'Play recording') : 'No recording available'}
                    >
                      <SafeIcon name={isPlaying ? "Pause" : "Play"} className="h-6 w-6 ml-1" />
                    </button>
                 </div>

                 {activeEpisode && (
                   <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                     <span className={`font-vt323 text-xs uppercase tracking-[0.2em] ${isPlaying && activeAudio ? 'text-apf-emerald animate-pulse' : 'text-gray-500'}`}>
                       {!activeAudio ? 'NO_RECORDING' : isPlaying ? 'TRANSMITTING' : 'SIGNAL_PAUSED'}
                     </span>
                   </div>
                 )}

                 {playbackNotice && (
                   <div role="status" className="mt-4 border border-amber-500/40 bg-amber-500/5 p-3 font-vt323 text-[11px] leading-relaxed text-amber-400 uppercase tracking-wider">
                     {playbackNotice}
                   </div>
                 )}
               </div>
            </div>

            {/* Episode List */}
            <div className="lg:col-span-2 space-y-6">
               <h2 className="font-vt323 text-2xl text-white uppercase tracking-widest border-b border-white/10 pb-2 flex justify-between items-center">
                  <span>Assembly Records</span>
                  {hasError && <span className="text-red-500 text-sm animate-pulse">[ COMM_LINK_DOWN ]</span>}
               </h2>

               {loading ? (
                  <div className="py-12 flex items-center text-apf-purple font-vt323">
                    <SafeIcon name="Loader" className="animate-spin mr-2 h-5 w-5" />
                    SCANNING FREQUENCIES...
                  </div>
               ) : hasError ? (
                  <div className="py-12 text-red-500 font-vt323">
                     [COMM_LINK_DOWN]
                  </div>
               ) : isEmpty ? (
                  <div className="py-12 px-6 text-center border border-dashed border-gray-800 bg-black/40">
                    <div className="font-vt323 text-apf-purple text-lg uppercase tracking-widest mb-2">[ NO ASSEMBLY RECORDS PUBLISHED ]</div>
                    <p className="font-sans text-sm text-gray-500 max-w-md mx-auto">
                      The Federation has not published a dispatch or a recording yet. This page
                      stays empty until one exists.
                    </p>
                  </div>
               ) : (
                  episodes.map((episode) => {
                    const recorded = audioSourceFor(episode);
                    const isActive = activeEpisode?.id === episode.id;
                    try {
                        const title = episode?.title?.rendered ?? "UNTITLED";
                        const excerpt = episode?.excerpt?.rendered ?? "";
                        const content = episode?.content?.rendered ?? "";
                        const published = formatPublished(episode.date);
                        return (
                        <div
                          key={episode.id}
                          data-testid="assembly-record"
                          data-audio={recorded ? 'true' : 'false'}
                          className={`p-6 border transition-all duration-500 shadow-2xl backdrop-blur-2xl ${isActive ? 'border-apf-purple bg-apf-purple/10' : 'bg-black/60 border-white/5 hover:border-apf-purple/40'} ${episode.classification ? 'border-apf-emerald/50' : ''}`}
                          onClick={() => togglePlay(episode)}
                        >
                           <div className="flex justify-between items-start mb-2 gap-4">
                             <span className={`font-vt323 text-sm ${episode.classification ? 'text-apf-emerald' : 'text-apf-purple'}`}>
                               {episodeLabel(episode)}
                               {published ? ` // ${published}` : ''}
                             </span>
                             <span className={`font-vt323 text-[11px] uppercase tracking-widest shrink-0 ${recorded ? 'text-apf-emerald' : 'text-gray-500'}`}>
                               {recorded ? 'RECORDED' : 'WRITTEN'}
                             </span>
                             {isActive && isPlaying && recorded && (
                                <SafeIcon name="Volume2" className={`${episode.classification ? 'text-apf-emerald' : 'text-apf-purple'} h-4 w-4 animate-pulse`} />
                             )}
                           </div>
                           <h3
                             className="text-xl font-bold text-white mb-3"
                             dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
                           />

                           {/* Full Transcript Area */}
                           {isActive ? (
                             <div className="mt-4 border-t border-apf-purple/30 pt-4">
                               <h4 className={`font-vt323 text-sm uppercase tracking-widest mb-4 flex items-center gap-2 ${episode.classification ? 'text-apf-emerald' : 'text-apf-purpleLight'}`}>
                                 <SafeIcon name="FileText" className="h-4 w-4" /> {recorded ? 'Bridge Transcript' : 'Written Dispatch'}
                               </h4>
                               <div
                                 className="prose prose-invert max-w-none text-gray-300 font-sans text-sm bg-black/50 p-4 border border-gray-800/50 max-h-96 overflow-y-auto custom-scrollbar"
                                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                               />
                             </div>
                           ) : (
                             <div
                              className="prose prose-invert prose-sm text-gray-400 line-clamp-2 font-sans mb-4"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(excerpt) }}
                             />
                           )}

                          <div className="flex gap-4 font-vt323 text-xs text-gray-500 border-t border-gray-800/50 pt-4 mt-4">
                             <span>{recorded ? 'RECORDING AVAILABLE' : 'NO RECORDING'}</span>
                             {published && <span className="ml-auto">{published}</span>}
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div key={episode.id} className="text-gray-500 font-vt323 border border-red-900 bg-red-900/10 p-4">
                          [ CORRUPTED PACKET: BROADCAST SIGNATURE INTEGRITY COMPROMISED ]
                        </div>
                      );
                    }
                  })

               )}
            </div>

          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
