import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { getPost, getPosts, formatDate } from '@/lib/posts';
import { getCategory } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { SITE, canonical } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';

export async function staticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function meta(
  l: Locale,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return pageMeta({
    locale: l,
    path: `/blog/${slug}/`,
    title: clampTitle(post.title[l]),
    description: clampDescription(post.excerpt[l]),
  });
}

export default async function PostPage({
  locale: l,
  params,
}: {
  locale: Locale;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dict = getDict(l);
  const post = await getPost(slug);
  if (!post) notFound();
  const p = l === 'uk' ? '' : '/ru';

  const [all, relatedCategories] = await Promise.all([
    getPosts(),
    Promise.all(post.related.map((cs) => getCategory(cs))),
  ]);
  const others = all.filter((x) => x.slug !== slug).slice(0, 3);

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[
          { label: dict.nav.home, href: '/' },
          { label: dict.nav.blog, href: '/blog/' },
          { label: post.title[l] },
        ]}
      />

      <article className="mx-auto max-w-3xl">
        <time dateTime={post.date} className="text-sm text-muted tnum">
          {formatDate(post.date, l)}
        </time>
        <h1 className="mt-2 text-3xl leading-tight">{post.title[l]}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{post.excerpt[l]}</p>

        <div className="prose-uk mt-8">
          {post.body.map((block, i) => {
            const text = block[l];
            return text.startsWith('## ') ? (
              <h2 key={i}>{text.slice(3)}</h2>
            ) : (
              <p key={i}>{text}</p>
            );
          })}
        </div>

        {post.related.length > 0 && (
          <nav className="mt-10 border-t border-border pt-5">
            <h2 className="mb-2 text-sm font-bold">
              {l === 'uk' ? 'Згадані категорії' : 'Упомянутые категории'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((cat) => {
                if (!cat) return null;
                return (
                  <Link
                    key={cat.slug}
                    href={`${p}/catalog/${cat.slug}/`}
                    className="chip hover:border-primary hover:text-primary"
                  >
                    {cat.name[l]}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </article>

      {others.length > 0 && (
        <section className="mx-auto mt-12 max-w-3xl">
          <h2 className="mb-4 text-xl">{l === 'uk' ? 'Читайте також' : 'Читайте также'}</h2>
          <ul className="space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`${p}/blog/${o.slug}/`} className="text-primary hover:underline">
                  {o.title[l]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title[l],
          description: post.excerpt[l],
          datePublished: post.date,
          inLanguage: l === 'uk' ? 'uk-UA' : 'ru-UA',
          mainEntityOfPage: canonical(l, `/blog/${post.slug}/`),
          author: { '@id': `${SITE.url}/#organization` },
          publisher: { '@id': `${SITE.url}/#organization` },
        }}
      />
    </div>
  );
}
