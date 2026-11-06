import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { VoteControl } from '../components/forum/VoteControl';
import { useAppStore } from '../store/useAppStore';
import { FORUM_CATEGORIES, categoryBySlug } from '../lib/forum/categories';
import {
  FORUM_LIMITS,
  ForumSchemaMissing,
  createThread,
  fetchMyVotes,
  fetchThreads,
  relativeTime,
  setVote,
  sortThreads,
  validateThread
} from '../lib/api/forum';

const SORTS = [
  { id: 'hot', label: 'Hot' },
  { id: 'new', label: 'New' },
  { id: 'top', label: 'Top' }
];

export function ForumCategory() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const category = categoryBySlug(categorySlug);
  const { passport, openPassport, addToast } = useAppStore();
  const member = passport.member;
  const isSignedIn = Boolean(passport.session?.user);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('hot');
  const [votes, setVotes] = useState({});

  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!category) {
      setLoading(false);
      return () => { isMounted = false; };
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchThreads(category.id);
        if (!isMounted) return;
        setThreads(rows);
        if (member?.id && rows.length > 0) {
          const own = await fetchMyVotes(member.id, 'thread', rows.map((row) => row.id));
          if (isMounted) setVotes(own);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof ForumSchemaMissing) setSchemaMissing(true);
        else setError(err?.message || 'This board is unavailable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [category, member?.id]);

  const ordered = useMemo(() => sortThreads(threads, sort), [threads, sort]);

  const handleVote = async (thread, direction) => {
    if (!member?.id) {
      openPassport();
      return;
    }

    const current = votes[thread.id] || 0;
    const next = current === direction ? 0 : direction;
    const delta = next - current;

    setVotes((prev) => ({ ...prev, [thread.id]: next }));
    setThreads((prev) => prev.map((row) => (row.id === thread.id ? { ...row, score: row.score + delta } : row)));

    try {
      const confirmed = await setVote({ memberId: member.id, targetType: 'thread', targetId: thread.id, value: direction });
      setVotes((prev) => ({ ...prev, [thread.id]: confirmed }));
    } catch (err) {
      setVotes((prev) => ({ ...prev, [thread.id]: current }));
      setThreads((prev) => prev.map((row) => (row.id === thread.id ? { ...row, score: row.score - delta } : row)));
      addToast(`[ FORUM: ${(err?.message || 'VOTE FAILED').toUpperCase()} ]`, 'error');
    }
  };

  const openComposer = () => {
    if (!isSignedIn) {
      openPassport();
      addToast('[ FORUM: SIGN IN WITH A PIRATE PASSPORT TO POST ]', 'warning');
      return;
    }
    setComposerOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!member?.id || submitting) return;

    const validationError = validateThread({ title, body });
    if (validationError) {
      addToast(`[ FORUM: ${validationError.toUpperCase()} ]`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const thread = await createThread({ categoryId: category.id, authorId: member.id, title, body });
      addToast('[ FORUM: THREAD POSTED ]', 'success');
      navigate(`/forum/${category.slug}/${thread.id}`);
    } catch (err) {
      if (err instanceof ForumSchemaMissing) setSchemaMissing(true);
      addToast(`[ FORUM: ${(err?.message || 'COULD NOT POST').toUpperCase()} ]`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!category) {
    return (
      <Layout>
        <SEO title="Board not found | Forum" />
        <PageTransition>
          <div className="apf-container py-20">
            <PageHeader icon="MessageSquare" kicker="Forum" title="Board not found" lede={`That board does not exist. The ${FORUM_CATEGORIES.length} boards are listed on the forum index.`} />
            <Link to="/forum" className="apf-btn apf-btn-ghost">Back to the forum</Link>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title={`${category.name} | Forum`} description={category.description} />
      <PageTransition>
        <div className="apf-container max-w-4xl py-14 sm:py-20">
          <nav className="mb-5 flex items-center gap-2 text-xs text-ink-dim" aria-label="Breadcrumb">
            <Link to="/forum" className="transition-colors hover:text-white">Forum</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink-muted">{category.name}</span>
          </nav>

          <PageHeader
            icon="MessageSquare"
            kicker={`/forum/${category.slug}`}
            title={category.name}
            lede={category.description}
            actions={
              <button type="button" onClick={openComposer} className="apf-btn apf-btn-primary">
                <SafeIcon name="Plus" className="h-4 w-4" /> New thread
              </button>
            }
          />

          {schemaMissing && (
            <div role="status" className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 text-sm text-amber-200">
              The forum migration has not been applied, so posting and voting are unavailable.
            </div>
          )}

          {/* Audit 2026-11-06: a signed-in Passport with no `members` row used to open this
              composer into nothing at all — the form is gated on `member`, so the button
              appeared to do nothing and the reason was never stated. Say the reason. */}
          {composerOpen && isSignedIn && !member && (
            <div className="apf-card mb-6 p-5 sm:p-6" role="status">
              <h2 className="text-base font-semibold text-white">A muster record is required to post</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Your Pirate Passport is signed in, but the Federation holds no member record
                for it yet — so this board has no alias to put on a thread. File a muster
                record, then come back; reading stays open either way.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link to="/" onClick={() => setComposerOpen(false)} className="apf-btn apf-btn-primary">
                  Go to the muster form
                </Link>
                <button type="button" onClick={openPassport} className="apf-btn apf-btn-ghost">
                  Open Pirate Passport
                </button>
                <button type="button" onClick={() => setComposerOpen(false)} className="text-xs text-ink-dim hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {composerOpen && member && (
            <form onSubmit={handleSubmit} className="apf-card mb-6 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">New thread in {category.name}</h2>
                <button type="button" onClick={() => setComposerOpen(false)} className="text-xs text-ink-dim hover:text-white">Cancel</button>
              </div>
              <label htmlFor="thread-title" className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">Title</label>
              <input
                id="thread-title"
                type="text"
                maxLength={FORUM_LIMITS.title}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What should the board discuss?"
                className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
              />
              <label htmlFor="thread-body" className="mb-1.5 mt-4 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">Body</label>
              <textarea
                id="thread-body"
                rows={6}
                maxLength={FORUM_LIMITS.body}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Make the case. Plain text; no HTML."
                className="w-full resize-none rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-ink-dim">{body.length}/{FORUM_LIMITS.body}</span>
                <button type="submit" disabled={submitting} className="apf-btn apf-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Posting…' : 'Post thread'}
                </button>
              </div>
            </form>
          )}

          <div className="mb-4 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-surface-900/70 p-1">
            {SORTS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSort(entry.id)}
                aria-pressed={sort === entry.id}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  sort === entry.id ? 'bg-white/[0.08] text-white' : 'text-ink-muted hover:text-white'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="apf-card flex items-center justify-center gap-3 p-10 text-sm text-ink-muted">
              <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
              Loading threads…
            </div>
          ) : error ? (
            <div className="apf-card p-8 text-center text-sm text-ink-muted">{error}</div>
          ) : ordered.length === 0 ? (
            <div className="apf-card p-10 text-center">
              <p className="text-base font-medium text-white">No threads on this board yet</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                The board is open. Nothing is seeded — the first thread is the first thing
                anyone writes here.
              </p>
              <button type="button" onClick={openComposer} className="apf-btn apf-btn-ghost mt-6">
                Start the first thread
              </button>
            </div>
          ) : (
            <ul className="apf-card divide-y divide-white/[0.06]">
              {ordered.map((thread) => (
                <li key={thread.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  <VoteControl
                    score={thread.score}
                    value={votes[thread.id] || 0}
                    onVote={(direction) => handleVote(thread, direction)}
                    disabled={!member}
                    onRequireAuth={openPassport}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {thread.isPinned && (
                        <span className="rounded-md bg-apf-purple/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-apf-purpleLight">Pinned</span>
                      )}
                      <Link
                        to={`/forum/${category.slug}/${thread.id}`}
                        className="text-base font-semibold leading-snug text-white transition-colors hover:text-apf-purpleLight"
                      >
                        {thread.title}
                      </Link>
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-dim">
                      {thread.authorAlias} · {relativeTime(thread.createdAt)} · {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                      {thread.lastActivityAt && ` · active ${relativeTime(thread.lastActivityAt)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
