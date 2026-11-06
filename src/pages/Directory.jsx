import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { ProfileSchemaMissing, fetchPublicDirectory } from '../lib/api/profiles';

/**
 * /members — the opt-in public directory (Phase A).
 *
 * Only rows a member published are listed. The view behind this page excludes email and
 * wallet address entirely, so there is nothing sensitive to leak even if the client is
 * tampered with. An empty directory is an honest result, not an error.
 */

export function Directory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchPublicDirectory();
        if (isMounted) setProfiles(rows);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof ProfileSchemaMissing) setSchemaMissing(true);
        else setError(err?.message || 'The directory is unavailable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((profile) =>
      [profile.alias, profile.headline, profile.bio, profile.guild, profile.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [profiles, query]);

  return (
    <Layout>
      <SEO
        title="Member Directory | American Pirate Federation"
        description="Published profiles of American Pirate Federation members."
      />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="Users"
            kicker="Community"
            title="Member directory"
            lede="Published profiles only. Every member chooses whether to appear here; nothing is listed by default."
            actions={<Link to="/profile" className="apf-btn apf-btn-ghost">Edit your profile</Link>}
          />

          <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-surface-900/60 px-4 py-2.5">
            <SafeIcon name="Search" className="h-4 w-4 text-ink-dim" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members by alias, guild or headline…"
              aria-label="Search members"
              className="w-full border-none bg-transparent text-sm text-white placeholder:text-ink-dim focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="apf-card flex items-center justify-center gap-3 p-12 text-sm text-ink-muted">
              <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
              Loading directory…
            </div>
          ) : schemaMissing ? (
            <div className="apf-card p-8 text-center">
              <SafeIcon name="Database" className="mx-auto h-8 w-8 text-amber-300" />
              <p className="mt-4 text-base font-medium text-white">The directory is not enabled yet</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                The profiles migration has not been applied to this Supabase project. Once it
                is, members who publish a profile will appear here.
              </p>
            </div>
          ) : error ? (
            <div className="apf-card p-8 text-center">
              <SafeIcon name="AlertTriangle" className="mx-auto h-8 w-8 text-red-400" />
              <p className="mt-4 text-base font-medium text-white">Directory unavailable</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">{error}</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="apf-card p-10 text-center">
              <SafeIcon name="Users" className="mx-auto h-8 w-8 text-ink-dim" />
              <p className="mt-4 text-base font-medium text-white">No published profiles yet</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                Members appear here only after they choose to publish a profile. Nothing is
                listed by default and no placeholder members are created.
              </p>
              <Link to="/profile" className="apf-btn apf-btn-ghost mt-6">Publish your profile</Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="apf-card p-10 text-center">
              <p className="text-base font-medium text-white">No members match “{query}”</p>
              <button type="button" onClick={() => setQuery('')} className="mt-3 text-sm text-apf-purpleLight hover:text-white">
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((profile) => (
                <article key={profile.memberId} className="apf-card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-white">{profile.alias}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        {profile.headline || 'No headline'}
                      </p>
                    </div>
                    <SafeIcon name="User" className="h-4 w-4 shrink-0 text-apf-purpleLight" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.role && (
                      <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-muted">{profile.role}</span>
                    )}
                    {profile.guild && (
                      <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-muted">{profile.guild}</span>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-muted">{profile.bio}</p>
                  )}

                  {profile.links.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-3 border-t border-white/[0.06] pt-4 text-xs">
                      {profile.links.map((link) => (
                        <a
                          key={`${link.label}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-apf-purpleLight hover:text-white"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
