import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
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
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="Radio"
            kicker="The Signal"
            title="Transmissions"
            lede="Bridge dispatches and assembly records from the Federation. Audio is published only where a recording exists; everything else is a written dispatch."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Audio Player Panel */}
            <div className="lg:col-span-1">
               <div className={`apf-card sticky top-24 p-6 transition-colors ${isPlaying ? 'border-apf-purple/40' : 'hover:border-white/15'} ${isGlitching ? 'animate-pulse opacity-60' : ''}`}>
                 <div className="relative mb-5 min-h-[80px] border-b border-white/[0.06] pb-4">
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-ink-dim">Now on the player</span>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={activeEpisode ? activeEpisode.id : 'empty'}
                        initial={{ opacity: 0, x: isGlitching ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isGlitching ? 10 : -10 }}
                        transition={{ duration: 0.2 }}
                        className="line-clamp-2 text-lg font-semibold text-white"
                      >
                         {activeEpisode ? (
                            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeEpisode.title.rendered) }} />
                         ) : "NOTHING SELECTED"}
                      </motion.h3>
                    </AnimatePresence>
                    {activeEpisode && (
                      <span className="mt-2 block font-mono text-[11px] text-ink-dim">
                        {formatPublished(activeEpisode.date) || 'Publication date not recorded'}
                      </span>
                    )}
                 </div>

                 {/* Hidden Audio Element. A source is only ever assigned when one exists. */}
                 <audio
                   ref={audioRef}
                   onEnded={() => setIsPlaying(false)}
                   onError={() => {
                     // An <audio> element with no src fires `error` on mount. Only a source
                     // that was actually assigned can fail to load; otherwise the player
                     // would announce a broken recording before anything was selected.
                     if (!audioRef.current?.getAttribute('src')) return;
                     setIsPlaying(false);
                     setPlaybackNotice('[ THIS RECORDING COULD NOT BE LOADED FROM ITS SOURCE ]');
                   }}
                 />

                 {/* Audio Visualizer (SVG). Dormant unless audio is actually playing. */}
                 <div className="relative mb-5 flex h-24 w-full items-end justify-center gap-[2px] overflow-hidden rounded-xl border border-white/[0.06] bg-surface-950 p-2">
                    {!activeEpisode && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-gray-600">AWAITING_SIGNAL</span>}
                    {activeEpisode && !activeAudio && <span className="absolute inset-0 flex items-center justify-center font-vt323 text-amber-500 text-sm uppercase tracking-widest">NO AUDIO PUBLISHED</span>}
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-full rounded-full ${isPlaying && activeAudio ? 'bg-apf-purple' : 'bg-white/15'}`}
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
                   <div className="mb-5 space-y-2 border-b border-white/[0.06] pb-4">
                     {activeEpisode.classification && (
                       <div className="flex justify-between text-[11px] text-ink-dim">
                         <span>Classification:</span>
                         <span className="text-apf-emerald">{activeEpisode.classification}</span>
                       </div>
                     )}
                     <div className="flex justify-between text-[11px] text-ink-dim">
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
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                        activeAudio ? 'cursor-pointer bg-apf-purple text-white hover:bg-[#A21CE8]' : 'cursor-not-allowed bg-white/[0.05] text-ink-dim'
                      }`}
                      disabled={!activeAudio || isGlitching}
                      aria-label={activeAudio ? (isPlaying ? 'Pause recording' : 'Play recording') : 'No recording available'}
                    >
                      <SafeIcon name={isPlaying ? "Pause" : "Play"} className="h-6 w-6 ml-1" />
                    </button>
                 </div>

                 {activeEpisode && (
                   <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
                     <span className={`font-terminal text-[11px] uppercase tracking-[0.16em] ${isPlaying && activeAudio ? 'text-emerald-300' : 'text-ink-dim'}`}>
                       {!activeAudio ? 'NO_RECORDING' : isPlaying ? 'TRANSMITTING' : 'SIGNAL_PAUSED'}
                     </span>
                   </div>
                 )}

                 {playbackNotice && (
                   <div role="status" className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.05] p-3 text-xs leading-relaxed text-amber-200">
                     {playbackNotice}
                   </div>
                 )}
               </div>
            </div>

            {/* Episode List */}
            <div className="lg:col-span-2 space-y-6">
               <h2 className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-2xl font-semibold tracking-tight text-white">
                  <span>Assembly records</span>
                  {hasError && <span className="text-xs font-normal text-red-400">Link down</span>}
               </h2>

               {loading ? (
                  <div className="flex items-center gap-3 py-12 text-sm text-ink-muted">
                    <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
                    Loading records…
                  </div>
               ) : hasError ? (
                  <div className="py-12 text-sm text-red-400">
                     The CMS could not be reached.
                  </div>
               ) : isEmpty ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface-900/40 px-6 py-12 text-center">
                    <div className="mb-2 text-base font-medium text-white">No assembly records published</div>
                    <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-muted">
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
                          className={`apf-card cursor-pointer p-6 transition-colors ${isActive ? 'border-apf-purple/40 bg-apf-purple/[0.06]' : 'hover:border-white/15'}`}
                          onClick={() => togglePlay(episode)}
                        >
                           <div className="flex justify-between items-start mb-2 gap-4">
                             <span className={`font-mono text-[11px] uppercase tracking-[0.1em] ${episode.classification ? 'text-emerald-300' : 'text-apf-purpleLight'}`}>
                               {episodeLabel(episode)}
                               {published ? ` · ${published}` : ''}
                             </span>
                             <span className={`shrink-0 text-[10px] uppercase tracking-[0.1em] ${recorded ? 'text-emerald-300' : 'text-ink-dim'}`}>
                               {recorded ? 'RECORDED' : 'WRITTEN'}
                             </span>
                             {isActive && isPlaying && recorded && (
                                <SafeIcon name="Volume2" className={`${episode.classification ? 'text-apf-emerald' : 'text-apf-purple'} h-4 w-4 animate-pulse`} />
                             )}
                           </div>
                           <h3
                             className="mb-3 text-lg font-semibold leading-snug text-white"
                             dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
                           />

                           {/* Full Transcript Area */}
                           {isActive ? (
                             <div className="mt-4 border-t border-white/[0.06] pt-4">
                               <h4 className={`font-display text-sm tracking-tight mb-4 flex items-center gap-2 ${episode.classification ? 'text-apf-emerald' : 'text-apf-purpleLight'}`}>
                                 <SafeIcon name="FileText" className="h-4 w-4" /> {recorded ? 'Bridge Transcript' : 'Written Dispatch'}
                               </h4>
                               <div
                                 className="prose prose-invert max-h-96 max-w-none overflow-y-auto rounded-lg border border-white/[0.06] bg-surface-950/70 p-4 text-sm text-ink-muted"
                                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                               />
                             </div>
                           ) : (
                             <div
                              className="mb-4 line-clamp-2 text-sm leading-relaxed text-ink-muted"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(excerpt) }}
                             />
                           )}

                          <div className="mt-4 flex gap-4 border-t border-white/[0.06] pt-4 text-[11px] text-ink-dim">
                             <span>{recorded ? 'Recording available' : 'No recording'}</span>
                             {published && <span className="ml-auto">{published}</span>}
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div key={episode.id} className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-4 text-xs text-red-300">
                          This record could not be read. It is not being displayed as a broadcast.
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
