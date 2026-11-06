import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import SafeIcon from '../common/SafeIcon';
import { useAppStore } from '../store/useAppStore';
import {
  PROFILE_LIMITS,
  ProfileSchemaMissing,
  fetchMyProfile,
  saveProfile
} from '../lib/api/profiles';

/**
 * /profile — the member's own profile (Phase A).
 *
 * The profile is private until the member publishes it. Rank and guild are read-only here:
 * they come from the muster record, not from a form. Saving writes only the member's own
 * `profiles` row; RLS enforces ownership.
 */

export function Profile() {
  const { passport, openPassport, addToast, refreshPassport } = useAppStore();
  const member = passport.member;
  const isSignedIn = Boolean(passport.session?.user);

  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [social, setSocial] = useState('');
  const [visibility, setVisibility] = useState('private');

  useEffect(() => {
    let isMounted = true;
    if (!member?.id) {
      setLoading(false);
      return () => { isMounted = false; };
    }

    const load = async () => {
      setLoading(true);
      try {
        const existing = await fetchMyProfile(member.id);
        if (!isMounted || !existing) return;
        setHeadline(existing.headline);
        setBio(existing.bio);
        setVisibility(existing.visibility);
        const web = existing.links.find((link) => link.label.toLowerCase() === 'website');
        const other = existing.links.find((link) => link.label.toLowerCase() !== 'website');
        setWebsite(web?.url || '');
        setSocial(other?.url || '');
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof ProfileSchemaMissing) setSchemaMissing(true);
        else addToast(`[ PROFILE: ${(err?.message || 'COULD NOT LOAD').toUpperCase()} ]`, 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [member?.id, addToast]);

  const links = useMemo(() => {
    const next = [];
    if (website.trim()) next.push({ label: 'Website', url: website.trim() });
    if (social.trim()) next.push({ label: 'Social', url: social.trim() });
    return next;
  }, [website, social]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!member?.id || saving) return;

    setSaving(true);
    try {
      await saveProfile(member.id, { headline, bio, links, visibility });
      addToast('[ PROFILE: SAVED ]', 'success');
    } catch (err) {
      if (err instanceof ProfileSchemaMissing) {
        setSchemaMissing(true);
        addToast('[ PROFILE: THE PROFILES MIGRATION HAS NOT BEEN APPLIED ]', 'error');
      } else {
        addToast(`[ PROFILE: ${(err?.message || 'SAVE FAILED').toUpperCase()} ]`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (passport.status === 'unknown') {
    return (
      <Layout>
        <SEO title="Profile | American Pirate Federation" description="Your member profile." />
        <PageTransition>
          <div className="apf-container py-20">
            <p className="text-sm text-ink-dim">Checking session…</p>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <SEO title="Profile | American Pirate Federation" description="Your member profile." />
        <PageTransition>
          <div className="apf-container max-w-2xl py-16 sm:py-24">
            <PageHeader icon="User" kicker="Identity" title="Your profile" lede="A profile belongs to a Pirate Passport. Sign in to create or edit yours." />
            <div className="apf-card p-8 text-center">
              <SafeIcon name="Key" className="mx-auto h-8 w-8 text-apf-purpleLight" />
              <p className="mt-4 text-base font-medium text-white">Sign in to continue</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                Email one-time code. No wallet, no gas, no address required.
              </p>
              <button onClick={openPassport} className="apf-btn apf-btn-primary mt-6">
                Open Pirate Passport
              </button>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (!member) {
    return (
      <Layout>
        <SEO title="Profile | American Pirate Federation" description="Your member profile." />
        <PageTransition>
          <div className="apf-container max-w-2xl py-16 sm:py-24">
            <PageHeader icon="User" kicker="Identity" title="Your profile" lede="Your Passport is valid, but the Federation has no member record for it yet." />
            <div className="apf-card p-8 text-center">
              <SafeIcon name="ClipboardList" className="mx-auto h-8 w-8 text-amber-300" />
              <p className="mt-4 text-base font-medium text-white">File a muster entry first</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                Profiles attach to a member record. Your rank and guild come from that record,
                so it has to exist before a profile can.
              </p>
              <Link to="/#join" className="apf-btn apf-btn-primary mt-6">
                Go to the muster roll
              </Link>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Profile | American Pirate Federation" description="Your member profile." />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="User"
            kicker="Identity"
            title="Your profile"
            lede="Your profile is yours. Rank and guild come from the muster roll; everything else here is private until you publish it."
            actions={<Link to="/members" className="apf-btn apf-btn-ghost">Member directory</Link>}
          />

          {schemaMissing && (
            <div role="status" className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 text-sm text-amber-200">
              The profiles table has not been created in this Supabase project yet. Apply
              <code className="mx-1 text-amber-300">supabase/migrations/20261106090000_member_profiles.sql</code>
              to enable saving and the directory.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            <form onSubmit={handleSave} className="apf-card p-6 sm:p-8 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <h2 className="text-lg font-semibold text-white">Edit profile</h2>
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                  {member.alias} · {member.role}
                </span>
              </div>

              {loading ? (
                <p className="py-10 text-sm text-ink-dim">Loading profile…</p>
              ) : (
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="profile-headline" className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                      Headline
                    </label>
                    <input
                      id="profile-headline"
                      type="text"
                      maxLength={PROFILE_LIMITS.headline}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="What you work on, in one line"
                      className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                    />
                    <p className="mt-1 text-right text-[11px] text-ink-dim">{headline.length}/{PROFILE_LIMITS.headline}</p>
                  </div>

                  <div>
                    <label htmlFor="profile-bio" className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                      Bio
                    </label>
                    <textarea
                      id="profile-bio"
                      rows={5}
                      maxLength={PROFILE_LIMITS.bio}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Skills, guild work, what you want to build with the Federation."
                      className="w-full resize-none rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm leading-relaxed text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                    />
                    <p className="mt-1 text-right text-[11px] text-ink-dim">{bio.length}/{PROFILE_LIMITS.bio}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="profile-website" className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                        Website
                      </label>
                      <input
                        id="profile-website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://"
                        className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-social" className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                        Social
                      </label>
                      <input
                        id="profile-social"
                        type="url"
                        value={social}
                        onChange={(e) => setSocial(e.target.value)}
                        placeholder="https://"
                        className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  <fieldset>
                    <legend className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">Visibility</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['private', 'Private', 'Only you can read it. This is the default.'],
                        ['public', 'Public', 'Listed in the member directory with your alias, rank and guild.']
                      ].map(([value, label, description]) => (
                        <label
                          key={value}
                          className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                            visibility === value
                              ? 'border-apf-purple/40 bg-apf-purple/[0.08]'
                              : 'border-white/[0.08] hover:border-white/20'
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-white">
                            <input
                              type="radio"
                              name="profile-visibility"
                              value={value}
                              checked={visibility === value}
                              onChange={() => setVisibility(value)}
                              className="accent-[#9400D3]"
                            />
                            {label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{description}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <button type="submit" disabled={saving || loading || schemaMissing} className="apf-btn apf-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              )}
            </form>

            <aside className="lg:col-span-5">
              <div className="apf-card p-6">
                <div className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Preview</div>
                <h2 className="mt-3 text-xl font-semibold text-white">{member.alias}</h2>
                <p className="mt-1 text-sm text-ink-muted">{headline || 'No headline yet'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.1] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-ink-muted">{member.role}</span>
                  <span className="rounded-full border border-white/[0.1] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-ink-muted">{member.guild}</span>
                </div>
                {bio && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{bio}</p>}
                {links.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4 text-sm">
                    {links.map((link) => (
                      <li key={link.label}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-apf-purpleLight hover:text-white">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-5 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-ink-dim">
                  {visibility === 'public'
                    ? 'This preview is what other members will see in the directory.'
                    : 'Private: only you can read this profile. It is not in the directory.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => refreshPassport()}
                className="mt-4 text-xs text-ink-dim transition-colors hover:text-white"
              >
                Refresh identity from the muster roll
              </button>
            </aside>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
