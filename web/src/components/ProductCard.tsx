'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Locale, Product } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { fill } from '@/i18n/dictionaries';
import { Placeholder } from './Placeholder';
import { QtyStepper } from './QtyStepper';
import { useCart, unitPrice } from './CartProvider';
import { events } from '@/lib/analytics';

export function ProductCard({
  product,
  locale,
  dict,
}: {
  product: Product;
  locale: Locale;
  dict: Dict;
}) {
  const { add, lines } = useCart();
  const [packs, setPacks] = useState(1);
  const inCart = lines.some((l) => l.slug === product.slug);
  const prefix = locale === 'uk' ? '' : '/ru';

  const price = unitPrice(product, packs);
  const packPrice = price * product.unitsPerPack;
  // Перший оптовий щабель — найближчий до клієнта; показуємо саме його,
  // а не максимальну знижку: вона однакова в усіх товарів і нічого не каже.
  const firstTier = product.tiers[0];

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:border-primary/40">
      <Link href={`${prefix}/product/${product.slug}/`} className="relative block aspect-square">
        <Placeholder shape={product.shape ?? 'box'} className="h-full w-full" />
        {product.brandable && (
          <span className="absolute right-2 top-2 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium">
            ⌗ logo
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`${prefix}/product/${product.slug}/`} className="hover:text-primary">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{product.name[locale]}</h3>
        </Link>

        <p className="mt-1 text-xs text-muted tnum">
          {product.unitsPerPack} {dict.common.pcs} / {dict.common.perPack.replace('за ', '')}
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tnum">
            {packPrice.toFixed(2)} {dict.common.uah}
          </span>
          <span className="text-xs text-muted tnum">
            {price.toFixed(2)} / {dict.common.pcs}
          </span>
        </div>

        <p className="mt-1 text-xs font-medium text-accent tnum">
          {dict.product.wholesale} {fill(dict.product.wholesaleFrom, { n: firstTier.minPacks })} —{' '}
          {firstTier.perUnit.toFixed(2)} {dict.common.uah}/{dict.common.pcs}
        </p>

        <div className="mt-3 flex items-center gap-2 pt-1">
          <QtyStepper
            value={packs}
            onChange={setPacks}
            labels={{ increase: dict.a11y.increase, decrease: dict.a11y.decrease }}
            compact
          />
          <button
            type="button"
            className="btn btn-primary !min-h-9 flex-1 !px-2 !text-[13px]"
            onClick={() => {
              events.addToCart(product.sku, product.name.uk, packs, packPrice * packs);
              add(
                {
                  slug: product.slug,
                  sku: product.sku,
                  name: product.name,
                  spec: product.spec,
                  shape: product.shape ?? 'box',
                  unitsPerPack: product.unitsPerPack,
                  priceRetail: product.priceRetail,
                  tiers: product.tiers,
                },
                packs,
              );
            }}
          >
            {inCart ? dict.common.inCart : dict.common.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}
