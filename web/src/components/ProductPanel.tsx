'use client';

import { useState } from 'react';
import type { Locale, Product } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { fill } from '@/i18n/dictionaries';
import { QtyStepper } from './QtyStepper';
import { useCart, unitPrice } from './CartProvider';

/**
 * Панель замовлення в картці товару.
 * Обидві ціни — роздрібна й оптова — видно без реєстрації: це головна
 * відмінність від конкурентів, які ховають опт за «зателефонуйте».
 */
export function ProductPanel({
  product,
  locale,
  dict,
  brandingMin,
  telegram,
}: {
  product: Product;
  locale: Locale;
  dict: Dict;
  brandingMin: number;
  telegram: string;
}) {
  const { add, lines } = useCart();
  const [packs, setPacks] = useState(1);
  const inCart = lines.some((l) => l.slug === product.slug);

  const price = unitPrice(product, packs);
  const total = price * product.unitsPerPack * packs;
  const bestTier = product.tiers[product.tiers.length - 1];
  const maxDiscount = Math.round((1 - bestTier.perUnit / product.priceRetail) * 100);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted tnum">
          {dict.common.sku} {product.sku}
        </span>
        <span className={product.inStock ? 'text-primary' : 'text-muted'}>
          {product.inStock ? `✔ ${dict.common.inStock}` : dict.common.outOfStock}
        </span>
      </div>

      <div className="mt-4 space-y-2 border-y border-border py-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">{dict.product.retail}</span>
          <span className="tnum">
            <b className="font-display text-lg">{product.priceRetail.toFixed(2)}</b>{' '}
            <span className="text-sm text-muted">{dict.common.uah}/{dict.common.pcs}</span>
          </span>
        </div>
        {product.tiers.map((t) => (
          <div key={t.minPacks} className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted">
              {dict.product.wholesale} {fill(dict.product.wholesaleFrom, { n: t.minPacks })}
            </span>
            <span className="tnum">
              <b className="font-display text-lg text-primary">{t.perUnit.toFixed(2)}</b>{' '}
              <span className="text-sm text-muted">{dict.common.uah}/{dict.common.pcs}</span>
            </span>
          </div>
        ))}
        {maxDiscount > 0 && (
          <p className="pt-1 text-xs text-accent">
            {fill(dict.product.youSave, { n: maxDiscount })}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">{dict.product.quantity}</label>
        <div className="flex items-center gap-3">
          <QtyStepper
            value={packs}
            onChange={setPacks}
            labels={{ increase: dict.a11y.increase, decrease: dict.a11y.decrease }}
          />
          <span className="text-sm text-muted tnum">
            = {packs * product.unitsPerPack} {dict.common.pcs}
          </span>
        </div>

        <p className="mt-3 flex items-baseline justify-between gap-3 rounded-md bg-kraft px-3 py-2.5">
          <span className="text-sm">{fill(dict.product.totalFor, { n: packs })}</span>
          <b className="font-display text-xl tnum">
            {total.toFixed(2)} {dict.common.uah}
          </b>
        </p>

        <button
          type="button"
          className="btn btn-primary mt-3 w-full"
          onClick={() =>
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
            )
          }
        >
          {inCart ? dict.common.inCart : dict.common.addToCart}
        </button>

        <a href={telegram} className="btn btn-secondary mt-2 w-full" target="_blank" rel="noopener">
          {dict.product.writeTelegram}
        </a>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted">
        <li>🚚 {dict.product.deliveryNote}</li>
        {product.brandable && <li>🏷 {fill(dict.product.brandable, { n: brandingMin })}</li>}
      </ul>
    </div>
  );
}
