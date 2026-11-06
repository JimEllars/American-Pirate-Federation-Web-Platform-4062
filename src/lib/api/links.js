/**
 * Member-supplied links (profile "website" and "social" fields).
 *
 * A profile link ends up in an `href` that every visitor to `/members` can click, so the
 * scheme is a security boundary, not a formatting detail. RLS lets a member write their own
 * `profiles` row directly through PostgREST — the form is not the only writer — so the check
 * has to exist on both sides of the wire: here for everything this app reads or writes,
 * and as a CHECK constraint in `supabase/migrations/20261106130000_profile_link_scheme.sql`
 * for everything else.
 *
 * Only http and https are links. `javascript:`, `data:`, `vbscript:` and anything else are
 * dropped, not rewritten: an unsupported scheme is not a URL we can make safe by editing.
 *
 * This module is deliberately dependency-free (no Supabase client, no `import.meta.env`) so
 * it can be unit-tested under plain Node — see `tests/unit/links.test.mjs`.
 */

export const LINK_LIMITS = {
  count: 5,
  label: 40,
  url: 300
};

// C0 controls and DEL. A tab or newline inside a URL is how `java\tscript:` style payloads
// survive naive prefix checks; we reject the whole value instead of stripping it.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
export const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * The URL as it should be stored/rendered, or '' when it is not an http(s) URL.
 */
export function safeLinkUrl(value) {
  const raw = String(value ?? '').trim().slice(0, LINK_LIMITS.url);
  if (!raw) return '';
  if (CONTROL_CHARACTERS.test(raw)) return '';
  if (!/^https?:\/\//i.test(raw)) return '';

  // `new URL` is the authority on whether the rest is well formed. It also proves the
  // protocol (not just the prefix) is http/https.
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (!parsed.hostname) return '';
  } catch {
    return '';
  }

  return raw;
}

export const isSafeLinkUrl = (value) => safeLinkUrl(value) !== '';

/**
 * Drop everything that is not a usable { label, url } pair, cap the count, and strip labels.
 * Used on read (rows written by any client) and on write (the form).
 */
export function normalizeLinks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((link) => {
      if (!link || typeof link !== 'object') return null;
      const url = safeLinkUrl(link.url);
      if (!url) return null;
      return {
        label: String(link.label ?? 'Link').trim().slice(0, LINK_LIMITS.label) || 'Link',
        url
      };
    })
    .filter(Boolean)
    .slice(0, LINK_LIMITS.count);
}
