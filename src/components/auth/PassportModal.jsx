import React, { useEffect, useRef, useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { supabase, isSupabaseConfigured } from '../../lib/api/supabaseClient';
import { useAppStore } from '../../store/useAppStore';

/**
 * The Pirate Passport (SOP Architectural Law 4: sovereign, frictionless onboarding).
 *
 * Audit F38: this dialog used to be two half-dialogs. Signed out, it sent an Email OTP and
 * then had no idea a session existed — reopening it showed the sign-in form again, forever.
 * Signed in (with a wallet), it showed "Clearance: NAVIGATOR" and "Guild: …" read straight
 * out of `localStorage`, which meant the dialog's only identity display was the one value
 * the Federation had never issued.
 *
 * It now renders the account: the email actually signed in, and the member row that account
 * owns — rank and guild as stored in Postgres. Signed in but not on the roll is stated as
 * exactly that, with a route to the muster form.
 */

export function PassportModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const { passport, signOutPassport, refreshPassport } = useAppStore();
  const dialogRef = useRef(null);

  // Keyboard + focus handling so the dialog behaves like a dialog (it previously had no
  // role, no aria-modal, and no Escape handler).
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  // Re-read the account every time the dialog opens, so a link clicked in another tab is
  // reflected here without a reload.
  useEffect(() => {
    if (isOpen) refreshPassport();
  }, [isOpen, refreshPassport]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('sending');
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      setErrorMessage(err?.message || '');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  const sessionEmail = passport.session?.user?.email;
  const member = passport.member;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-title"
        tabIndex={-1}
        className="bg-apf-black border border-apf-purple/50 max-w-md w-full relative overflow-hidden p-6 font-vt323 focus:outline-none focus:ring-2 focus:ring-apf-purple/60"
      >
        <button
          onClick={onClose}
          aria-label="Close passport"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
            <SafeIcon name="X" className="h-6 w-6" />
        </button>

        <h2 id="passport-title" className="text-2xl text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <SafeIcon name="Shield" className="text-apf-purple h-6 w-6" /> Pirate Passport
        </h2>

        {passport.status === 'unknown' ? (
          <p className="text-gray-400 text-sm">[ CHECKING SESSION… ]</p>
        ) : sessionEmail ? (
          /* ---------- Signed in: the actual account ---------- */
          <div className="space-y-4">
            <div className="bg-black/50 border border-gray-800 p-4 text-sm">
              <div className="text-gray-400 uppercase tracking-widest mb-1 text-xs">Signal endpoint</div>
              <div className="text-white text-base break-all mb-4">{sessionEmail}</div>

              {member ? (
                <>
                  <div className="text-gray-400 uppercase tracking-widest mb-1 text-xs">Alias</div>
                  <div className="text-white text-lg uppercase tracking-wider mb-4">{member.alias}</div>

                  <div className="text-gray-400 uppercase tracking-widest mb-1 text-xs">Clearance</div>
                  <div className="text-apf-emerald text-lg uppercase tracking-wider mb-4">{member.role}</div>

                  <div className="text-gray-400 uppercase tracking-widest mb-1 text-xs">Guild</div>
                  <div className="text-apf-purple text-lg uppercase tracking-wider">{member.guild}</div>
                </>
              ) : (
                <div className="border-t border-gray-800 pt-4">
                  <div className="text-amber-300 uppercase tracking-widest text-xs mb-1">
                    [ NOT ON THE MUSTER ROLL ]
                  </div>
                  <p className="text-gray-300 text-sm leading-snug">
                    This Passport is valid but carries no member record, so the Federation has
                    not assigned a rank. File an entry in the muster form on the home page.
                  </p>
                </div>
              )}
            </div>

            {passport.status === 'error' && passport.error && (
              <p className="text-amber-400 text-xs leading-snug">
                [ MUSTER ROLL UNREACHABLE: {passport.error} ]
              </p>
            )}

            <button
              onClick={async () => {
                await signOutPassport();
                onClose?.();
              }}
              className="w-full border border-gray-800 hover:border-red-500/50 text-gray-400 hover:text-red-400 px-4 py-3 uppercase tracking-widest transition-all text-sm"
            >
              [ End Passport Session ]
            </button>
          </div>
        ) : (
          /* ---------- Signed out: request an Email OTP ---------- */
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-gray-400 text-sm leading-tight mb-4">
                Establish a secure uplink. Enter your comm-link address to receive a one-time
                access code.
            </p>
            <div>
                <input
                type="email"
                required
                aria-label="Email address for the one-time access code"
                placeholder="Enter comm-link address..."
                className="w-full bg-black/50 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-apf-purple transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={status === 'sending' || status === 'success' || !isSupabaseConfigured}
                className="w-full bg-apf-purple hover:bg-apf-purpleLight text-white px-4 py-3 uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'sending' ? '[ INITIATING UPLINK... ]' :
                 status === 'success' ? '[ TRANSMISSION SENT ]' :
                 'Request Access Sequence'}
            </button>

            {!isSupabaseConfigured && (
              <p className="text-amber-400 text-xs leading-snug">
                [ THIS BUILD HAS NO SUPABASE PROJECT CONFIGURED — SIGN-IN IS UNAVAILABLE ]
              </p>
            )}

            {status === 'success' && (
              <p className="text-apf-emerald text-sm mt-2 leading-snug">
                Check that address for a one-time link. Opening it signs this browser in; the
                passport above updates on return.
              </p>
            )}

            {status === 'error' && (
              <p className="text-red-500 text-sm mt-2 leading-snug">
                [ UPLINK FAILED{errorMessage ? `: ${errorMessage}` : '. VERIFY COORDINATES.'} ]
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
