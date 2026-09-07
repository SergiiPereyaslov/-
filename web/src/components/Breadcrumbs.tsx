import Link from 'next/link';
import { SITE } from '@/lib/site';
import type { Locale } from '@/data/types';

export interface Crumb {
  label: string;
  href?: string;
}

/** Хлібні крихти + BreadcrumbList JSON-LD одним компонентом. */
export function Breadcrumbs({
  items,
  locale,
  label,
}: {
  items: Crumb[];
  locale: Locale;
  label: string;
}) {
  const prefix = locale === 'uk' ? '' : '/ru';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE.url}${prefix}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label={label} className="py-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
          {items.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href ? (
                <Link href={`${prefix}${c.href}`} className="hover:text-primary">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink">{c.label}</span>
              )}
              {i < items.length - 1 && <span aria-hidden="true">/</span>}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
