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
    <div id="join" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500 p-6 sm:p-10 lg:p-12 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-apf-purple to-transparent" />

        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-vt323 font-black uppercase tracking-widest mb-4">
            Authorize Connection Sequence
          </h2>
          {/* The underscore token cannot wrap between characters, so 0.3em tracking at
              text-lg overflowed a 375px viewport by 62px and gave the whole home page a
              horizontal scrollbar. Scale the tracking with the breakpoint and allow the
              token itself to break as a last resort. */}
          <p className="font-vt323 text-apf-purple text-xs sm:text-lg uppercase tracking-[0.15em] sm:tracking-[0.3em] break-all">
            [ INITIALIZE_CONNECTION_SEQUENCE ]
          </p>
        </div>

        {showRecord ? (
          /* ---------- Filed: the Federation's record, read back ---------- */
          <div className="space-y-6">
            <div className="border border-apf-emerald/40 bg-apf-emerald/5 p-6 font-vt323">
              <div className="text-apf-emerald uppercase tracking-widest text-sm mb-4">
                [ ON THE MUSTER ROLL ]
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 uppercase tracking-widest text-xs">Alias</dt>
                  <dd className="text-white text-lg uppercase">{member.alias}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 uppercase tracking-widest text-xs">Clearance</dt>
                  <dd className="text-apf-emerald text-lg uppercase">{member.role}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 uppercase tracking-widest text-xs">Guild</dt>
                  <dd className="text-apf-purple text-lg uppercase">{member.guild}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 uppercase tracking-widest text-xs">Signal endpoint</dt>
                  <dd className="text-white text-base break-all">{member.email}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 uppercase tracking-widest text-xs">Linked wallet</dt>
                  <dd className="text-white text-base break-all font-mono">
                    {member.wallet_address || 'None linked — optional by design.'}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="font-vt323 text-xs text-gray-500 uppercase leading-relaxed">
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
              className="w-full font-vt323 font-bold py-3 px-8 border border-apf-purple/40 text-apf-purple hover:bg-apf-purple/10 transition-all uppercase tracking-widest"
            >
              Amend this entry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {!isSignedIn && (
              <div
                role="status"
                className="border border-amber-500/40 bg-amber-500/5 p-4 font-vt323 text-sm text-amber-200"
              >
                <div className="uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-2">
                  <SafeIcon name="Lock" className="h-4 w-4" /> A Pirate Passport is required
                </div>
                <p className="font-sans text-gray-300 leading-relaxed">
                  Your record is filed against your Passport, not against a wallet. Sign in
                  with an email one-time code — no wallet, no gas, no address required.
                </p>
                <button
                  type="button"
                  onClick={openPassport}
                  className="mt-3 px-4 py-2 border border-amber-400/60 text-amber-200 hover:bg-amber-400/10 transition-colors uppercase tracking-widest text-xs"
                >
                  Establish Passport
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="alias">
                Alias_Callsign
              </label>
              <input
                id="alias"
                type="text"
                required
                maxLength={64}
                value={alias}
                onChange={(e) => updateMusterRoll({ alias: e.target.value })}
                className="w-full bg-black border-b border-gray-800 p-3 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors"
                placeholder="Ex: Ghost_Vessel"
              />
            </div>

            <div className="space-y-2">
              <span className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block">
                Signal_Endpoint
              </span>
              <div className="w-full bg-black border-b border-gray-800 p-3 text-white opacity-70 font-vt323 text-lg break-all">
                {passport.session?.user?.email || '[ PASSPORT REQUIRED ]'}
              </div>
              <p className="font-vt323 text-xs text-gray-500 uppercase">
                Your Passport address. The Federation writes to this and nothing else.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block" htmlFor="skills">
                Primary_Skillset
              </label>
              <textarea
                id="skills"
                rows={3}
                maxLength={280}
                value={skills}
                onChange={(e) => updateMusterRoll({ skills: e.target.value })}
                className="w-full bg-black border border-gray-800 p-4 text-white focus:outline-none focus:border-apf-purple font-vt323 text-lg transition-colors resize-none"
                placeholder="Code, Logistics, Agitprop, Healthcare..."
              />
              <p className="font-vt323 text-xs text-gray-500 uppercase">
                Guild on filing: <span className="text-apf-purple">{draftGuild}</span>
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-vt323 text-apf-purple text-sm uppercase tracking-widest block">
                Wallet_link <span className="text-gray-600">(optional)</span>
              </span>
              <div className="w-full bg-black border-b border-gray-800 p-3 text-white opacity-70 font-vt323 text-lg break-all">
                {address || 'No wallet connected — the record files without one.'}
              </div>
              <p className="font-vt323 text-xs text-gray-500 uppercase">
                A connected wallet is linked only after it signs proof of control. Declining
                the signature files the record with no wallet attached.
              </p>
            </div>

            <button
              type="submit"
              disabled={filing || !alias.trim()}
              className={`w-full font-vt323 font-bold py-5 px-8 transition-all uppercase tracking-widest flex justify-center items-center gap-3 text-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                filing ? 'bg-gray-800 text-gray-500' : 'bg-apf-purple hover:bg-white hover:text-apf-black text-white shadow-[0_0_20px_rgba(148,0,255,0.3)]'
              }`}
            >
              <SafeIcon name="UploadCloud" />
              {filing ? '[ FILING RECORD... ]' : '[ FILE RECORD ON THE MUSTER ROLL ]'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
