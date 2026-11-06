import React, { useState } from 'react';
import { useActiveAccount } from "thirdweb/react";
import { useAppStore } from '../../store/useAppStore';
import SafeIcon from '../../common/SafeIcon';
import DOMPurify from 'isomorphic-dompurify';
import { enrollMember, guildForSkills } from '../../lib/api/members';

/**
 * The muster roll — where a visitor becomes a member.
 *
 * Audit F37: this form used to be the site's primary conversion surface and it enrolled
 * nobody. It blocked itself behind a connected wallet ("Law 4 says wallet linking is
 * optional" — it was mandatory), collected a personal signature, sent a transaction to the
 * treasury Safe calling `submitMusterSignature(bytes)` — a function no deployed contract
 * implements — and wrote an alias to `localStorage`. The `members` table was never touched,
 * yet the member was told `[ MUSTER_SIGNATURE_SUCCESSFUL ]` and silently promoted to
 * Navigator (audit F39).
 *
 * What happens now:
 *   - A Pirate Passport (Email OTP) is the identity. Without one the form asks for one
 *     rather than pretending to file anything.
 *   - Filing writes the signed-in member's own `members` row (RLS: `auth.uid() = id`).
 *   - A wallet is optional. When one is connected it is offered as an optional link, and
 *     only stored after the wallet signs proof of control. Declining the signature files
 *     the record without a wallet.
 *   - Rank and guild come back from the database. This browser does not assign them.
 */

export function MusterRoll() {
  const {
    musterRollDraft,
    updateMusterRoll,
    addToast,
    passport,
    refreshPassport,
    openPassport
  } = useAppStore();
  const account = useActiveAccount();
  const address = account?.address;

  const [filing, setFiling] = useState(false);
  const [editing, setEditing] = useState(false);
  const isSignedIn = Boolean(passport.session?.user);
  const member = passport.member;
  const showRecord = Boolean(member) && !editing;

  const alias = musterRollDraft.alias;
  const skills = musterRollDraft.skills;
  const draftGuild = guildForSkills(skills);

  const linkWallet = async () => {
    if (!account) return null;
    // Proof of control, not storage of the signature: the signature is checked here and
    // discarded, and only the address is written to the row.
    await account.signMessage({
      message: `Link this wallet to an American Pirate Federation Pirate Passport:\n${address}`
    });
    return address;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSignedIn) {
      openPassport();
      addToast('[ PASSPORT: ESTABLISH AN IDENTITY BEFORE FILING A RECORD ]', 'warning');
      return;
    }

    const sanitizedAlias = DOMPurify.sanitize(alias).trim();
    if (!sanitizedAlias) {
      addToast('[ MUSTER: AN ALIAS IS REQUIRED ]', 'error');
      return;
    }

    setFiling(true);
    updateMusterRoll({ walletAddress: address || '' });

    let walletAddress = null;
    let walletNote = null;

    if (account) {
      try {
        walletAddress = await linkWallet();
      } catch (err) {
        // A refused signature is not a failure to enrol — the wallet is optional.
        walletNote = 'wallet-not-linked';
      }
    }

    try {
      const { member: filed, walletRejected } = await enrollMember({
        userId: passport.session.user.id,
        email: passport.session.user.email,
        alias: sanitizedAlias,
        skills: DOMPurify.sanitize(skills),
        walletAddress
      });

      await refreshPassport();
      updateMusterRoll({ status: 'enrolled' });
      setEditing(false);

      if (walletRejected) {
        addToast('[ MUSTER: RECORD FILED — THAT WALLET IS ALREADY LINKED TO ANOTHER PASSPORT ]', 'warning');
      } else if (walletNote === 'wallet-not-linked') {
        addToast('[ MUSTER: RECORD FILED — WALLET NOT LINKED (SIGNATURE DECLINED) ]', 'success');
      } else {
        addToast(
          `[ MUSTER: RECORD FILED — ${(filed?.role || 'Deckhand').toUpperCase()} ON THE ROLL ]`,
          'success'
        );
      }
    } catch (err) {
      addToast(`[ MUSTER: ${(err?.message || 'THE RECORD COULD NOT BE FILED').toUpperCase()} ]`, 'error');
      updateMusterRoll({ status: 'error' });
    } finally {
      setFiling(false);
    }
  };

  return (
    <section id="join" className="py-20 sm:py-24">
      <div className="apf-container max-w-3xl">
        <div className="max-w-2xl">
          <p className="apf-kicker">Membership</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Join the muster roll
          </h2>
          <p className="apf-lede mt-4">
            One alias, one Passport. No wallet, no gas, no address required. Rank and guild
            are assigned by the Federation and read back from your record.
          </p>
        </div>

        <div className="apf-card mt-10 p-6 sm:p-8 lg:p-10">
        {showRecord ? (
          /* ---------- Filed: the Federation's record, read back ---------- */
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                On the muster roll
              </div>
              <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Alias</dt>
                  <dd className="mt-1 text-base font-medium text-white">{member.alias}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Clearance</dt>
                  <dd className="mt-1 text-base font-medium text-emerald-300">{member.role}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Guild</dt>
                  <dd className="mt-1 text-base font-medium text-apf-purpleLight">{member.guild}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Signal endpoint</dt>
                  <dd className="mt-1 break-all text-sm text-white">{member.email}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Linked wallet</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-ink-muted">
                    {member.wallet_address || 'None linked — optional by design.'}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-xs leading-relaxed text-ink-dim">
              Clearance is assigned by the Federation and read from your record. This browser
              cannot raise it. To amend the entry, edit the fields below and file again — the
              existing record is updated, not duplicated.
            </p>
            <button
              type="button"
              onClick={() => {
                updateMusterRoll({ alias: member.alias, status: 'idle' });
                setEditing(true);
              }}
              className="apf-btn apf-btn-ghost w-full"
            >
              Amend this entry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            {!isSignedIn && (
              <div
                role="status"
                className="rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 text-sm text-amber-200"
              >
                <div className="flex items-center gap-2 font-medium text-amber-300">
                  <SafeIcon name="Lock" className="h-4 w-4" /> A Pirate Passport is required
                </div>
                <p className="mt-2 leading-relaxed text-amber-100/80">
                  Your record is filed against your Passport, not against a wallet. Sign in
                  with an email one-time code — no wallet, no gas, no address required.
                </p>
                <button
                  type="button"
                  onClick={openPassport}
                  className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-amber-400/40 px-3 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/10"
                >
                  Establish Passport
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.12em] text-ink-dim" htmlFor="alias">
                Callsign
              </label>
              <input
                id="alias"
                type="text"
                required
                maxLength={64}
                value={alias}
                onChange={(e) => updateMusterRoll({ alias: e.target.value })}
                className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                placeholder="e.g. Ghost Vessel"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                Signal endpoint
              </span>
              <div className="w-full break-all rounded-lg border border-white/[0.06] bg-surface-950/60 px-3.5 py-3 text-sm text-ink-muted">
                {passport.session?.user?.email || 'Passport required'}
              </div>
              <p className="text-xs leading-relaxed text-ink-dim">
                Your Passport address. The Federation writes to this and nothing else.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.12em] text-ink-dim" htmlFor="skills">
                Skills
              </label>
              <textarea
                id="skills"
                rows={3}
                maxLength={280}
                value={skills}
                onChange={(e) => updateMusterRoll({ skills: e.target.value })}
                className="w-full resize-none rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                placeholder="Code, logistics, agitprop, healthcare…"
              />
              <p className="text-xs text-ink-dim">
                Guild on filing: <span className="text-apf-purpleLight">{draftGuild}</span>
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                Wallet <span className="normal-case tracking-normal">(optional)</span>
              </span>
              <div className="w-full break-all rounded-lg border border-white/[0.06] bg-surface-950/60 px-3.5 py-3 text-sm text-ink-muted">
                {address || 'No wallet connected — the record files without one.'}
              </div>
              <p className="text-xs leading-relaxed text-ink-dim">
                A connected wallet is linked only after it signs proof of control. Declining
                the signature files the record with no wallet attached.
              </p>
            </div>

            <button
              type="submit"
              disabled={filing || !alias.trim()}
              className="apf-btn apf-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SafeIcon name="UploadCloud" className="h-4 w-4" />
              {filing ? 'Filing record…' : 'File record on the muster roll'}
            </button>
          </form>
        )}
        </div>
      </div>
    </section>
  );
}
