import type { L, PriceTier } from '@/data/types';

/**
 * Кошик як зовнішнє сховище поза React.
 *
 * Це не стилістичний вибір: стан кошика живе в localStorage, тобто поза
 * деревом React. Читати його ефектом після монтування означає зайвий
 * каскадний рендер і розсинхрон із SSR. useSyncExternalStore підписується
 * на сховище напряму й дає окремий знімок для сервера.
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

export interface CartState {
  lines: CartLine[];
  /** false доти, доки не прочитано localStorage — щоб не блимати порожнім кошиком. */
  ready: boolean;
}

const STORAGE_KEY = 'sep-cart-v1';

/** Знімок для сервера — стабільне посилання, інакше нескінченний рендер. */
const SERVER_STATE: CartState = { lines: [], ready: false };

let state: CartState = SERVER_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
  } catch {
    // приватний режим або заблоковане сховище — кошик лишається в пам'яті
  }
};

const hydrate = () => {
  if (hydrated) return;
  hydrated = true;
  let lines: CartLine[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) lines = JSON.parse(stored) as CartLine[];
  } catch {
    // пошкоджені дані або недоступне сховище — стартуємо з порожнього кошика
  }
  state = { lines, ready: true };
  emit();
};

const commit = (lines: CartLine[]) => {
  state = { lines, ready: true };
  persist();
  emit();
};

export const subscribe = (cb: () => void) => {
  listeners.add(cb);
  hydrate();
  return () => {
    listeners.delete(cb);
  };
};

export const getSnapshot = () => state;
export const getServerSnapshot = () => SERVER_STATE;

export const addLine = (line: Omit<CartLine, 'packs'>, packs = 1) => {
  const existing = state.lines.find((l) => l.slug === line.slug);
  commit(
    existing
      ? state.lines.map((l) => (l.slug === line.slug ? { ...l, packs: l.packs + packs } : l))
      : [...state.lines, { ...line, packs }],
  );
};

export const setLinePacks = (slug: string, packs: number) =>
  commit(state.lines.map((l) => (l.slug === slug ? { ...l, packs: Math.max(1, packs) } : l)));

export const removeLine = (slug: string) =>
  commit(state.lines.filter((l) => l.slug !== slug));

export const clearCart = () => commit([]);

export const unitPrice = (line: Pick<CartLine, 'priceRetail' | 'tiers'>, packs: number) => {
  let price = line.priceRetail;
  for (const t of line.tiers) if (packs >= t.minPacks) price = t.perUnit;
  return price;
};

export const lineSum = (line: CartLine) =>
  unitPrice(line, line.packs) * line.unitsPerPack * line.packs;
