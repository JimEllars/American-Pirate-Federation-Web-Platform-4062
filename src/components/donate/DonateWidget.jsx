import React, { useState } from 'react';
import SafeIcon from '../../common/SafeIcon';

export function DonateWidget() {
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState('monthly');
  const [customAmount, setCustomAmount] = useState('');

  const presets = [100, 50, 25, 10];

  const handleAmountClick = (val) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleDonate = async () => {
    // Basic stub, this logic hooks up to /api/donate
    const parsedAmount = amount === 'custom' ? parseInt(customAmount, 10) : amount;
    if (!parsedAmount || parsedAmount < 5) return;

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount * 100, frequency })
      });
      const data = await res.json();
      console.log('Donation initiated', data);
      // Stripe redirect would happen here
    } catch (err) {
      console.error('Donation error', err);
    }
  };

  return (
    <div className="w-[300px] h-[300px] bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl p-4 flex flex-col font-vt323 hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.3)] transition-all">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
         <span className="text-white uppercase tracking-widest text-lg">Contribute</span>
         <SafeIcon name="DollarSign" className="text-apf-emerald h-5 w-5" />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`flex-1 py-1 text-xs uppercase tracking-widest border ${frequency === 'monthly' ? 'bg-apf-emerald/20 border-apf-emerald text-apf-emerald' : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-500'}`}
          onClick={() => setFrequency('monthly')}
        >
          Monthly
        </button>
        <button
          className={`flex-1 py-1 text-xs uppercase tracking-widest border ${frequency === 'one-time' ? 'bg-apf-emerald/20 border-apf-emerald text-apf-emerald' : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-500'}`}
          onClick={() => setFrequency('one-time')}
        >
          One-Time
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 flex-grow">
        {presets.map(val => (
          <button
            key={val}
            className={`py-2 text-lg border transition-colors ${amount === val ? 'bg-apf-emerald text-black border-apf-emerald' : 'bg-black/50 border-gray-800 text-white hover:border-apf-emerald/50'}`}
            onClick={() => handleAmountClick(val)}
          >
            ${val}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="number"
          min="5"
          placeholder="Custom Amount ($5 min)"
          className={`w-full bg-black/50 border px-3 py-2 text-white focus:outline-none transition-colors ${amount === 'custom' ? 'border-apf-emerald focus:border-apf-emerald' : 'border-gray-800 focus:border-apf-emerald/50'}`}
          value={customAmount}
          onChange={(e) => {
            setAmount('custom');
            setCustomAmount(e.target.value);
          }}
          onFocus={() => setAmount('custom')}
        />
      </div>

      <button
        className="w-full bg-apf-emerald hover:bg-emerald-400 text-black font-bold uppercase py-3 tracking-widest transition-colors mb-2"
        onClick={handleDonate}
      >
        Donate
      </button>
      <div className="text-[9px] text-gray-500 text-center leading-tight">
        Contributions or gifts to the American Pirate Federation (or APF Action) are not deductible as charitable contributions for federal income tax purposes.
      </div>
    </div>
  );
}
