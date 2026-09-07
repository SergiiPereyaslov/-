'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { QuoteForm } from './QuoteForm';

/**
 * Калькулятор брендування.
 *
 * Прямо знімає ключове заперечення аудиторії — «скільки коштує з логотипом
 * і від якого тиражу» — на яке конкуренти відповідають «зателефонуйте».
 * Коефіцієнти винесені константами: їх правитиме менеджер під реальний прайс.
 */
const ITEMS = {
  cup: { base: 0.55, uk: 'Паперовий стакан', ru: 'Бумажный стакан' },
  sleeve: { base: 0.4, uk: 'Термочохол', ru: 'Термочехол' },
  bag: { base: 0.9, uk: 'Крафт пакет', ru: 'Крафт пакет' },
  box: { base: 1.1, uk: 'Бокс або контейнер', ru: 'Бокс или контейнер' },
} as const;

const COLORS = [
  { n: 1, mult: 1, uk: '1 колір', ru: '1 цвет' },
  { n: 2, mult: 1.45, uk: '2 кольори', ru: '2 цвета' },
  { n: 3, mult: 1.8, uk: '3 кольори', ru: '3 цвета' },
  { n: 4, mult: 2.4, uk: 'Повнокольоровий', ru: 'Полноцветный' },
] as const;

/** Чим більший тираж, тим дешевше за штуку — форма розкладає підготовку друку. */
const RUNS = [
  { qty: 100, mult: 1.6, days: 5 },
  { qty: 500, mult: 1.15, days: 5 },
  { qty: 1000, mult: 1, days: 7 },
  { qty: 3000, mult: 0.82, days: 7 },
  { qty: 5000, mult: 0.72, days: 10 },
  { qty: 10000, mult: 0.62, days: 12 },
] as const;

type ItemKey = keyof typeof ITEMS;

export function BrandingCalculator({ locale, dict }: { locale: Locale; dict: Dict }) {
  const [item, setItem] = useState<ItemKey>('cup');
  const [runIndex, setRunIndex] = useState(2);
  const [colors, setColors] = useState(1);

  const result = useMemo(() => {
    const run = RUNS[runIndex];
    const color = COLORS.find((c) => c.n === colors) ?? COLORS[0];
    const perUnit = ITEMS[item].base * run.mult * color.mult;
    return {
      perUnit,
      total: perUnit * run.qty,
      days: run.days,
      qty: run.qty,
    };
  }, [item, runIndex, colors]);

  return (
    <div className="card p-5 lg:p-6">
      <h2 className="text-xl">{dict.branding.calcTitle}</h2>

      <div className="mt-5 space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{dict.branding.itemType}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ITEMS) as ItemKey[]).map((k) => (
              <label
                key={k}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
                  item === k ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="branding-item"
                  className="accent-[var(--primary)]"
                  checked={item === k}
                  onChange={() => setItem(k)}
                />
                {ITEMS[k][locale]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="branding-run" className="mb-2 block text-sm font-medium">
            {dict.branding.circulation}:{' '}
            <b className="tnum">{result.qty.toLocaleString('uk-UA')}</b>
          </label>
          <input
            id="branding-run"
            type="range"
            min={0}
            max={RUNS.length - 1}
            step={1}
            value={runIndex}
            onChange={(e) => setRunIndex(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted tnum">
            {RUNS.map((r) => (
              <span key={r.qty}>{r.qty >= 1000 ? `${r.qty / 1000}k` : r.qty}</span>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{dict.branding.colors}</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.n}
                type="button"
                onClick={() => setColors(c.n)}
                className={`chip ${colors === c.n ? '!border-primary !text-primary' : ''}`}
              >
                {c[locale]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <dl className="mt-6 space-y-2 rounded-md bg-kraft p-4">
        <div className="flex justify-between">
          <dt className="text-sm">{dict.branding.pricePerUnit}</dt>
          <dd className="font-display text-lg font-bold tnum">
            {result.perUnit.toFixed(2)} {dict.common.uah}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm">{dict.branding.totalPrint}</dt>
          <dd className="font-display text-xl font-bold text-primary tnum">
            {result.total.toFixed(0)} {dict.common.uah}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm">{dict.branding.leadTime}</dt>
          <dd className="text-sm font-medium tnum">
            {result.days} {dict.branding.workingDays}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-snug text-muted">{dict.branding.calcHint}</p>

      <div className="mt-5 border-t border-border pt-5">
        <QuoteForm locale={locale} dict={dict} source="branding" />
      </div>
    </div>
  );
}
