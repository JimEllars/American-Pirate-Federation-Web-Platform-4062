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

  // Keyboard + focus handling so the dialog behaves like a dialog.
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

  const label = 'text-[11px] uppercase tracking-[0.12em] text-ink-dim';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-title"
        tabIndex={-1}
        className="apf-card relative w-full max-w-md p-6 focus:outline-none sm:p-7"
      >
        <button
          onClick={onClose}
          aria-label="Close passport"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white"
        >
            <SafeIcon name="X" className="h-5 w-5" />
        </button>

        <h2 id="passport-title" className="flex items-center gap-2 text-xl font-semibold text-white">
            <SafeIcon name="Shield" className="h-5 w-5 text-apf-purpleLight" /> Pirate Passport
        </h2>

        {passport.status === 'unknown' ? (
          <p className="mt-6 text-sm text-ink-dim">Checking session…</p>
        ) : sessionEmail ? (
          /* ---------- Signed in: the actual account ---------- */
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/[0.07] bg-surface-950/60 p-4">
              <div className={`${label} mb-1`}>Signal endpoint</div>
              <div className="mb-4 break-all text-sm text-white">{sessionEmail}</div>

              {member ? (
                <>
                  <div className={`${label} mb-1`}>Alias</div>
                  <div className="mb-4 text-base font-medium text-white">{member.alias}</div>

                  <div className={`${label} mb-1`}>Clearance</div>
                  <div className="mb-4 text-base font-medium text-emerald-300">{member.role}</div>

                  <div className={`${label} mb-1`}>Guild</div>
                  <div className="text-base font-medium text-apf-purpleLight">{member.guild}</div>
                </>
              ) : (
                <div className="border-t border-white/[0.07] pt-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-amber-300">
                    Not on the muster roll
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    This Passport is valid but carries no member record, so the Federation has
                    not assigned a rank. File an entry in the muster form on the home page.
                  </p>
                </div>
              )}
            </div>

            {passport.status === 'error' && passport.error && (
              <p className="text-xs leading-relaxed text-amber-300">
                Muster roll unreachable: {passport.error}
              </p>
            )}

            <button
              onClick={async () => {
                await signOutPassport();
                onClose?.();
              }}
              className="apf-btn apf-btn-ghost w-full"
            >
              End Passport session
            </button>
          </div>
        ) : (
          /* ---------- Signed out: request an Email OTP ---------- */
          <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-ink-muted">
              Sign in with a one-time code sent to your email. No wallet, no gas, no address
              required.
            </p>
            <div>
                <input
                type="email"
                required
                aria-label="Email address for the one-time access code"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/[0.1] bg-surface-950 px-3.5 py-3 text-sm text-white placeholder:text-ink-dim focus:border-apf-purpleLight/60 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={status === 'sending' || status === 'success' || !isSupabaseConfigured}
                className="apf-btn apf-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
                {status === 'sending' ? 'Sending code…' :
                 status === 'success' ? 'Code sent' :
                 'Send sign-in code'}
            </button>

            {!isSupabaseConfigured && (
              <p className="text-xs leading-relaxed text-amber-300">
                This build has no Supabase project configured — sign-in is unavailable.
              </p>
            )}

            {status === 'success' && (
              <p className="text-sm leading-relaxed text-emerald-300">
                Check that address for a one-time link. Opening it signs this browser in; the
                passport above updates on return.
              </p>
            )}

            {status === 'error' && (
              <p className="text-sm leading-relaxed text-red-400">
                Sign-in failed{errorMessage ? `: ${errorMessage}` : '. Check the address and try again.'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
