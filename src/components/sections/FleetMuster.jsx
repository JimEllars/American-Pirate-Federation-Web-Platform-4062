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
    <div className="flex flex-col p-6 border-b border-gray-800 hover:bg-apf-purple/5 transition-colors group">
      <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <div className="text-4xl font-black text-apf-purple/40 group-hover:text-apf-purple transition-colors">
              {(event.date || 'TBD').split(' ')[0]}
              <span className="block text-sm uppercase text-gray-500">{(event.date || '').split(' ')[1] || 'DATE PENDING'}</span>
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400">
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
              className={`px-6 py-2 border font-mono text-xs uppercase transition-all tracking-widest ${
                hasRSVPd
                  ? 'bg-apf-purple text-white border-apf-purple cursor-default'
                  : isEnrolled
                    ? (registering ? 'border-gray-500 text-gray-500 cursor-wait bg-black/50' : 'border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white')
                    : 'border-gray-800 text-gray-600 cursor-not-allowed bg-black/50'
              }`}>
              {registering ? 'Filing Signal…' : (hasRSVPd ? 'Signal Registered' : (isEnrolled ? 'Register Signal' : 'Muster Entry Reqd'))}
            </button>
          </div>
      </div>
      
      {/* Registered Signals List */}
      <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-wrap items-center gap-3">
          <span className="font-vt323 text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <SafeIcon name="Radio" className="h-3 w-3" /> Signals Detected:
          </span>
          <div className="flex flex-wrap gap-2 items-center">
              {ownSignal ? (
                  <span className="font-vt323 text-xs px-2 py-0.5 border border-apf-emerald text-apf-emerald bg-apf-emerald/10">
                      {ownSignal}
                  </span>
              ) : (
                  <span className="font-vt323 text-xs text-gray-600">
                      No public signal roll published for this muster.
                  </span>
              )}
          </div>
      </div>
    </div>
  );
}
