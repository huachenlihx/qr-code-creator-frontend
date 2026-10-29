'use client';

import { useEffect, useMemo, useState } from 'react';
import { Coffee, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

type SupportConfig = {
  currency: string;
  min_amount_cents: number;
  max_amount_cents: number;
  suggested_amounts_cents: number[];
};

const fallback: SupportConfig = {
  currency: 'CAD',
  min_amount_cents: 500,
  max_amount_cents: 100000,
  suggested_amounts_cents: [500, 1000, 2000],
};

export default function CoffeeCard() {
  const [config, setConfig] = useState<SupportConfig>(fallback);
  const [amount, setAmount] = useState('5');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void api.get<SupportConfig>('/api/support/config/?source_site=qrcode')
      .then(({ data }) => {
        setConfig(data);
        setAmount((current) => Number(current) * 100 < data.min_amount_cents
          ? (data.min_amount_cents / 100).toFixed(2).replace(/\.00$/, '')
          : current);
      })
      .catch(() => {
        // Keep the safe CAD 5 fallback. Checkout itself still validates server-side.
      });
  }, []);

  const minimum = config.min_amount_cents / 100;
  const maximum = config.max_amount_cents / 100;
  const presets = useMemo(
    () => config.suggested_amounts_cents.map((value) => String(value / 100)),
    [config.suggested_amounts_cents],
  );

  async function submit() {
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < minimum) {
      setMessage(`Minimum amount is ${config.currency} $${minimum.toFixed(2)}.`);
      return;
    }
    if (dollars > maximum) {
      setMessage(`Maximum amount is ${config.currency} $${maximum.toFixed(2)}.`);
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const { data } = await api.post('/api/support/checkout-session/', {
        source_site: 'qrcode',
        amount_cents: Math.round(dollars * 100),
      });
      window.location.href = data.checkout_url;
    } catch {
      setMessage('Could not start Stripe Checkout. Please try again.');
      setBusy(false);
    }
  }

  return <aside className="coffeeCard">
    <div className="coffeeIcon"><Coffee size={25}/></div>
    <div>
      <span className="eyebrow">Optional support</span>
      <h2>Buy me a coffee</h2>
      <p>If this tool saves you time, you can support future Founder Design Group utilities through secure Stripe Checkout.</p>
      <div className="presetRow">
        {presets.map((value) => <button
          key={value}
          type="button"
          aria-pressed={amount === value}
          className={amount === value ? 'preset active' : 'preset'}
          onClick={() => setAmount(value)}
        >{config.currency} ${Number(value).toFixed(0)}</button>)}
      </div>
      <label className="amountLabel">Amount ({config.currency})
        <input
          type="number"
          min={minimum}
          max={maximum}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <button type="button" className="coffeeButton" onClick={() => void submit()} disabled={busy}>
        <Coffee size={18}/>{busy ? 'Opening Stripe…' : 'Buy me a coffee'}<ExternalLink size={15}/>
      </button>
      {message && <p className="statusText" role="alert">{message}</p>}
      <small>Minimum {config.currency} ${minimum.toFixed(2)}. Card details are handled by Stripe, not this website.</small>
    </div>
  </aside>;
}
