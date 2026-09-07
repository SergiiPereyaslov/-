'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { useCart } from './CartProvider';
import { ThemeToggle } from './ThemeToggle';
import { SearchBox } from './SearchBox';

export interface NavGroup {
  slug: string;
  name: string;
  categories: { slug: string; name: string }[];
}

interface Props {
  locale: Locale;
  dict: Dict;
  nav: NavGroup[];
  phone: string;
  phoneHref: string;
  addressLine: string;
  hours: string;
}

const link = (locale: Locale, path: string) => (locale === 'uk' ? path : `/ru${path}`);

export function Header({ locale, dict, nav, phone, phoneHref, addressLine, hours }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const catalogRef = useRef<HTMLDivElement>(null);

  // Закриваємо все при переході — інакше меню лишається відкритим над новою
  // сторінкою. Коригуємо стан під час рендера, а не ефектом: так React не
  // робить зайвий каскадний рендер із відкритим меню.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setCatalogOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCatalogOpen(false);
        setMenuOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) setCatalogOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  // Той самий шлях іншою мовою — для перемикача без втрати сторінки.
  const otherLocale: Locale = locale === 'uk' ? 'ru' : 'uk';
  const bare = locale === 'uk' ? pathname : pathname.replace(/^\/ru/, '') || '/';
  const otherHref = otherLocale === 'uk' ? bare : `/ru${bare === '/' ? '' : bare}`;

  const menu = [
    { href: link(locale, '/brenduvannya/'), label: dict.nav.branding },
    { href: link(locale, '/dostavka-i-oplata/'), label: dict.nav.delivery },
    { href: link(locale, '/blog/'), label: dict.nav.blog },
    { href: link(locale, '/pro-nas/'), label: dict.nav.about },
    { href: link(locale, '/kontakty/'), label: dict.nav.contacts },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur">
      {/* Топ-бар: адреса й графік — сигнал локальності, головна перевага компанії */}
      <div className="hidden border-b border-border text-xs text-muted lg:block">
        <div className="container-page flex h-9 items-center justify-between">
          <span>
            {addressLine} · {hours}
          </span>
          <div className="flex items-center gap-4">
            <Link href={otherHref} hrefLang={otherLocale} className="hover:text-primary">
              {otherLocale === 'uk' ? 'UA' : 'RU'}
            </Link>
            <a href={phoneHref} className="font-semibold text-ink hover:text-primary">
              {phone}
            </a>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3 lg:gap-6">
        <button
          type="button"
          className="btn btn-ghost !min-h-10 !px-2 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={dict.header.menu}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>

        <Link href={link(locale, '/')} className="shrink-0 font-display text-lg font-bold tracking-tight">
          Smart<span className="text-primary">Eco</span>Pack
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBox locale={locale} dict={dict} />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle label={dict.a11y.themeToggle} />
          <CartButton locale={locale} label={dict.header.cart} />
        </div>
      </div>

      {/* Головна навігація */}
      <nav aria-label={dict.a11y.mainNav} className="hidden border-t border-border lg:block">
        <div className="container-page flex h-12 items-center gap-1">
          <div ref={catalogRef} className="relative">
            <button
              type="button"
              className="btn btn-ghost !min-h-9 font-semibold"
              onClick={() => setCatalogOpen((v) => !v)}
              aria-expanded={catalogOpen}
            >
              {dict.nav.catalog}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Мега-меню: уся структура сайту за одне відкриття */}
            {catalogOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[min(1180px,92vw)] rounded-lg border border-border bg-surface p-6 shadow-lg">
                <div className="grid grid-cols-5 gap-6">
                  {nav.map((g) => (
                    <div key={g.slug}>
                      <Link
                        href={link(locale, `/catalog/${g.slug}/`)}
                        className="mb-2 block font-display text-sm font-bold hover:text-primary"
                      >
                        {g.name}
                      </Link>
                      <ul className="space-y-1.5">
                        {g.categories.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={link(locale, `/catalog/${c.slug}/`)}
                              className="text-[13px] leading-snug text-muted hover:text-primary"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <Link
                  href={link(locale, '/catalog/')}
                  className="mt-5 inline-block border-t border-border pt-4 text-sm font-semibold text-primary"
                >
                  {dict.catalog.allProducts} →
                </Link>
              </div>
            )}
          </div>

          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="btn btn-ghost !min-h-9 font-medium">
              {m.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Мобільне меню */}
      {menuOpen && (
        <div className="border-t border-border bg-surface lg:hidden">
          <div className="container-page py-4">
            <div className="mb-4 md:hidden">
              <SearchBox locale={locale} dict={dict} />
            </div>
            <ul className="space-y-1">
              {nav.map((g) => (
                <li key={g.slug}>
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2.5 font-semibold marker:content-none">
                      {g.name}
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        className="transition-transform group-open:rotate-180"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </summary>
                    <ul className="mb-2 ml-2 space-y-0.5 border-l border-border pl-3">
                      {g.categories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={link(locale, `/catalog/${c.slug}/`)}
                            className="block py-2 text-sm text-muted"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
            <hr className="my-3 border-border" />
            <ul className="space-y-0.5">
              {menu.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="block px-2 py-2.5 font-medium">
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
            <hr className="my-3 border-border" />
            <div className="flex items-center justify-between px-2">
              <a href={phoneHref} className="font-semibold text-primary">
                {phone}
              </a>
              <Link href={otherHref} hrefLang={otherLocale} className="chip">
                {otherLocale === 'uk' ? 'Українська' : 'Русский'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CartButton({ locale, label }: { locale: Locale; label: string }) {
  const { totalPacks, ready } = useCart();
  return (
    <Link href={link(locale, '/koshyk/')} className="btn btn-ghost !min-h-10 !px-2.5" aria-label={label}>
      <span className="relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
        </svg>
        {ready && totalPacks > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary tnum">
            {totalPacks}
          </span>
        )}
      </span>
    </Link>
  );
}
