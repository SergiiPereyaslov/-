'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  addLine,
  clearCart,
  getServerSnapshot,
  getSnapshot,
  lineSum,
  removeLine,
  setLinePacks,
  subscribe,
  unitPrice,
  type CartLine,
} from '@/lib/cart-store';

export type { CartLine };
export { unitPrice, lineSum };

/** Читання кошика зі сховища поза React — без ефектів і каскадних рендерів. */
export function useCart() {
  const { lines, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
      lines,
      ready,
      add: addLine,
      setPacks: setLinePacks,
      remove: removeLine,
      clear: clearCart,
      totalPacks: lines.reduce((s, l) => s + l.packs, 0),
      totalSum: lines.reduce((s, l) => s + lineSum(l), 0),
    }),
    [lines, ready],
  );
}
