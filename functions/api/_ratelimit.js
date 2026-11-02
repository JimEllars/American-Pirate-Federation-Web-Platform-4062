/**
 * Fixed-window rate limiting for Pages Functions.
 *
 * IMPORTANT — scope of this guarantee: Cloudflare Pages Functions run in short-lived V8
 * isolates with no durable storage. This counter lives in one isolate's memory, so it
 * limits bursts that hit the same instance and resets on cold start. It is a meaningful
 * brake on the "single script hammering the endpoint" case; it is NOT a global quota.
 *
 * For a hard, cluster-wide limit, bind a KV namespace or a Durable Object and swap the
 * bucket implementation below. That requires a wrangler.toml binding + dashboard config,
 * which is why it is called out here rather than silently assumed.
 */

const buckets = new Map();
const MAX_TRACKED_KEYS = 5000;

export const clientIp = (request) =>
  request.headers.get('cf-connecting-ip') ||
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  'unknown';

/**
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
 */
export const rateLimit = (key, { limit, windowMs }) => {
  const now = Date.now();

  // Opportunistic sweep so a long-lived isolate cannot grow unbounded.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
};
