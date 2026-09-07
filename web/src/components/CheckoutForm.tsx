'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { useCart, lineSum } from './CartProvider';
import { events } from '@/lib/analytics';

const PHONE_RE = /^\+?380\d{9}$/;

type Delivery = 'pickup' | 'city' | 'np';
type Customer = 'individual' | 'company';

export function CheckoutForm({ locale, dict }: { locale: Locale; dict: Dict }) {
  const { lines, totalSum, clear, ready } = useCart();
  const router = useRouter();
  const p = locale === 'uk' ? '' : '/ru';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    city: '',
    requisites: '',
    comment: '',
  });
  const [delivery, setDelivery] = useState<Delivery>('city');
  const [customer, setCustomer] = useState<Customer>('individual');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.replace(/[\s()-]/g, '');
    if (!PHONE_RE.test(phone)) {
      setError(dict.checkout.phoneInvalid);
      return;
    }
    if (!form.name.trim()) {
      setError(dict.common.required);
      return;
    }
    setError('');
    setSending(true);
    events.beginCheckout(Number(totalSum.toFixed(2)), lines.length);

    try {
      const res = await fetch('/api/lead/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'order',
          ...form,
          phone,
          delivery,
          customer,
          locale,
          items: lines.map((l) => ({
            sku: l.sku,
            name: l.name[locale],
            packs: l.packs,
            sum: Number(lineSum(l).toFixed(2)),
          })),
          total: Number(totalSum.toFixed(2)),
        }),
      });
      const data = (await res.json()) as { ok: boolean; orderNumber?: string };
      if (data.ok) {
        events.lead('order', 'checkout', Number(totalSum.toFixed(2)));
        clear();
        router.push(`${p}/dyakuyemo/?n=${data.orderNumber ?? ''}`);
        return;
      }
      setError(dict.forms.error);
    } catch {
      setError(dict.forms.error);
    }
    setSending(false);
  };

  if (ready && lines.length === 0) {
    return <p className="mt-6 text-muted">{dict.cart.empty}</p>;
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start" noValidate>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="co-name" label={`${dict.checkout.name} *`} value={form.name} onChange={set('name')} autoComplete="name" required />
          <Field id="co-phone" label={`${dict.checkout.phone} *`} value={form.phone} onChange={set('phone')} placeholder="+380XXXXXXXXX" autoComplete="tel" required numeric />
          <Field id="co-email" label={dict.checkout.email} value={form.email} onChange={set('email')} type="email" autoComplete="email" />
          <Field id="co-company" label={dict.checkout.company} value={form.company} onChange={set('company')} autoComplete="organization" />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{dict.checkout.deliveryMethod}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ['pickup', dict.checkout.pickup],
              ['city', dict.checkout.cityDelivery],
              ['np', dict.checkout.novaPoshta],
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
                  delivery === key ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  className="accent-[var(--primary)]"
                  checked={delivery === key}
                  onChange={() => setDelivery(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {delivery === 'np' && (
          <Field id="co-city" label={dict.checkout.city} value={form.city} onChange={set('city')} />
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{dict.checkout.customerType}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ['individual', dict.checkout.individual],
              ['company', dict.checkout.company_],
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
                  customer === key ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="customer"
                  className="accent-[var(--primary)]"
                  checked={customer === key}
                  onChange={() => setCustomer(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {customer === 'company' && (
          <div>
            <label htmlFor="co-req" className="mb-1 block text-sm font-medium">
              {dict.checkout.requisites}
            </label>
            <textarea id="co-req" className="field min-h-24" value={form.requisites} onChange={set('requisites')} />
          </div>
        )}

        <div>
          <label htmlFor="co-comment" className="mb-1 block text-sm font-medium">
            {dict.checkout.comment}
          </label>
          <textarea id="co-comment" className="field min-h-24" value={form.comment} onChange={set('comment')} />
        </div>
      </div>

      <aside className="card sticky top-32 p-5">
        <ul className="space-y-2 border-b border-border pb-3 text-sm">
          {lines.map((l) => (
            <li key={l.slug} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {l.name[locale]} <span className="text-muted tnum">×{l.packs}</span>
              </span>
              <span className="shrink-0 tnum">{lineSum(l).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-medium">{dict.cart.total}</span>
          <b className="font-display text-2xl tnum">
            {totalSum.toFixed(2)} {dict.common.uah}
          </b>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button type="submit" className="btn btn-primary mt-4 w-full" disabled={sending}>
          {sending ? dict.checkout.submitting : dict.checkout.submit}
        </button>
        <p className="mt-3 text-xs leading-snug text-muted">{dict.checkout.agree}</p>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  numeric,
  ...rest
}: {
  id: string;
  label: string;
  numeric?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input id={id} className={`field ${numeric ? 'tnum' : ''}`} {...rest} />
    </div>
  );
}
