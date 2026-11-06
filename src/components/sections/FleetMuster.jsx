import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';
import { registerEventSignal } from '../../lib/api/eventSignals';


export function FleetMuster({ event }) {
  const { passport, musterRollDraft, registerSignal, addToast } = useAppStore();
  const [registering, setRegistering] = useState(false);
  const member = passport.member;
  const isEnrolled = Boolean(member);
  const hasRSVPd = musterRollDraft.rsvps?.includes(event.title);

  // Law 1: no fabricated attendee roll. We can only truthfully show the current
  // user's own registered signal, because RSVP rows are not publicly readable
  // (see supabase migration 20261102000000 — event_signals is ownership-scoped).
  const ownSignal = hasRSVPd && musterRollDraft.alias ? musterRollDraft.alias : null;

  return (
    <div className="flex flex-col border-b border-white/[0.06] p-6 transition-colors last:border-b-0 hover:bg-white/[0.02]">
      <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <div className="font-display text-3xl font-semibold tracking-tight text-apf-purpleLight">
              {(event.date || 'TBD').split(' ')[0]}
              <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-ink-dim">{(event.date || '').split(' ')[1] || 'DATE PENDING'}</span>
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <SafeIcon name="MapPin" className="text-apf-purple" /> {event.location}
              </span>
              <span className="flex items-center gap-1">
                <SafeIcon name="Clock" className="text-apf-purple" /> {event.time}
              </span>
              <span className="flex items-center gap-1">
                <SafeIcon name="Users" className="text-apf-purple" /> {event.capacity}
              </span>
            </div>
          </div>

          <div className="md:w-1/4 flex items-center justify-end">
            {/* A signal is a row in `event_signals` owned by the signed-in member — no
                wallet, no signature ritual, no claim on the visitor's behalf. */}
            <button
              onClick={async () => {
                if (hasRSVPd || registering) return;

                if (!member) {
                  addToast('[ SIGNAL: FILE A MUSTER ENTRY BEFORE REGISTERING ]', 'warning');
                  return;
                }

                setRegistering(true);
                try {
                  const { alreadyRegistered } = await registerEventSignal({
                    eventId: event.id,
                    memberId: member.id
                  });
                  registerSignal(event.title);
                  addToast(
                    alreadyRegistered
                      ? '[ SIGNAL ALREADY ON THE FLEET MUSTER ]'
                      : '[ SIGNAL REGISTERED ON THE FLEET MUSTER ]',
                    'success'
                  );
                } catch (error) {
                  addToast(`[ SIGNAL FAILED: ${(error?.message || 'THE MUSTER REJECTED IT').toUpperCase()} ]`, 'error');
                } finally {
                  setRegistering(false);
                }
              }}
              disabled={registering}
              className={`min-h-[38px] rounded-lg border px-4 text-xs font-medium transition-colors ${
                hasRSVPd
                  ? 'border-apf-emerald/30 bg-emerald-400/[0.08] text-emerald-300 cursor-default'
                  : isEnrolled
                    ? (registering ? 'cursor-wait border-white/10 text-ink-dim' : 'border-white/[0.12] text-ink-muted hover:border-white/25 hover:text-white')
                     : 'cursor-not-allowed border-white/[0.06] text-ink-dim'
              }`}>
              {registering ? 'Filing Signal…' : (hasRSVPd ? 'Signal Registered' : (isEnrolled ? 'Register Signal' : 'Muster Entry Reqd'))}
            </button>
          </div>
      </div>
      
      {/* Registered Signals List */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-dim">
              <SafeIcon name="Radio" className="h-3 w-3" /> Signals Detected:
          </span>
          <div className="flex flex-wrap gap-2 items-center">
              {ownSignal ? (
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-400/[0.08] px-2 py-0.5 text-[11px] text-emerald-300">
                      {ownSignal}
                  </span>
              ) : (
                  <span className="text-[11px] text-ink-dim">
                      No public signal roll published for this muster.
                  </span>
              )}
          </div>
      </div>
    </div>
  );
}
