import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { FORUM_CATEGORIES } from '../lib/forum/categories';
import {
  ForumSchemaMissing,
  fetchRecentThreads,
  relativeTime
} from '../lib/api/forum';

/**
 * /forum — category index and recent activity.
 *
 * Categories are strategic structure and live in src/lib/forum/categories.js, so the forum
 * is navigable before a single thread exists. Recent threads come from the database; when
 * the migration has not been applied the page says so rather than inventing activity.
 */
export function Forum() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const rows = await fetchRecentThreads(8);
        if (isMounted) setRecent(rows);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof ForumSchemaMissing) setSchemaMissing(true);
        else setError(err?.message || 'The forum is unavailable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <Layout>
      <SEO
        title="Forum | American Pirate Federation"
        description="Strategic discussion boards for the American Pirate Federation."
      />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="MessageSquare"
            kicker="Community"
            title="Forum"
            lede="Read everything without an account. Post and vote with a Pirate Passport. Seven boards, one Federation."
            actions={<Link to="/members" className="apf-btn apf-btn-ghost">Member directory</Link>}
          />

          {schemaMissing && (
            <div role="status" className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 text-sm text-amber-200">
              The forum tables have not been created in this Supabase project yet. Apply
              <code className="mx-1 text-amber-300">supabase/migrations/20261106120000_forum.sql</code>
              to open posting and voting.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {FORUM_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                to={`/forum/${category.slug}`}
                className="apf-card apf-card-hover group flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-white">{category.name}</h2>
                  <SafeIcon name="ArrowRight" className="mt-1 h-4 w-4 shrink-0 text-ink-dim transition-colors group-hover:text-apf-purpleLight" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{category.description}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">
                  /forum/{category.slug}
                </p>
              </Link>
            ))}
          </div>

          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-white">Recent activity</h2>
              <span className="text-xs text-ink-dim">Newest replies across every board</span>
            </div>

            {loading ? (
              <div className="apf-card flex items-center justify-center gap-3 p-10 text-sm text-ink-muted">
                <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
                Loading threads…
              </div>
            ) : error ? (
              <div className="apf-card p-8 text-center text-sm text-ink-muted">
                The forum is unavailable: {error}
              </div>
            ) : recent.length === 0 ? (
              <div className="apf-card p-8 text-center">
                <p className="text-base font-medium text-white">No threads yet</p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                  The boards are open. The first thread starts whenever a member writes it —
                  nothing here is seeded or simulated.
                </p>
              </div>
            ) : (
              <ul className="apf-card divide-y divide-white/[0.06]">
                {recent.map((thread) => {
                  const category = FORUM_CATEGORIES.find((entry) => entry.id === thread.categoryId);
                  return (
                    <li key={thread.id}>
                      <Link
                        to={`/forum/${category?.slug || 'general'}/${thread.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <span className="w-10 shrink-0 text-center font-mono text-xs text-ink-muted">{thread.score}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{thread.title}</span>
                          <span className="mt-0.5 block text-[11px] text-ink-dim">
                            {category?.name} · {thread.authorAlias} · {relativeTime(thread.lastActivityAt)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-dim">{thread.replyCount} replies</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </PageTransition>
    </Layout>
  );
}
