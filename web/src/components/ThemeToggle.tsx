'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';

/**
 * Перемикач теми. Записує 'sep-theme' у localStorage і виставляє
 * data-theme на <html>; відсутність атрибута = системна тема.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sep-theme') as Mode | null;
      if (stored) setMode(stored);
    } catch {
      /* сховище недоступне */
    }
  }, []);

  const apply = (next: Mode) => {
    setMode(next);
    const root = document.documentElement;
    if (next === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', next);
    try {
      if (next === 'system') localStorage.removeItem('sep-theme');
      else localStorage.setItem('sep-theme', next);
    } catch {
      /* сховище недоступне */
    }
  };

  const next: Mode = mode === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      className="btn btn-ghost !min-h-9 !px-2"
      aria-label={label}
      title={label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {mode === 'dark' ? (
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
