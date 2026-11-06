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
        <div className="apf-container space-y-14 py-14 sm:py-20">

          <div className="mb-8">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <SafeIcon name="Activity" className="h-5 w-5 shrink-0 text-emerald-300" />
              <div className="min-w-0 flex-1">
                <p className="apf-kicker">Intelligence</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-white md:text-5xl">
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
                className={`min-h-[44px] basis-full rounded-xl border border-apf-purple/40 px-5 text-sm font-medium text-apf-purpleLight transition-colors hover:bg-apf-purple/10 sm:basis-auto ${localAnalyzing ? 'animate-pulse' : ''}`}
                disabled={localAnalyzing}
              >
                {localAnalyzing ? 'Analyzing…' : aiAnalysisSuccess ? 'Analysis complete' : 'Run AI analysis'}
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
            <p className="apf-lede mt-5 max-w-3xl">Dispatch logs from the Federation&rsquo;s CMS, and the declared limits of the edge telemetry ingress.</p>
          </div>

          {/* Section 1: Fleet Telemetry (Census) */}
          <section className="space-y-5">
              <h2 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-white">
                 <SafeIcon name="Database" className="h-5 w-5 text-apf-purpleLight" /> Fleet telemetry
              </h2>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {/* Crew census. The previous card published a guild split of 42% / 28% /
                      30% — three invented percentages for a members table that held zero
                      rows. `members` is additionally RLS-scoped to the owning user, so no
                      public census can be computed at all. The honest panel says why. */}
                  <div className="apf-card p-6 lg:col-span-1">
                      <div>
                          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                              <SafeIcon name="Users" className="h-4 w-4 text-apf-purpleLight" /> Crew census
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
                    <div className="apf-card flex flex-col items-center justify-center p-6 text-center lg:col-span-1">
                        <div>
                            <SafeIcon name="Shield" className="mx-auto mb-4 h-8 w-8 text-emerald-300" />
                            {/* Law 1: this card used to assert a "94% Fleet Readiness Index /
                                Status: Optimal" against no instrument that produces such a
                                number. It now counts the intel reports actually loaded from
                                the CMS — a value the page can prove. */}
                            <div className="mb-1 font-display text-5xl font-semibold tracking-tight text-white">
                              {loading ? <span className="text-ink-dim">--</span> : posts.length}
                            </div>
                            <div className="text-sm font-medium text-white">Intel reports on file</div>
                            <div className="mt-2 text-xs text-ink-dim">
                              {loading ? 'Syncing with the CMS' : 'Live from piratefederation.org'}
                            </div>
                        </div>
                    </div>
              </div>

              {/* Node Heatmap Placeholder */}
              <div className="apf-card p-6">
                 <div>
                      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                          <SafeIcon name="Map" className="h-4 w-4 text-apf-purpleLight" /> Synchronization schematic
                      </h3>
                      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-surface-950">
                         <div className="scanlines pointer-events-none absolute inset-0 z-10" />
                         {/* Stylized Abstract SVG Map Placeholder */}
                         <svg viewBox="0 0 800 400" className="w-full h-full opacity-60">
                            <path d="M100,100 Q150,50 200,150 T300,100 T400,200 T500,150 T600,250 T700,100" fill="none" stroke="#9400D3" strokeWidth="2" className="opacity-50" />
                            <path d="M50,200 Q100,100 250,250 T450,150 T650,300" fill="none" stroke="#10B981" strokeWidth="1" className="opacity-30" />

                            {/* Heatmap Nodes */}
                            <circle cx="200" cy="150" r="15" fill="#10B981" className="animate-pulse opacity-80" />
                            <circle cx="400" cy="200" r="25" fill="#9400D3" className="animate-ping opacity-40" />
                            <circle cx="400" cy="200" r="10" fill="#9400D3" className="opacity-90" />
                            <circle cx="600" cy="250" r="18" fill="#10B981" className="animate-pulse opacity-70" />
                            <circle cx="300" cy="100" r="8" fill="#9400D3" className="opacity-60" />
                            <circle cx="700" cy="100" r="12" fill="#10B981" className="opacity-50" />
                            <circle cx="250" cy="250" r="20" fill="#9400D3" className="animate-pulse opacity-60" />
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
              <div className="apf-card p-6">
                 <div>
                     <h4 className="mb-4 border-b border-white/[0.06] pb-3 text-base font-semibold text-white">
                         Telemetry ingress · declared limits
                     </h4>
                     <div className="flex flex-col gap-1.5 font-mono text-xs text-ink-muted">
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
          <section className="space-y-4 sm:space-y-8 apf-card hover:border-white/15 transition-all duration-500 p-4 sm:p-8">
              <h2 className="mb-5 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-white">
                 <SafeIcon name="Terminal" className="h-5 w-5 text-apf-purpleLight" /> Fleet transmissions
                 {error && <span className="ml-auto text-xs font-normal text-red-400">Offline mode</span>}
              </h2>
              <IntelFilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

              {loading ? (
                <div className="apf-card flex items-center justify-center gap-3 p-10 text-sm text-ink-muted">
                  <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
                  Loading dispatches…
                </div>
              ) : error ? (
                <div className="apf-card flex items-center justify-center p-10">
                  <div className="flex items-center gap-3 text-sm text-red-400">
                    <SafeIcon name="AlertTriangle" className="h-4 w-4" />
                    <span>The CMS could not be reached. This is a signal failure, not an empty archive.</span>
                  </div>
                </div>
              ) : !posts.length ? (
                // An empty archive is not a failure. The previous condition folded
                // "nothing published" into "signal interrupted" and printed a red error
                // for a CMS that was answering perfectly well.
                <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface-900/40 px-6 py-12 text-center">
                  <p className="text-base font-medium text-white">No dispatches on file</p>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
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
                        className="apf-card apf-card-hover group flex flex-col overflow-hidden"
                      >
                        {featuredMedia && (
                          <div className="h-40 overflow-hidden">
                            <img
                              src={featuredMedia}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        )}
                        <div className="p-6 flex-grow flex flex-col">
                          <p className="mb-2 font-mono text-[11px] text-ink-dim">
                            {formatTerminalDate(post.date)}
                          </p>
                          <h3
                            className="mb-2.5 text-lg font-semibold leading-snug text-white"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.title.rendered) }}
                          />
                          <div
                            className="mb-4 line-clamp-3 flex-grow text-sm leading-relaxed text-ink-muted"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.excerpt.rendered) }}
                          />
                          <button onClick={() => setActivePost(post)} className="mt-auto flex w-fit items-center gap-1.5 text-sm font-medium text-apf-purpleLight transition-colors hover:text-white">
                            Read Dispatch <SafeIcon name="ArrowRight" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && posts && posts.length > 0 && (
                <div className="mt-10 text-center text-xs text-ink-dim">
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
