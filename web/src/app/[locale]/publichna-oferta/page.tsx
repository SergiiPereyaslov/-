import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { LEGAL_BY_SLUG } from '@/data/legal';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';

const SLUG = 'publichna-oferta';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  const doc = LEGAL_BY_SLUG.get(SLUG)!;
  return pageMeta({
    locale: l,
    path: `/${SLUG}/`,
    title: doc.title[l],
    description: `${doc.title[l]} — ${SITE.legalName}`,
    noindex: true,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  const dict = getDict(l);
  const doc = LEGAL_BY_SLUG.get(SLUG)!;

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: doc.title[l] }]}
      />
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl">{doc.title[l]}</h1>
        <p className="mt-2 text-sm text-muted tnum">
          {l === 'uk' ? 'Редакція від' : 'Редакция от'} {doc.updated} · {SITE.legalName}
        </p>
        <div className="prose-uk mt-8">
          {doc.sections.map((s) => (
            <section key={s.h.uk}>
              <h2>{s.h[l]}</h2>
              {s.p.map((para) => (
                <p key={para.uk.slice(0, 24)}>{para[l]}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
