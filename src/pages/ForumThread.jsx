import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { VoteControl } from '../components/forum/VoteControl';
import { useAppStore } from '../store/useAppStore';
import { categoryBySlug } from '../lib/forum/categories';
import {
  ForumSchemaMissing,
  buildReplyTree,
  createPost,
  fetchMyVotes,
  fetchPosts,
  fetchThread,
  relativeTime,
  setVote,
  validateReply
} from '../lib/api/forum';
import { PageHeader } from '../components/layout/PageHeader';

function ReplyForm({ onSubmit, onCancel, submitting, compact = false }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validateReply(body);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const ok = await onSubmit(body);
    if (ok) setBody('');
  };

  return (
    <form onSubmit={submit} className={compact ? 'mt-3' : 'mt-4'}>
      <textarea
        rows={compact ? 3 : 4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply. Plain text; no HTML."
        className="w-full resize-none rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button type="submit" disabled={submitting} className="apf-btn apf-btn-primary min-h-[36px] px-4 text-xs disabled:opacity-50">
          {submitting ? 'Posting…' : 'Reply'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-ink-dim hover:text-white">Cancel</button>
      </div>
    </form>
  );
}

function ReplyNode({ post, depth, myVote, onVote, allVotes, canWrite, onRequireAuth, onReply }) {
  const [replying, setReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (body) => {
    setSubmitting(true);
    const ok = await onReply(post.id, body);
    setSubmitting(false);
    if (ok) setReplying(false);
    return ok;
  };

  return (
    <div>
      <div className="flex gap-3">
        <VoteControl
          score={post.score}
          value={myVote}
          onVote={(direction) => onVote(post, direction)}
          disabled={!canWrite}
          onRequireAuth={onRequireAuth}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-dim">
            {post.authorAlias} · {relativeTime(post.createdAt)}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{post.body}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => (canWrite ? setReplying(!replying) : onRequireAuth?.())}
              className="text-ink-dim transition-colors hover:text-white"
            >
              Reply
            </button>
            {depth >= 3 && <span className="text-ink-dim">deep reply</span>}
          </div>
          {replying && (
            <ReplyForm compact onSubmit={submit} onCancel={() => setReplying(false)} submitting={submitting} />
          )}
        </div>
      </div>

      {post.children?.length > 0 && (
        <div className="mt-4 space-y-4 border-l border-white/[0.07] pl-4 sm:pl-5">
          {post.children.map((child) => (
            <ReplyNode
              key={child.id}
              post={child}
              depth={depth + 1}
              myVote={allVotes?.[child.id] || 0}
              onVote={onVote}
              allVotes={allVotes}
              canWrite={canWrite}
              onRequireAuth={onRequireAuth}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ForumThread() {
  const { categorySlug, threadId } = useParams();
  const category = categoryBySlug(categorySlug);
  const { passport, openPassport, addToast } = useAppStore();
  const member = passport.member;

  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState({ thread: {}, post: {} });
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [error, setError] = useState(null);
  const [replying, setReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [row, replies] = await Promise.all([fetchThread(threadId), fetchPosts(threadId)]);
        if (!isMounted) return;
        setThread(row);
        setPosts(replies);

        if (member?.id) {
          const [threadVotes, postVotes] = await Promise.all([
            fetchMyVotes(member.id, 'thread', [threadId]),
            fetchMyVotes(member.id, 'post', replies.map((reply) => reply.id))
          ]);
          if (isMounted) setVotes({ thread: threadVotes, post: postVotes });
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof ForumSchemaMissing) setSchemaMissing(true);
        else setError(err?.message || 'This thread is unavailable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [threadId, member?.id]);

  const tree = useMemo(() => buildReplyTree(posts), [posts]);

  const voteThread = async (direction) => {
    if (!member?.id) {
      openPassport();
      return;
    }
    const current = votes.thread[thread.id] || 0;
    const next = current === direction ? 0 : direction;
    const delta = next - current;

    setVotes((prev) => ({ ...prev, thread: { ...prev.thread, [thread.id]: next } }));
    setThread((prev) => ({ ...prev, score: prev.score + delta }));

    try {
      const confirmed = await setVote({ memberId: member.id, targetType: 'thread', targetId: thread.id, value: direction });
      setVotes((prev) => ({ ...prev, thread: { ...prev.thread, [thread.id]: confirmed } }));
    } catch (err) {
      setVotes((prev) => ({ ...prev, thread: { ...prev.thread, [thread.id]: current } }));
      setThread((prev) => ({ ...prev, score: prev.score - delta }));
      addToast(`[ FORUM: ${(err?.message || 'VOTE FAILED').toUpperCase()} ]`, 'error');
    }
  };

  const votePost = async (post, direction) => {
    if (!member?.id) {
      openPassport();
      return;
    }
    const current = votes.post[post.id] || 0;
    const next = current === direction ? 0 : direction;
    const delta = next - current;

    setVotes((prev) => ({ ...prev, post: { ...prev.post, [post.id]: next } }));
    setPosts((prev) => prev.map((row) => (row.id === post.id ? { ...row, score: row.score + delta } : row)));

    try {
      const confirmed = await setVote({ memberId: member.id, targetType: 'post', targetId: post.id, value: direction });
      setVotes((prev) => ({ ...prev, post: { ...prev.post, [post.id]: confirmed } }));
    } catch (err) {
      setVotes((prev) => ({ ...prev, post: { ...prev.post, [post.id]: current } }));
      setPosts((prev) => prev.map((row) => (row.id === post.id ? { ...row, score: row.score - delta } : row)));
      addToast(`[ FORUM: ${(err?.message || 'VOTE FAILED').toUpperCase()} ]`, 'error');
    }
  };

  const submitReply = async (parentId, body) => {
    if (!member?.id) {
      openPassport();
      return false;
    }
    try {
      const created = await createPost({ threadId, parentId, authorId: member.id, body });
      setPosts((prev) => [...prev, created]);
      setThread((prev) => (prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev));
      addToast('[ FORUM: REPLY POSTED ]', 'success');
      return true;
    } catch (err) {
      if (err instanceof ForumSchemaMissing) setSchemaMissing(true);
      addToast(`[ FORUM: ${(err?.message || 'COULD NOT REPLY').toUpperCase()} ]`, 'error');
      return false;
    }
  };

  const topLevelReply = async (body) => {
    setSubmitting(true);
    const ok = await submitReply(null, body);
    setSubmitting(false);
    if (ok) setReplying(false);
    return ok;
  };

  if (!category) {
    return (
      <Layout>
        <SEO title="Board not found | Forum" />
        <PageTransition>
          <div className="apf-container max-w-3xl py-20">
            <PageHeader icon="MessageSquare" kicker="Forum" title="Board not found" lede="That board does not exist. The boards are listed on the forum index." />
            <Link to="/forum" className="apf-btn apf-btn-ghost">Back to the forum</Link>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="apf-container max-w-3xl py-20">
          <div className="apf-card flex items-center gap-3 p-10 text-sm text-ink-muted">
            <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
            Loading thread…
          </div>
        </div>
      </Layout>
    );
  }

  if (schemaMissing || error || (!thread && !loading)) {
    return (
      <Layout>
        <SEO title="Thread | Forum" />
        <PageTransition>
          <div className="apf-container max-w-3xl py-20">
            <PageHeader
              icon="MessageSquare"
              kicker="Forum"
              title={schemaMissing ? 'Forum not enabled' : 'Thread unavailable'}
              lede={schemaMissing
                ? 'The forum migration has not been applied to this Supabase project yet.'
                : (error || 'This thread does not exist or is not published.')}
            />
            <Link to={`/forum/${category?.slug || ''}`} className="apf-btn apf-btn-ghost">Back to the board</Link>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (!thread) return null;

  return (
    <Layout>
      <SEO title={`${thread.title} | Forum`} description={thread.body.slice(0, 140)} />
      <PageTransition>
        <div className="apf-container max-w-3xl py-12 sm:py-16">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-ink-dim" aria-label="Breadcrumb">
            <Link to="/forum" className="transition-colors hover:text-white">Forum</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/forum/${category.slug}`} className="transition-colors hover:text-white">{category.name}</Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-ink-muted">Thread</span>
          </nav>

          <article className="apf-card p-5 sm:p-7">
            <div className="flex gap-4">
              <VoteControl
                score={thread.score}
                value={votes.thread[thread.id] || 0}
                onVote={voteThread}
                disabled={!member}
                onRequireAuth={openPassport}
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
                  {thread.title}
                </h1>
                <p className="mt-2 text-[11px] text-ink-dim">
                  {thread.authorAlias} · {relativeTime(thread.createdAt)} · {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                </p>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                  {thread.body}
                </p>
              </div>
            </div>
          </article>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Replies</h2>
              {!replying && (
                <button
                  type="button"
                  onClick={() => (member ? setReplying(true) : openPassport())}
                  className="apf-btn apf-btn-ghost min-h-[36px] px-4 text-xs"
                >
                  Add a reply
                </button>
              )}
            </div>

            {replying && member && (
              <div className="apf-card mb-5 p-4">
                <ReplyForm onSubmit={topLevelReply} onCancel={() => setReplying(false)} submitting={submitting} />
              </div>
            )}

            {tree.length === 0 ? (
              <div className="apf-card p-8 text-center">
                <p className="text-sm font-medium text-white">No replies yet</p>
                <p className="mt-1.5 text-sm text-ink-muted">Be the first to answer.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {tree.map((post) => (
                  <ReplyNode
                    key={post.id}
                    post={post}
                    depth={0}
                    myVote={votes.post[post.id] || 0}
                    onVote={votePost}
                    allVotes={votes.post}
                    canWrite={Boolean(member)}
                    onRequireAuth={openPassport}
                    onReply={submitReply}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </PageTransition>
    </Layout>
  );
}
