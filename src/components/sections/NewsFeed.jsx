import React from 'react';
import { Link } from 'react-router-dom';
import TransmissionModal from '../ui/TransmissionModal';
import { useWPContent } from '../../hooks/useWPContent';
import DOMPurify from 'isomorphic-dompurify';
import { stripHtml } from '../../lib/api/formatting';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function NewsFeed() {
  const { data: posts, isLoading, error } = useWPContent();
  const [activePost, setActivePost] = React.useState(null);

  if (isLoading) {
    return (
      <section className="border-b border-white/[0.06] py-20 sm:py-24">
        <div className="apf-container">
          <div className="max-w-2xl">
            <p className="apf-kicker">Dispatches</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From the newsroom</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="apf-card h-64 animate-pulse p-6">
                <div className="h-3 w-20 rounded bg-white/[0.06]" />
                <div className="mt-4 h-5 w-3/4 rounded bg-white/[0.06]" />
                <div className="mt-3 h-3 w-full rounded bg-white/[0.04]" />
                <div className="mt-2 h-3 w-5/6 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Law 1: this used to render three invented dispatches whenever the CMS was unreachable
  // or empty, each stamped with a fresh timestamp. An empty wire now says it is empty.
  const hasOfflineError = error || !posts || posts.length === 0;

  if (hasOfflineError) {
    return (
      <section className="border-b border-white/[0.06] py-20 sm:py-24">
        <div className="apf-container">
          <div className="max-w-2xl">
            <p className="apf-kicker">Dispatches</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From the newsroom</h2>
          </div>
          <div className="mt-10 rounded-2xl border border-dashed border-white/[0.1] bg-surface-900/40 p-10 text-center">
            <SafeIcon name="Newspaper" className="mx-auto h-8 w-8 text-ink-dim" />
            <p className="mt-4 text-base font-medium text-white">No dispatches on the wire</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              The Federation newsroom has published nothing yet, or the CMS is unreachable
              from this node. This page never fills the gap with sample stories.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-white/[0.06] py-20 sm:py-24">
      <div className="apf-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="apf-kicker">Dispatches</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From the newsroom</h2>
            <p className="apf-lede mt-4">
              Reporting and analysis published by the Federation. Every story is a public record.
            </p>
          </div>
          <Link to="/intelligence" className="apf-btn apf-btn-ghost">
            All dispatches
            <SafeIcon name="ArrowRight" className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {posts.slice(0, 3).map((post, index) => {
            const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
            const dateStr = new Date(post.date);
            const formattedDate = Number.isNaN(dateStr.getTime())
              ? null
              : dateStr.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            return (
              <motion.article
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
                key={post.id}
                className="apf-card apf-card-hover group flex flex-col overflow-hidden"
              >
                {featuredMedia && (
                  <div className="h-44 shrink-0 overflow-hidden">
                    <img
                      src={featuredMedia}
                      alt=""
                      className="h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex flex-grow flex-col p-6">
                  {formattedDate && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">{formattedDate}</p>
                  )}
                  <h3
                    className="mt-2.5 text-lg font-semibold leading-snug text-white"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(stripHtml(post.title.rendered)) }}
                  />
                  <div
                    className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-muted"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(stripHtml(post.excerpt.rendered)) }}
                  />
                  <button
                    onClick={() => setActivePost(post)}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-medium text-apf-purpleLight transition-colors hover:text-white"
                  >
                    Read dispatch <SafeIcon name="ArrowRight" className="h-4 w-4" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <TransmissionModal
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
      />
    </section>
  );
}
