'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { L, PriceTier } from '@/data/types';

/**
 * У кошику зберігається знімок товару, а не посилання на каталог: так
 * клієнтський бандл не тягне весь products.json (≈100 KB) заради трьох позицій.
 */
export interface CartLine {
  slug: string;
  sku: string;
  name: L;
  spec: L;
  shape: string;
  unitsPerPack: number;
  priceRetail: number;
  tiers: PriceTier[];
  /** Кількість у пачках. */
  packs: number;
}

interface CartApi {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'packs'>, packs?: number) => void;
  setPacks: (slug: string, packs: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  totalPacks: number;
  totalSum: number;
  ready: boolean;
}

const STORAGE_KEY = 'sep-cart-v1';
const CartContext = createContext<CartApi | null>(null);

export const unitPrice = (line: Pick<CartLine, 'priceRetail' | 'tiers'>, packs: number) => {
  let price = line.priceRetail;
  for (const t of line.tiers) if (packs >= t.minPacks) price = t.perUnit;
  return price;
};

export const lineSum = (line: CartLine) =>
  unitPrice(line, line.packs) * line.unitsPerPack * line.packs;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLines(JSON.parse(stored) as CartLine[]);
    } catch {
      // приватний режим або заблоковане сховище — працюємо з порожнім кошиком
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // сховище недоступне — кошик лишається тільки в пам'яті сторінки
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, 'packs'>, packs = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.slug === line.slug);
      if (existing) {
        return prev.map((l) => (l.slug === line.slug ? { ...l, packs: l.packs + packs } : l));
      }
      return [...prev, { ...line, packs }];
    });
  }, []);

  const setPacks = useCallback((slug: string, packs: number) => {
    setLines((prev) =>
      prev.map((l) => (l.slug === slug ? { ...l, packs: Math.max(1, packs) } : l)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(
    () => ({
      lines,
      add,
      setPacks,
      remove,
      clear,
      ready,
      totalPacks: lines.reduce((s, l) => s + l.packs, 0),
      totalSum: lines.reduce((s, l) => s + lineSum(l), 0),
    }),
    [lines, add, setPacks, remove, clear, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart має викликатись усередині <CartProvider>');
  return ctx;
}
