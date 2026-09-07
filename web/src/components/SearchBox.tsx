'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { Placeholder, type Shape } from './Placeholder';

interface Hit {
  slug: string;
  name: string;
  spec: string;
  sku: string;
  price: number;
  shape: Shape;
}

/**
 * Пошук ходить у /api/search, а не імпортує каталог: інакше кожна сторінка
 * тягнула б увесь products.json у клієнтський бандл.
 */
export function SearchBox({ locale, dict }: { locale: Locale; dict: Dict }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/?q=${encodeURIComponent(q)}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (res.ok) setHits((await res.json()) as Hit[]);
      } catch {
        // скасований або невдалий запит — підказки просто не показуємо
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, locale]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const prefix = locale === 'uk' ? '' : '/ru';
  // Короткий запит просто не показує підказок — очищати стан ефектом не треба.
  const visible = q.trim().length >= 2 ? hits : [];

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="site-search" className="sr-only">
        {dict.header.searchLabel}
      </label>
      <div className="relative">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="site-search"
          type="search"
          className="field !pl-10"
          placeholder={dict.header.searchPlaceholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      </div>

      {open && visible.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          {visible.map((h) => (
            <li key={h.slug}>
              <Link
                href={`${prefix}/product/${h.slug}/`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-kraft"
                onClick={() => setOpen(false)}
              >
                <Placeholder shape={h.shape} className="h-10 w-10 shrink-0 rounded" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{h.name}</span>
                  <span className="block text-xs text-muted tnum">{h.sku}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tnum">
                  {h.price.toFixed(2)} {dict.common.uah}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
