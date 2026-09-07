'use client';

import { useSyncExternalStore } from 'react';

type Mode = 'light' | 'dark' | 'system';

const KEY = 'sep-theme';
const listeners = new Set<() => void>();
let mode: Mode = 'system';
let hydrated = false;

const emit = () => listeners.forEach((l) => l());

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  if (!hydrated) {
    hydrated = true;
    try {
      const stored = localStorage.getItem(KEY) as Mode | null;
      if (stored === 'dark' || stored === 'light') {
        mode = stored;
        emit();
      }
    } catch {
      /* сховище недоступне — лишається системна тема */
    }
  }
  return () => {
    listeners.delete(cb);
  };
};

const apply = (next: Mode) => {
  mode = next;
  const root = document.documentElement;
  if (next === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', next);
  try {
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    /* сховище недоступне — тема діє до перезавантаження */
  }
  emit();
};

/** Перемикач теми. Стан живе в localStorage, тому читаємо його як зовнішнє сховище. */
export function ThemeToggle({ label }: { label: string }) {
  const current = useSyncExternalStore(
    subscribe,
    () => mode,
    () => 'system' as Mode,
  );

  return (
    <button
      type="button"
      onClick={() => apply(current === 'dark' ? 'light' : 'dark')}
      className="btn btn-ghost !min-h-9 !px-2"
      aria-label={label}
      title={label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {current === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}

/** Інлайн-скрипт, що ставить тему до першого рендера — прибирає спалах. */
export const themeScript = `(function(){try{var t=localStorage.getItem('sep-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
