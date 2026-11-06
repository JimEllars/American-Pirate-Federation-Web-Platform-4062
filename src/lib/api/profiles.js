import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Member profiles (Phase A of docs/community-platform-roadmap.md).
 *
 * `profiles` is owner-write/owner-read. The public directory is a separate read-only view
 * (`public_directory`) that exposes only the fields a member marked public — never email,
 * never wallet address. Both are created by
 * supabase/migrations/20261106090000_member_profiles.sql.
 */

export const PROFILE_LIMITS = {
  headline: 120,
  bio: 1200,
  links: 5,
  linkLabel: 40,
  linkUrl: 300
};

const isMissingRelation = (error) =>
  Boolean(error) && (error.code === '42P01' || /does not exist|schema cache/i.test(error.message || ''));

export class ProfileSchemaMissing extends Error {
  constructor() {
    super('The profiles table has not been created in this Supabase project yet.');
    this.name = 'ProfileSchemaMissing';
    this.code = 'PROFILE_SCHEMA_MISSING';
  }
}

export function normalizeLinks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((link) => link && typeof link.url === 'string' && link.url.trim() !== '')
    .slice(0, PROFILE_LIMITS.links)
    .map((link) => ({
      label: String(link.label || 'Link').trim().slice(0, PROFILE_LIMITS.linkLabel),
      url: link.url.trim().slice(0, PROFILE_LIMITS.linkUrl)
    }));
}

export function validateProfile({ headline = '', bio = '', links = [] }) {
  const cleanHeadline = String(headline).trim();
  const cleanBio = String(bio).trim();

  if (cleanHeadline.length > PROFILE_LIMITS.headline) {
    return `Headline must be ${PROFILE_LIMITS.headline} characters or fewer.`;
  }
  if (cleanBio.length > PROFILE_LIMITS.bio) {
    return `Bio must be ${PROFILE_LIMITS.bio} characters or fewer.`;
  }
  for (const link of normalizeLinks(links)) {
    if (!/^https?:\/\//i.test(link.url)) {
      return 'Links must start with http:// or https://.';
    }
  }
  return null;
}

const mapProfile = (row) => ({
  memberId: row.member_id,
  headline: row.headline || '',
  bio: row.bio || '',
  links: normalizeLinks(row.links),
  visibility: row.visibility === 'public' ? 'public' : 'private',
  updatedAt: row.updated_at || null
});

/** The signed-in member's own profile, or null when they have not created one. */
export async function fetchMyProfile(memberId) {
  if (!isSupabaseConfigured || !memberId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('member_id, headline, bio, links, visibility, updated_at')
    .eq('member_id', memberId)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) throw new ProfileSchemaMissing();
    throw error;
  }
  return data ? mapProfile(data) : null;
}

/**
 * Published profiles only. Returns an empty array when nothing is published — that is not
 * an error. A missing view/table is surfaced as ProfileSchemaMissing so the page can say the
 * migration has not been applied instead of pretending nobody opted in.
 */
export async function fetchPublicDirectory() {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('public_directory')
    .select('member_id, alias, role, guild, headline, bio, links, updated_at')
    .order('updated_at', { ascending: false })
    .limit(60);

  if (error) {
    if (isMissingRelation(error)) throw new ProfileSchemaMissing();
    throw error;
  }

  return (data || []).map((row) => ({
    memberId: row.member_id,
    alias: row.alias,
    role: row.role,
    guild: row.guild,
    headline: row.headline || '',
    bio: row.bio || '',
    links: normalizeLinks(row.links),
    updatedAt: row.updated_at || null
  }));
}

/** Create or update the member's own profile. RLS enforces that memberId is the caller. */
export async function saveProfile(memberId, { headline, bio, links, visibility }) {
  if (!isSupabaseConfigured) {
    throw new Error('This build has no Supabase project configured, so profiles cannot be saved.');
  }
  if (!memberId) throw new Error('A member record is required before a profile can be saved.');

  const validationError = validateProfile({ headline, bio, links });
  if (validationError) throw new Error(validationError);

  const payload = {
    member_id: memberId,
    headline: String(headline || '').trim(),
    bio: String(bio || '').trim(),
    links: normalizeLinks(links),
    visibility: visibility === 'public' ? 'public' : 'private',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'member_id' })
    .select('member_id, headline, bio, links, visibility, updated_at')
    .single();

  if (error) {
    if (isMissingRelation(error)) throw new ProfileSchemaMissing();
    throw error;
  }
  return mapProfile(data);
}
