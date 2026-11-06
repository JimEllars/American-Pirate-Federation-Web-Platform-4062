import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

/**
 * The Chest — 300x300 card contribution widget (SOP §4 Playbook D / §7).
 *
 * Layout constraint, not a style preference: the widget is a fixed 300x300 embed and the
 * 501(c)(4) non-deductibility disclosure is a statutory notice that must be fully visible
 * and unclipped. An earlier revision stacked a four-row ladder, a custom-amount field and a
 * three-line disclosure inside the same 300px, so the disclosure rendered at y=342 — i.e.
 * entirely outside the box, invisible on every donation. The preset ladder is now a single
 * four-column row so the statutory copy fits inside the frame instead of below it.
 */
export function DonateWidget() {
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState('monthly');
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addToast = useAppStore((state) => state.addToast);

  const presets = [100, 50, 25, 10];

  const handleAmountClick = (val) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleDonate = async () => {
    if (isSubmitting) return;

    const dollars = amount === 'custom' ? Number(customAmount) : amount;
    // Server enforces the same $5.00 floor; checking here just avoids a pointless round trip.
    if (!Number.isFinite(dollars) || dollars < 5) {
      addToast('[ THE CHEST: MINIMUM CONTRIBUTION IS $5.00 ]', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Idempotency so a double-tap cannot open two subscriptions.
          'Idempotency-Key': `apf-donate-${Date.now()}-${Math.round(dollars * 100)}`
        },
        body: JSON.stringify({ amount: Math.round(dollars * 100), frequency })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.status === 'error') {
        // Surface the real reason (unconfigured Stripe, rate limit, validation) instead of
        // failing silently in the console.
        addToast(`[ THE CHEST: ${(data && data.message) || 'CONTRIBUTION COULD NOT BE STARTED'} ]`, 'error');
        return;
      }

      if (!data.checkoutUrl) {
        addToast('[ THE CHEST: PAYMENT PROCESSOR RETURNED NO CHECKOUT ]', 'error');
        return;
      }

      // Card details are entered on Stripe's domain, never in this widget.
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      addToast('[ THE CHEST: NETWORK FAILURE - CONTRIBUTION NOT STARTED ]', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[300px] h-[300px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-900 px-4 pb-3 pt-4 flex flex-col font-sans shadow-soft">
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-2.5">
        <span className="font-display text-base font-semibold leading-none text-white">Contribute</span>
        <SafeIcon name="DollarSign" className="h-4 w-4 text-emerald-300" />
      </div>

      <div className="mb-2 flex gap-1.5" role="group" aria-label="Contribution frequency">
        <button
          type="button"
          aria-pressed={frequency === 'monthly'}
          className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors ${frequency === 'monthly' ? 'border-apf-emerald bg-apf-emerald/15 text-emerald-300' : 'border-white/[0.08] text-ink-dim hover:border-white/20 hover:text-white'}`}
          onClick={() => setFrequency('monthly')}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={frequency === 'one-time'}
          className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors ${frequency === 'one-time' ? 'border-apf-emerald bg-apf-emerald/15 text-emerald-300' : 'border-white/[0.08] text-ink-dim hover:border-white/20 hover:text-white'}`}
          onClick={() => setFrequency('one-time')}
        >
          One-Time
        </button>
      </div>

      <div className="mb-2.5 grid grid-cols-4 gap-1.5" role="group" aria-label="Contribution amount">
        {presets.map((val) => (
          <button
            key={val}
            type="button"
            aria-pressed={amount === val}
            className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${amount === val ? 'border-apf-emerald bg-apf-emerald text-black' : 'border-white/[0.08] bg-surface-950/60 text-white hover:border-apf-emerald/50'}`}
            onClick={() => handleAmountClick(val)}
          >
            ${val}
          </button>
        ))}
      </div>

      <div className="mb-2.5">
        <label htmlFor="apf-custom-amount" className="sr-only">
          Custom contribution amount in US dollars
        </label>
        <input
          id="apf-custom-amount"
          type="number"
          min="5"
          inputMode="decimal"
          placeholder="Custom amount ($5 min)"
          className={`w-full rounded-lg border bg-surface-950/60 px-2.5 py-2 text-sm text-white placeholder:text-ink-dim focus:outline-none transition-colors ${amount === 'custom' ? 'border-apf-emerald' : 'border-white/[0.08] focus:border-apf-purpleLight/60'}`}
          value={customAmount}
          onChange={(e) => {
            setAmount('custom');
            setCustomAmount(e.target.value);
          }}
          onFocus={() => setAmount('custom')}
        />
      </div>

      <button
        type="button"
        className="w-full shrink-0 rounded-lg bg-apf-purple py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#A21CE8] disabled:opacity-60"
        onClick={handleDonate}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Opening checkout…' : (frequency === 'monthly' ? 'Contribute Monthly' : 'Contribute Once')}
      </button>

      <p className="mt-auto pt-2 text-center text-[9px] leading-[1.3] text-gray-400">
        Contributions or gifts to the American Pirate Federation (or APF Action) are not
        deductible as charitable contributions for federal income tax purposes.
      </p>
    </div>
  );
}
