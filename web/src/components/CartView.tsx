'use client';

import Link from 'next/link';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { fill } from '@/i18n/dictionaries';
import { useCart, unitPrice, lineSum } from './CartProvider';
import { QtyStepper } from './QtyStepper';
import { Placeholder, type Shape } from './Placeholder';

export function CartView({ locale, dict }: { locale: Locale; dict: Dict }) {
  const { lines, setPacks, remove, totalSum, ready } = useCart();
  const p = locale === 'uk' ? '' : '/ru';

  if (!ready) return <p className="py-10 text-muted">{dict.common.loading}</p>;

  if (lines.length === 0) {
    return (
      <div className="card mt-6 p-10 text-center">
        <p className="font-display text-lg font-bold">{dict.cart.empty}</p>
        <p className="mt-2 text-sm text-muted">{dict.cart.emptyHint}</p>
        <Link href={`${p}/catalog/`} className="btn btn-primary mt-5">
          {dict.cart.goToCatalog}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <ul className="space-y-3">
        {lines.map((line) => {
          const price = unitPrice(line, line.packs);
          // Наступний оптовий поріг — підказка, яка прямо піднімає середній чек
          const next = line.tiers.find((t) => line.packs < t.minPacks);

          return (
            <li key={line.slug} className="card p-3 sm:p-4">
              <div className="flex gap-3">
                <Link href={`${p}/product/${line.slug}/`} className="shrink-0">
                  <Placeholder shape={line.shape as Shape} className="h-20 w-20 rounded" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`${p}/product/${line.slug}/`} className="font-medium hover:text-primary">
                    {line.name[locale]}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted tnum">
                    {dict.common.sku} {line.sku} · {line.unitsPerPack} {dict.common.pcs}/
                    {dict.common.packs}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <QtyStepper
                      value={line.packs}
                      onChange={(n) => setPacks(line.slug, n)}
                      labels={{ increase: dict.a11y.increase, decrease: dict.a11y.decrease }}
                      compact
                    />
                    <span className="text-sm text-muted tnum">
                      {price.toFixed(2)} {dict.common.uah}/{dict.common.pcs}
                    </span>
                    <span className="ml-auto font-display text-lg font-bold tnum">
                      {lineSum(line).toFixed(2)} {dict.common.uah}
                    </span>
                    <button
                      type="button"
                      className="text-muted hover:text-danger"
                      onClick={() => remove(line.slug)}
                      aria-label={dict.cart.remove}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                      </svg>
                    </button>
                  </div>

                  {next && (
                    <p className="mt-2 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent">
                      {fill(dict.cart.tierHint, {
                        n: next.minPacks - line.packs,
                        price: next.perUnit.toFixed(2),
                      })}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="card sticky top-32 p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">{dict.cart.total}</span>
          <b className="font-display text-2xl tnum">
            {totalSum.toFixed(2)} {dict.common.uah}
          </b>
        </div>
        <Link href={`${p}/oformlennya/`} className="btn btn-primary mt-4 w-full">
          {dict.cart.checkout}
        </Link>
        <p className="mt-3 text-xs leading-snug text-muted">{dict.cart.note}</p>
      </aside>
    </div>
  );
}
