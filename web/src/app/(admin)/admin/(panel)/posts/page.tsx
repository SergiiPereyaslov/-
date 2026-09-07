import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const { saved, deleted } = await searchParams;
  const posts = await prisma.post.findMany({ orderBy: { publishedAt: 'desc' } });

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl">Блог</h1>
        <Link href="/admin/posts/new/" className="btn btn-primary !min-h-9">
          Нова стаття
        </Link>
      </div>

      {(saved || deleted) && (
        <p className="mt-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm text-primary">
          {saved ? 'Збережено, сторінки сайту оновлено.' : 'Статтю видалено.'}
        </p>
      )}

      {posts.length === 0 ? (
        <p className="mt-6 text-muted">Статей ще немає.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {posts.map((p) => (
            <li key={p.slug} className="card flex flex-wrap items-center gap-3 p-3">
              <span className="min-w-0 flex-1">
                <Link href={`/admin/posts/${p.slug}/`} className="font-medium text-primary hover:underline">
                  {p.titleUk}
                </Link>
                <span className="block text-xs text-muted tnum">
                  {p.publishedAt.toLocaleDateString('uk-UA')} · {p.slug}
                </span>
              </span>
              {!p.published && <span className="chip !py-0.5 text-xs">чернетка</span>}
              <Link href={`/blog/${p.slug}/`} target="_blank" className="text-xs text-primary">
                на сайті ↗
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
