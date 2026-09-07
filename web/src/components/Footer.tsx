import Link from 'next/link';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { SITE, formatPhone } from '@/lib/site';
import type { NavGroup } from './Header';

export function Footer({
  locale,
  dict,
  nav,
}: {
  locale: Locale;
  dict: Dict;
  nav: NavGroup[];
}) {
  const l = (p: string) => (locale === 'uk' ? p : `/ru${p}`);
  const address = locale === 'uk' ? SITE.address.street : SITE.address.streetRu;
  const city = locale === 'uk' ? SITE.address.city : SITE.address.cityRu;

  return (
    <footer className="mt-16 border-t border-border bg-kraft">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.catalogTitle}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {nav.map((g) => (
              <li key={g.slug}>
                <Link href={l(`/catalog/${g.slug}/`)} className="hover:text-primary">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.companyTitle}</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href={l('/pro-nas/')} className="hover:text-primary">{dict.nav.about}</Link></li>
            <li><Link href={l('/blog/')} className="hover:text-primary">{dict.nav.blog}</Link></li>
            <li><Link href={l('/kontakty/')} className="hover:text-primary">{dict.nav.contacts}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.customersTitle}</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href={l('/dostavka-i-oplata/')} className="hover:text-primary">{dict.nav.delivery}</Link></li>
            <li><Link href={l('/brenduvannya/')} className="hover:text-primary">{dict.nav.branding}</Link></li>
            <li><Link href={l('/polityka-konfidentsiynosti/')} className="hover:text-primary">{dict.footer.privacy}</Link></li>
            <li><Link href={l('/publichna-oferta/')} className="hover:text-primary">{dict.footer.offer}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.contactsTitle}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {SITE.phones.map((p) => (
              <li key={p}>
                <a href={`tel:${p}`} className="font-semibold text-ink hover:text-primary tnum">
                  {formatPhone(p)}
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-primary">{SITE.email}</a>
            </li>
            <li className="pt-1">{city}, {address}</li>
            <li>{SITE.hours[locale]}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {SITE.legalName} · ЄДРПОУ {SITE.edrpou}
          </span>
          <span>{dict.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
