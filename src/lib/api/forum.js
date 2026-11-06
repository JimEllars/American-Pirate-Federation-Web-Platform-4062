import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Forum reads and writes.
 *
 * Read is public (RLS: published rows). Writes need the member's own JWT: inserts carry
 * author_id = auth.uid(), and scores/statuses are trigger/policy territory, never client
 * fields. A missing schema is surfaced as ForumSchemaMissing so pages can say the migration
 * has not been applied instead of pretending the forum is empty.
 */

export const FORUM_LIMITS = {
  title: 160,
  titleMin: 3,
  body: 20000,
  reply: 10000,
  pageSize: 100
};

const isMissingRelation = (error) =>
  Boolean(error) && (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache|Could not find the table/i.test(error.message || '')
  );

export class ForumSchemaMissing extends Error {
  constructor() {
    super('The forum tables have not been created in this Supabase project yet.');
    this.name = 'ForumSchemaMissing';
    this.code = 'FORUM_SCHEMA_MISSING';
  }
}

const THREAD_FIELDS =
  'id, category_id, author_id, author_alias, title, body, status, is_pinned, score, reply_count, created_at, last_activity_at';

const POST_FIELDS =
  'id, thread_id, parent_id, author_id, author_alias, body, status, score, created_at';

const mapThread = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  authorId: row.author_id,
  authorAlias: row.author_alias || 'Unknown member',
  title: row.title,
  body: row.body,
  status: row.status,
  isPinned: Boolean(row.is_pinned),
  score: row.score ?? 0,
  replyCount: row.reply_count ?? 0,
  createdAt: row.created_at,
  lastActivityAt: row.last_activity_at
});

const mapPost = (row) => ({
  id: row.id,
  threadId: row.thread_id,
  parentId: row.parent_id,
  authorId: row.author_id,
  authorAlias: row.author_alias || 'Unknown member',
  body: row.body,
  status: row.status,
  score: row.score ?? 0,
  createdAt: row.created_at
});

const fail = (error) => {
  if (isMissingRelation(error)) throw new ForumSchemaMissing();
  throw error;
};

export function validateThread({ title = '', body = '' }) {
  const cleanTitle = String(title).trim();
  const cleanBody = String(body).trim();
  if (cleanTitle.length < FORUM_LIMITS.titleMin) return `Title must be at least ${FORUM_LIMITS.titleMin} characters.`;
  if (cleanTitle.length > FORUM_LIMITS.title) return `Title must be ${FORUM_LIMITS.title} characters or fewer.`;
  if (cleanBody.length === 0) return 'A thread needs a body.';
  if (cleanBody.length > FORUM_LIMITS.body) return `Body must be ${FORUM_LIMITS.body} characters or fewer.`;
  return null;
}

export function validateReply(body = '') {
  const clean = String(body).trim();
  if (clean.length === 0) return 'A reply cannot be empty.';
  if (clean.length > FORUM_LIMITS.reply) return `Reply must be ${FORUM_LIMITS.reply} characters or fewer.`;
  return null;
}

export async function fetchThreads(categoryId) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('forum_threads')
    .select(THREAD_FIELDS)
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(FORUM_LIMITS.pageSize);

  if (error) fail(error);
  return (data || []).map(mapThread);
}

export async function fetchRecentThreads(limit = 8) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('forum_threads')
    .select(THREAD_FIELDS)
    .eq('status', 'published')
    .order('last_activity_at', { ascending: false })
    .limit(limit);

  if (error) fail(error);
  return (data || []).map(mapThread);
}

export async function fetchThread(threadId) {
  if (!isSupabaseConfigured || !threadId) return null;

  const { data, error } = await supabase
    .from('forum_threads')
    .select(THREAD_FIELDS)
    .eq('id', threadId)
    .maybeSingle();

  if (error) fail(error);
  return data ? mapThread(data) : null;
}

export async function fetchPosts(threadId) {
  if (!isSupabaseConfigured || !threadId) return [];

  const { data, error } = await supabase
    .from('forum_posts')
    .select(POST_FIELDS)
    .eq('thread_id', threadId)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(300);

  if (error) fail(error);
  return (data || []).map(mapPost);
}

export async function createThread({ categoryId, authorId, title, body }) {
  if (!isSupabaseConfigured) throw new Error('This build has no Supabase project configured, so threads cannot be posted.');
  const validationError = validateThread({ title, body });
  if (validationError) throw new Error(validationError);

  const { data, error } = await supabase
    .from('forum_threads')
    .insert({ category_id: categoryId, author_id: authorId, title: String(title).trim(), body: String(body).trim() })
    .select(THREAD_FIELDS)
    .single();

  if (error) fail(error);
  return mapThread(data);
}

export async function createPost({ threadId, parentId = null, authorId, body }) {
  if (!isSupabaseConfigured) throw new Error('This build has no Supabase project configured, so replies cannot be posted.');
  const validationError = validateReply(body);
  if (validationError) throw new Error(validationError);

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ thread_id: threadId, parent_id: parentId, author_id: authorId, body: String(body).trim() })
    .select(POST_FIELDS)
    .single();

  if (error) fail(error);
  return mapPost(data);
}

/** The signed-in member's votes for the targets on screen, as { id: -1 | 1 }. */
export async function fetchMyVotes(memberId, targetType, targetIds) {
  if (!isSupabaseConfigured || !memberId || targetIds.length === 0) return {};

  const { data, error } = await supabase
    .from('forum_votes')
    .select('target_id, value')
    .eq('member_id', memberId)
    .eq('target_type', targetType)
    .in('target_id', targetIds);

  if (error) fail(error);
  return (data || []).reduce((acc, row) => ({ ...acc, [row.target_id]: row.value }), {});
}

/**
 * Reddit-style vote: same direction withdraws, opposite direction flips.
 * Returns the new value for that target (0, -1 or 1).
 */
export async function setVote({ memberId, targetType, targetId, value }) {
  if (!isSupabaseConfigured) throw new Error('This build has no Supabase project configured, so votes cannot be cast.');
  if (![-1, 1].includes(value)) throw new Error('Vote must be 1 or -1.');

  const { data: existing, error: readError } = await supabase
    .from('forum_votes')
    .select('value')
    .eq('member_id', memberId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle();

  if (readError) fail(readError);

  if (existing?.value === value) {
    const { error } = await supabase
      .from('forum_votes')
      .delete()
      .eq('member_id', memberId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    if (error) fail(error);
    return 0;
  }

  if (existing) {
    const { error } = await supabase
      .from('forum_votes')
      .update({ value })
      .eq('member_id', memberId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    if (error) fail(error);
    return value;
  }

  const { error } = await supabase
    .from('forum_votes')
    .insert({ member_id: memberId, target_type: targetType, target_id: targetId, value });

  if (error) fail(error);
  return value;
}

/** Deterministic ordering; no fabricated engagement. */
export function sortThreads(threads, sort = 'hot') {
  const copy = [...threads];
  if (sort === 'new') {
    return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  if (sort === 'top') {
    return copy.sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt));
  }
  const hot = (thread) => {
    const hours = Math.max(0, (Date.now() - new Date(thread.lastActivityAt || thread.createdAt).getTime()) / 3600000);
    return (thread.score + 1) / Math.pow(hours + 2, 1.5);
  };
  return copy.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || hot(b) - hot(a));
}

/** Relative time for list metadata; deterministic given a clock. */
export function relativeTime(value, now = Date.now()) {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '';
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Build a reply tree from flat rows, tolerating orphaned parents. */
export function buildReplyTree(posts) {
  const byId = new Map(posts.map((post) => [post.id, { ...post, children: [] }]));
  const roots = [];
  for (const post of byId.values()) {
    if (post.parentId && byId.has(post.parentId)) byId.get(post.parentId).children.push(post);
    else roots.push(post);
  }
  return roots;
}
