import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { POSTS, formatDate } from '@/data/posts';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  return pageMeta({
    locale: l,
    path: '/blog/',
    title: l === 'uk' ? 'Блог про упаковку — SmartEcoPack' : 'Блог об упаковке — SmartEcoPack',
    description:
      l === 'uk'
        ? 'Практичні матеріали про вибір паперової упаковки: розміри стаканів, сумісність кришок, брендування, упаковка для доставки.'
        : 'Практические материалы о выборе бумажной упаковки: размеры стаканов, совместимость крышек, брендирование, упаковка для доставки.',
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  const dict = getDict(l);
  const p = l === 'uk' ? '' : '/ru';
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: dict.nav.blog }]}
      />

      <h1 className="text-3xl">{dict.nav.blog}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {l === 'uk'
          ? 'Пишемо про те, що реально впливає на роботу закладу: як не помилитися з розміром, чим відрізняються конструкції стаканів і коли брендування окупається.'
          : 'Пишем о том, что реально влияет на работу заведения: как не ошибиться с размером, чем отличаются конструкции стаканов и когда брендирование окупается.'}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.slug} className="card flex flex-col p-5 transition hover:border-primary/50">
            <time dateTime={post.date} className="text-xs text-muted tnum">
              {formatDate(post.date, l)}
            </time>
            <h2 className="mt-2 text-lg leading-snug">
              <Link href={`${p}/blog/${post.slug}/`} className="hover:text-primary">
                {post.title[l]}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt[l]}</p>
            <Link href={`${p}/blog/${post.slug}/`} className="mt-4 text-sm font-semibold text-primary">
              {dict.common.details} →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
