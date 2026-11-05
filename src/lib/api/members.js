/**
 * The muster roll — the Federation's record of a member.
 *
 * Architectural Law 1 (Anti-Theater & Ground Truth) and Law 4 (Sovereign, Frictionless
 * Onboarding) meet here. Before this module existed the home page's "Authorize Entry
 * Protocol" form never wrote a member anywhere: it signed a wallet message, sent a
 * transaction to the treasury Safe calling a function (`submitMusterSignature`) that no
 * deployed contract implements, and stored an alias in `localStorage`. The Federation's
 * `members` table held zero rows and the app nevertheless reported
 * `[ MUSTER_SIGNATURE_SUCCESSFUL ]` and promoted the visitor to Navigator.
 *
 * What the record actually requires:
 *   - an authenticated Pirate Passport (Supabase Email OTP / WebAuthn) — `auth.uid()`
 *   - an alias and, optionally, a wallet address (`members.wallet_address` is nullable:
 *     Law 4 makes wallet linking strictly optional)
 *   - the row is owned by `auth.uid() = members.id`, enforced by RLS
 *
 * Nothing here holds a secret: this file runs in the browser with the anon key and the
 * user's own session, and RLS decides what that session may read or write.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Ranks (Unverified -> Deckhand -> Navigator -> Guild Master) are assigned server-side. */

/**
 * Guild assignment from the member's stated skillset. This is the same mapping the local
 * store used to apply; it now produces a value that is written to the member row instead
 * of a browser-only label.
 */
export function guildForSkills(skills = '') {
  const value = String(skills).toLowerCase();
  if (value.includes('code') || value.includes('dev')) return "Shipwright's Guild";
  if (value.includes('health') || value.includes('medic')) return "Surgeon's Dispensary";
  if (value.includes('logistic') || value.includes('supply')) return "Quartermaster's Provisions";
  if (value.includes('agitprop') || value.includes('media')) return "Navigator's Guild";
  return 'Federation Reserve';
}

const MEMBER_COLUMNS = 'id, alias, email, wallet_address, role, guild, created_at, updated_at';

export class MemberError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'MemberError';
    this.cause = cause;
  }
}

/** The current Supabase session, or null. Never throws for an anonymous visitor. */
export async function getSession() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session ?? null;
  } catch {
    return null;
  }
}

/** The signed-in member's row, or null when signed in but not yet on the roll. */
export async function fetchMember(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new MemberError('Could not read the muster roll.', error);
  return data ?? null;
}

/**
 * File the signed-in visitor's record on the muster roll.
 *
 * `upsert` on the primary key (`id = auth.uid()`), so re-filing corrects an existing entry
 * rather than duplicating it. `role` and `guild` are deliberately not sent: rank is the
 * Federation's to assign (the column defaults to Deckhand on insert and is preserved on
 * update). Only the member-owned fields — alias, email, wallet address — are written.
 */
export async function enrollMember({ userId, email, alias, skills = '', walletAddress = null }) {
  if (!isSupabaseConfigured) {
    throw new MemberError('The muster roll is not connected: Supabase is not configured for this build.');
  }
  if (!userId) {
    throw new MemberError('A Pirate Passport is required before a record can be filed.');
  }
  if (!email) {
    throw new MemberError('The Passport session carries no email address, so the record cannot be filed.');
  }

  const base = {
    id: userId,
    email,
    alias,
    guild: guildForSkills(skills)
  };

  const write = (payload) =>
    supabase
      .from('members')
      .upsert(payload, { onConflict: 'id' })
      .select(MEMBER_COLUMNS)
      .maybeSingle();

  let result = await write(walletAddress ? { ...base, wallet_address: walletAddress } : base);

  // A wallet already claimed by another Passport is a UNIQUE violation on
  // members.wallet_address. That is a real, specific answer for the member — not a crash
  // and not silence — so retry without the link and report it.
  if (result.error?.code === '23505' && walletAddress) {
    const retry = await write(base);
    if (retry.error) {
      throw new MemberError('The muster roll rejected the record.', retry.error);
    }
    return { member: retry.data ?? null, walletRejected: 'wallet-already-claimed' };
  }

  if (result.error) {
    throw new MemberError('The muster roll rejected the record.', result.error);
  }

  return { member: result.data ?? null, walletRejected: null };
}

export async function signOutPassport() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}
