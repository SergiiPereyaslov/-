import Link from 'next/link';
import type { Locale } from '@/data/types';
import type { Dict } from '@/i18n/dictionaries';
import { SITE, formatPhone } from '@/lib/site';
import type { NavGroup } from './Header';
import { Logo } from './Logo';
import { CITIES } from '@/data/cities';

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
    <footer className="mt-16 band-deep">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <Logo className="h-14 w-14" />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.catalogTitle}</h2>
          <ul className="space-y-2 text-sm opacity-85">
            {nav.map((g) => (
              <li key={g.slug}>
                <Link href={l(`/catalog/${g.slug}/`)} className="hover:opacity-70">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.companyTitle}</h2>
          <ul className="space-y-2 text-sm opacity-85">
            <li><Link href={l('/pro-nas/')} className="hover:opacity-70">{dict.nav.about}</Link></li>
            <li><Link href={l('/blog/')} className="hover:opacity-70">{dict.nav.blog}</Link></li>
            <li><Link href={l('/kontakty/')} className="hover:opacity-70">{dict.nav.contacts}</Link></li>
          </ul>

          <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide">
            {locale === 'uk' ? 'Доставка' : 'Доставка'}
          </h2>
          <ul className="space-y-2 text-sm opacity-85">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={l(`/upakovka/${c.slug}/`)} className="hover:opacity-70">
                  {c.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.customersTitle}</h2>
          <ul className="space-y-2 text-sm opacity-85">
            <li><Link href={l('/dostavka-i-oplata/')} className="hover:opacity-70">{dict.nav.delivery}</Link></li>
            <li><Link href={l('/brenduvannya/')} className="hover:opacity-70">{dict.nav.branding}</Link></li>
            <li><Link href={l('/polityka-konfidentsiynosti/')} className="hover:opacity-70">{dict.footer.privacy}</Link></li>
            <li><Link href={l('/publichna-oferta/')} className="hover:opacity-70">{dict.footer.offer}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">{dict.footer.contactsTitle}</h2>
          <ul className="space-y-2 text-sm opacity-85">
            {SITE.phones.map((p) => (
              <li key={p}>
                <a href={`tel:${p}`} className="font-semibold hover:opacity-70 tnum">
                  {formatPhone(p)}
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:opacity-70">{SITE.email}</a>
            </li>
            <li className="pt-1">{city}, {address}</li>
            <li>{SITE.hours[locale]}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-4 text-xs opacity-75 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {SITE.legalName} · ЄДРПОУ {SITE.edrpou}
          </span>
          <span>{dict.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
