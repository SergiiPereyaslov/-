'use client';

import { useState } from 'react';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { events } from '@/lib/analytics';

const PHONE_RE = /^\+?380\d{9}$/;

/**
 * Коротка форма «Отримати прайс»: тільки ім'я й телефон.
 * Кожне зайве поле тут коштує заявок — решту менеджер уточнить у розмові.
 */
export function QuoteForm({
  locale,
  dict,
  source,
}: {
  locale: Locale;
  dict: Dict;
  source: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!PHONE_RE.test(normalized)) {
      setError(dict.checkout.phoneInvalid);
      return;
    }
    setError('');
    setState('sending');
    try {
      const res = await fetch('/api/lead/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'quote', name, phone: normalized, source, locale }),
      });
      if (res.ok) events.lead('quote', source);
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <p className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
        {dict.forms.sent}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <label htmlFor={`qf-name-${source}`} className="mb-1 block text-sm font-medium">
          {dict.checkout.name}
        </label>
        <input
          id={`qf-name-${source}`}
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor={`qf-phone-${source}`} className="mb-1 block text-sm font-medium">
          {dict.checkout.phone} *
        </label>
        <input
          id={`qf-phone-${source}`}
          className="field tnum"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+380XXXXXXXXX"
          inputMode="tel"
          autoComplete="tel"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `qf-err-${source}` : undefined}
        />
        {error && (
          <p id={`qf-err-${source}`} className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      {state === 'error' && <p className="text-sm text-danger">{dict.forms.error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={state === 'sending'}>
        {state === 'sending' ? dict.checkout.submitting : dict.product.askPrice}
      </button>
      <p className="text-xs leading-snug text-muted">{dict.checkout.agree}</p>
    </form>
  );
}
