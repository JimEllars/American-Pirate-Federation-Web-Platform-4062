/**
 * Event signals — a member's RSVP to a fleet muster.
 *
 * `event_signals` is a real table with RLS scoped to the owning member
 * (`auth.uid() = member_id`), so this is the one participation write the browser can make
 * honestly. Before this module, the RSVP button collected a wallet signature, discarded it,
 * wrote the event title into `localStorage`, and announced
 * "[ EVENT SIGNAL CRYPTOGRAPHICALLY SECURED ]". Nothing reached the Federation.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export async function registerEventSignal({ eventId, memberId }) {
  if (!isSupabaseConfigured) {
    throw new Error('The fleet muster is not connected: Supabase is not configured for this build.');
  }
  if (!eventId || !memberId) {
    throw new Error('A member record and an event are both required to file a signal.');
  }

  const { error } = await supabase
    .from('event_signals')
    .insert({ event_id: eventId, member_id: memberId });

  // UNIQUE(event_id, member_id): a second tap is the same signal, not an error.
  if (error?.code === '23505') return { alreadyRegistered: true };
  if (error) throw new Error(error.message || 'The fleet muster rejected the signal.');

  return { alreadyRegistered: false };
}

/** The signed-in member's own signals. RLS returns nobody else's. */
export async function fetchMyEventSignals(memberId) {
  if (!isSupabaseConfigured || !memberId) return [];
  const { data, error } = await supabase
    .from('event_signals')
    .select('event_id, created_at')
    .eq('member_id', memberId);
  if (error) return [];
  return Array.isArray(data) ? data : [];
}
