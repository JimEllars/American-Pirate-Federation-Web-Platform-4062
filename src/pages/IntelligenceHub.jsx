import React from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import DOMPurify from 'isomorphic-dompurify';
import { usePirateIntel } from '../hooks/usePirateIntel';
import { useAXiMHydration } from '../hooks/useAXiMHydration';
import { useState, useEffect } from 'react';
import { useAnalyzeFederationData } from '../hooks/usePirateAI';
import { logUnhandledRejection } from '../lib/api/telemetry';
import { formatTerminalDate } from '../lib/api/formatting';
import IntelFilterBar from '../components/ui/IntelFilterBar';
import TransmissionModal from '../components/ui/TransmissionModal';

export function IntelligenceHub() {
    const { data: wpPosts, loading: wpLoading, error: wpError } = usePirateIntel('posts?_embed&per_page=12');
  const { fetchIntelligenceFeeds } = useAXiMHydration();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts ? posts.filter(post => {
    const term = searchTerm.toLowerCase();
    const title = (post.title?.rendered || '').toLowerCase();
    const excerpt = (post.excerpt?.rendered || '').toLowerCase();
    return title.includes(term) || excerpt.includes(term);
  }) : null;

  // Passively bind AI Conduit
  const { isAnalyzing: isGlobalAnalyzing, analyzeData, lastSyncTime } = useAnalyzeFederationData(posts);
  const [localAnalyzing, setLocalAnalyzing] = useState(false);
  const [aiAnalysisSuccess, setAiAnalysisSuccess] = useState(false);
  const [aiBriefing, setAiBriefing] = useState(null);
  const [aiBriefingError, setAiBriefingError] = useState(null);


  // There is no background polling here. An earlier revision ran a five-minute interval
  // that logged "[ BACKGROUND_SYNC: INITIATING INTEL FETCH ]" and fetched nothing (a TODO
  // with a timer attached). The CMS is read on mount and on an explicit AI request; a
  // scheduler that announces work it does not do is theatre with a CPU cost.

  useEffect(() => {
    let isMounted = true;
    const mergeFeeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const aximFeeds = await fetchIntelligenceFeeds();
        if (isMounted) {
          // Pre-stage merging logic (safely fallback to wpPosts for now)
          const merged = [...(aximFeeds || []), ...(wpPosts || [])];
          setPosts(merged);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setPosts(wpPosts || []); // Fallback
        }
      } finally {
        if (isMounted) setLoading(wpLoading);
      }
    };

    if (!wpLoading) {
        mergeFeeds();
    }

    return () => { isMounted = false; };
  }, [wpPosts, wpLoading, fetchIntelligenceFeeds]);

  return (
    <Layout>
      <SEO title="Intelligence Hub | Pirate Federation" description="Organizational health, fleet telemetry, and dispatch logs of the American Pirate Federation." />
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Activity" className="h-10 w-10 text-apf-emerald" />
              <div className="flex-1">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                Consolidated Intelligence Core</h1>
              </div>
              <button
                onClick={async () => {
                  console.info("[ AI_TRIGGER_STAGED ]");
                  if (!localAnalyzing) {
                      setLocalAnalyzing(true);
                      setAiAnalysisSuccess(false);
                      try {
                          // Only real content goes into the prompt. The previous payload
                          // included `readiness: 94`, an invented metric fed to the model.
                          const result = await analyzeData({ posts });
                          const response = result?.aiResponse;

                          if (response && response.status !== 'unavailable' && response.status !== 'fallback' && !result.error) {
                              setAiBriefing(response.message || null);
                              setAiBriefingError(response.stale ? 'Showing a cached briefing — the uplink is currently unreachable.' : null);
                              setAiAnalysisSuccess(true);
                              setTimeout(() => setAiAnalysisSuccess(false), 3000);
                          } else {
                              setAiBriefing(null);
                              setAiBriefingError(result?.error || response?.message || 'The intelligence uplink is unavailable.');
                          }
                      } catch (err) {
                          // console.error("[ AI_TRANSMISSION_FAILED ]", err);
                          logUnhandledRejection(`[ AI_TRANSMISSION_FAILED ] ${err.message}`);
                      } finally {
                          setLocalAnalyzing(false);
                      }
                  }
                }}
                className={`px-6 py-3 min-h-[44px] border border-apf-purple text-apf-purple font-vt323 tracking-widest text-sm uppercase hover:bg-apf-purple hover:text-white transition-colors ${localAnalyzing ? 'animate-pulse' : ''}`}
                disabled={localAnalyzing}
              >
                {localAnalyzing ? '[ TRANSMITTING CONTEXT... ]' : aiAnalysisSuccess ? '[ AI ANALYSIS INITIATED ]' : '[ INITIALIZE AI ANALYSIS ]'}
              </button>
              {lastSyncTime && (
                <div className="mt-2 text-apf-emerald font-vt323 text-xs tracking-widest uppercase">
                  [ LAST SYNC: {lastSyncTime} ]
                </div>
              )}
              {aiBriefingError && (
                <div role="status" className="mt-4 border border-red-500/40 bg-red-500/5 p-4 font-vt323 text-sm text-red-400 text-left">
                  [ UPLINK: {aiBriefingError} ]
                </div>
              )}
              {aiBriefing && (
                <div className="mt-4 border border-apf-emerald/40 bg-black/60 p-4 font-mono text-sm text-gray-200 text-left whitespace-pre-wrap">
                  {aiBriefing}
                </div>
              )}

            </div>
            <p className="max-w-2xl text-gray-200 font-mono text-lg border-l-2 border-apf-emerald pl-6">
              Dispatch logs from the Federation's CMS, and the declared limits of the edge telemetry ingress.
            </p>
          </div>

          {/* Section 1: Fleet Telemetry (Census) */}
          <section className="space-y-4 sm:space-y-8 bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-4 sm:p-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white border-b-2 border-apf-purple/50 pb-2 flex items-center gap-3">
                 <SafeIcon name="Database" className="text-apf-purple h-8 w-8" /> Fleet Telemetry
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Crew census. The previous card published a guild split of 42% / 28% /
                      30% — three invented percentages for a members table that held zero
                      rows. `members` is additionally RLS-scoped to the owning user, so no
                      public census can be computed at all. The honest panel says why. */}
                  <div className="lg:col-span-1 bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6 neon-grid relative overflow-hidden group">
                      <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                      <div className="relative z-10">
                          <h3 className="font-vt323 text-xl text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                              <SafeIcon name="Users" className="h-5 w-5 text-apf-purpleLight" /> Crew Census
                          </h3>

                          <div className="border-l-2 border-apf-purple/50 pl-4 py-1">
                              <div className="font-vt323 text-[11px] uppercase tracking-widest text-gray-500 mb-2">Withheld by design</div>
                              <p className="font-sans text-sm text-gray-400 leading-relaxed">
                                  Member records are readable only by their owner. The Federation
                                  publishes no roster, no guild split and no headcount.
                              </p>
                              <p className="font-vt323 text-[11px] uppercase tracking-widest text-apf-emerald mt-3">
                                  Article VII — enforced by row-level security
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Readiness Score */}
                    <div className="lg:col-span-1 bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6 neon-grid relative overflow-hidden flex flex-col justify-center items-center text-center">
                        <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                        <div className="relative z-10">
                            <SafeIcon name="Shield" className="h-12 w-12 text-apf-emerald mx-auto mb-4" />
                            {/* Law 1: this card used to assert a "94% Fleet Readiness Index /
                                Status: Optimal" against no instrument that produces such a
                                number. It now counts the intel reports actually loaded from
                                the CMS — a value the page can prove. */}
                            <div className="text-6xl font-black text-white font-vt323 mb-2">
                              {loading ? <span className="text-gray-600">--</span> : posts.length}
                            </div>
                            <div className="font-vt323 text-apf-purple uppercase tracking-[0.2em] text-sm">Intel Reports On File</div>
                            <div className="mt-4 text-xs text-gray-400 font-vt323 uppercase">
                              {loading ? 'Syncing with the CMS' : 'Live from piratefederation.org'}
                            </div>
                        </div>
                    </div>
              </div>

              {/* Node Heatmap Placeholder */}
              <div className="bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8 relative overflow-hidden">
                 <div className="absolute inset-0 neon-grid opacity-30 z-0 !pointer-events-none" />
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
                         <div className="absolute bottom-4 right-4 font-vt323 text-xs text-gray-400 uppercase !pointer-events-none">
                             [ SCHEMATIC — ILLUSTRATIVE ONLY ]
                         </div>
                      </div>
                 </div>
              </div>


              {/* Ingress protocol. This panel used to print five invented AWS-style "consoles"
                  (US-EAST-1 ... connected to consensus cluster) stamped with the current
                  clock, which read as live telemetry on a page whose whole claim is ground
                  truth. The Federation has one edge ingress and it stores nothing; say that. */}
              <div className="bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6 relative overflow-hidden">
                 <div className="absolute inset-0 scanlines !pointer-events-none opacity-50 z-0" />
                 <div className="relative z-10">
                     <h4 className="font-vt323 text-apf-purpleLight uppercase tracking-widest text-sm mb-4 border-b border-gray-800 pb-2">
                         [ TELEMETRY INGRESS — DECLARED LIMITS ]
                     </h4>
                     <div className="font-vt323 text-gray-300 text-xs flex flex-col gap-1.5">
                         <div className="flex justify-between gap-4"><span className="text-gray-500">MAX PAYLOAD</span><span className="text-apf-emerald">16 KB</span></div>
                         <div className="flex justify-between gap-4"><span className="text-gray-500">MAX BATCH</span><span className="text-apf-emerald">50 events</span></div>
                         <div className="flex justify-between gap-4"><span className="text-gray-500">CLOCK SKEW</span><span className="text-apf-emerald">-2h / +24h</span></div>
                         <div className="flex justify-between gap-4"><span className="text-gray-500">GEO</span><span className="text-apf-emerald">country · colo</span></div>
                         <div className="flex justify-between gap-4"><span className="text-gray-500">DURABLE SINK</span><span className="text-amber-500">none yet</span></div>
                     </div>
                     <p className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider">
                         Validated at the edge and written to the edge log only. No third-party pixels.
                     </p>
                 </div>
              </div>
          </section>

          {/* Section 2: Fleet Transmissions (Bridge Dispatches) */}
          <section className="space-y-4 sm:space-y-8 bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-4 sm:p-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-white border-b-2 border-apf-purple/50 pb-2 flex items-center gap-3 relative mb-6">
                 <SafeIcon name="Terminal" className="text-apf-purple h-8 w-8" /> Fleet Transmissions
                 {error && <span className="absolute right-0 text-red-500 text-sm animate-pulse">[ OFFLINE MODE ]</span>}
              </h2>
              <IntelFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

              {loading ? (
                <div className="py-12 flex justify-center text-apf-purple font-mono bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8">
                  <SafeIcon name="Loader" className="animate-spin mr-2 h-8 w-8" />
                  SYNCING ARCHIVES...
                </div>
              ) : error ? (
                <div className="py-12 flex justify-center bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-8">
                  <div className="border border-red-500/50 bg-red-500/10 p-6 rounded text-red-400 font-mono flex items-center gap-3">
                    <SafeIcon name="AlertTriangle" className="h-6 w-6" />
                    <span>[SIGNAL_INTERRUPTED] - UNABLE TO FETCH ARCHIVES</span>
                  </div>
                </div>
              ) : !posts.length ? (
                // An empty archive is not a failure. The previous condition folded
                // "nothing published" into "signal interrupted" and printed a red error
                // for a CMS that was answering perfectly well.
                <div className="py-12 px-6 text-center bg-black/40 backdrop-blur-md transform-gpu border border-dashed border-gray-800 shadow-2xl transition-all duration-500">
                  <div className="font-vt323 text-apf-purple text-lg uppercase tracking-widest mb-2">[ NO DISPATCHES ON FILE ]</div>
                  <p className="font-sans text-sm text-gray-500 max-w-lg mx-auto">
                    The Federation newsroom has published nothing yet. This archive stays empty
                    until it does — it is never filled with sample stories.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {filteredPosts.map((post, index) => {
                    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={post.id}
                        className="bg-black/40 backdrop-blur-md transform-gpu border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 overflow-hidden group flex flex-col"
                      >
                        {featuredMedia && (
                          <div className="h-48 overflow-hidden">
                            <img
                              src={featuredMedia}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        )}
                        <div className="p-6 flex-grow flex flex-col">
                          <p className="text-apf-purple text-xs font-mono mb-2">
                            {formatTerminalDate(post.date)}
                          </p>
                          <h3
                            className="text-xl font-bold mb-3 text-gray-100 group-hover:text-apf-purpleLight transition-colors"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.title.rendered) }}
                          />
                          <div
                            className="prose prose-invert prose-sm text-gray-200 line-clamp-3 font-mono flex-grow mb-4"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.excerpt.rendered) }}
                          />
                          <button onClick={() => setActivePost(post)} className="mt-auto w-fit text-sm font-mono text-apf-purple hover:text-white flex items-center gap-2 uppercase tracking-widest">
                            Read Decrypt <SafeIcon name="ArrowRight" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && posts && posts.length > 0 && (
                <div className="mt-12 p-8 text-center font-vt323 text-xs uppercase tracking-widest text-gray-500">
                   The archive lists the dispatches the CMS has published; the previous control
                   here read &ldquo;Load Older Transmissions&rdquo; and loaded nothing.
                </div>
              )}
          </section>

        </div>
      </PageTransition>
            <TransmissionModal
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
      />
    </Layout>
  );
}
