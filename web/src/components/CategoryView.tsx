'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import type { Facet, Locale, Product } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { ProductCard } from './ProductCard';
import { Sheet } from './Sheet';

type Selected = Record<string, string[]>;
type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'name';

const PAGE = 12;

export function CategoryView({
  products,
  facets,
  locale,
  dict,
  categorySlug,
  /** Фасет, зафіксований URL посадкової сторінки — його не показуємо у фільтрах. */
  lockedFacet,
}: {
  products: Product[];
  facets: Facet[];
  locale: Locale;
  dict: Dict;
  categorySlug: string;
  lockedFacet?: { key: string; value: string };
}) {
  const [selected, setSelected] = useState<Selected>({});
  const [sort, setSort] = useState<SortKey>('popular');
  const [shown, setShown] = useState(PAGE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const visibleFacets = facets.filter((f) => f.key !== lockedFacet?.key);

  const filtered = useMemo(() => {
    const active = Object.entries(selected).filter(([, v]) => v.length);
    const base = active.length
      ? products.filter((p) => active.every(([k, vals]) => vals.includes(p.facets[k])))
      : products;

    const out = [...base];
    switch (sort) {
      case 'price-asc':
        return out.sort((a, b) => a.priceRetail - b.priceRetail);
      case 'price-desc':
        return out.sort((a, b) => b.priceRetail - a.priceRetail);
      case 'name':
        return out.sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));
      default:
        return out.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
    }
  }, [products, selected, sort, locale]);

  const counts = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const f of visibleFacets) {
      map[f.key] = {};
      for (const p of products) {
        const v = p.facets[f.key];
        if (v) map[f.key][v] = (map[f.key][v] ?? 0) + 1;
      }
    }
    return map;
  }, [products, visibleFacets]);

  const toggle = (key: string, value: string) => {
    setShown(PAGE);
    setSelected((prev) => {
      const cur = prev[key] ?? [];
      return { ...prev, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  };

  const activeChips = Object.entries(selected).flatMap(([key, values]) =>
    values.map((value) => {
      const facet = facets.find((f) => f.key === key);
      const fv = facet?.values.find((v) => v.value === value);
      return { key, value, label: fv?.label[locale] ?? value };
    }),
  );

  const indexedFacet = facets.find((f) => f.indexed && f.key !== lockedFacet?.key);
  const prefix = locale === 'uk' ? '' : '/ru';

  const filterPanel = (
    <div className="space-y-5">
      {visibleFacets.map((f) => (
        <fieldset key={f.key}>
          <legend className="mb-2 text-sm font-bold">{f.label[locale]}</legend>
          <div className="space-y-1.5">
            {f.values.map((v) => {
              const n = counts[f.key]?.[v.value] ?? 0;
              if (!n) return null;
              return (
                <label
                  key={v.value}
                  className="flex cursor-pointer items-center gap-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                    checked={(selected[f.key] ?? []).includes(v.value)}
                    onChange={() => toggle(f.key, v.value)}
                  />
                  <span className="flex-1">{v.label[locale]}</span>
                  <span className="text-xs text-muted tnum">{n}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );

  return (
    <div className="mt-6 lg:flex lg:gap-8">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-32">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide">{dict.common.filters}</h2>
            {activeChips.length > 0 && (
              <button type="button" className="text-xs text-primary" onClick={() => setSelected({})}>
                {dict.common.reset}
              </button>
            )}
          </div>
          {filterPanel}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary !min-h-9 lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            {dict.common.filters}
            {activeChips.length > 0 && ` (${activeChips.length})`}
          </button>

          <span className="text-sm text-muted tnum">
            {filtered.length} {dict.common.products}
          </span>

          <label className="ml-auto flex items-center gap-2 text-sm">
            <span className="sr-only">{dict.common.sort}</span>
            <select
              className="field !min-h-9 !w-auto !py-1.5 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {(['popular', 'price-asc', 'price-desc', 'name'] as const).map((k) => (
                <option key={k} value={k}>
                  {dict.sort[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeChips.map((c) => (
              <button
                key={`${c.key}-${c.value}`}
                type="button"
                className="chip hover:border-primary"
                onClick={() => toggle(c.key, c.value)}
              >
                {c.label}
                <span aria-hidden="true">✕</span>
              </button>
            ))}
            <button type="button" className="chip text-primary" onClick={() => setSelected({})}>
              {dict.common.resetAll}
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-md border border-border bg-surface p-8 text-center">
            <p className="font-semibold">{dict.catalog.nothingFound}</p>
            <p className="mt-1 text-sm text-muted">{dict.catalog.nothingFoundHint}</p>
            <button type="button" className="btn btn-secondary mt-4" onClick={() => setSelected({})}>
              {dict.common.resetAll}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {filtered.slice(0, shown).map((p) => (
                <ProductCard key={p.slug} product={p} locale={locale} dict={dict} />
              ))}
            </div>
            {shown < filtered.length && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShown((s) => s + PAGE)}
                >
                  {dict.common.showMore}
                </button>
              </div>
            )}
          </>
        )}

        {/* Швидкі посилання на індексовані посадкові — і навігація, і перелінковка */}
        {indexedFacet && !lockedFacet && (
          <nav className="mt-8 border-t border-border pt-5">
            <h2 className="mb-2 text-sm font-bold">{dict.catalog.popularSizes}</h2>
            <div className="flex flex-wrap gap-2">
              {indexedFacet.values
                .filter((v) => (counts[indexedFacet.key]?.[v.value] ?? 0) > 0)
                .map((v) => (
                  <Link
                    key={v.slug}
                    href={`${prefix}/catalog/${categorySlug}/${v.slug}/`}
                    className="chip hover:border-primary hover:text-primary"
                  >
                    {v.label[locale]}
                  </Link>
                ))}
            </div>
          </nav>
        )}
      </div>

      {/* Мобільна шторка фільтрів */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={dict.common.filters}
        closeLabel={dict.header.close}
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setSelected({})}>
              {dict.common.reset}
            </button>
            <button type="button" className="btn btn-primary flex-[2]" onClick={closeSheet}>
              {dict.common.apply} ({filtered.length})
            </button>
          </div>
        }
      >
        {filterPanel}
      </Sheet>
    </div>
  );
}
