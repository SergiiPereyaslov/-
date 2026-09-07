import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const groups = await prisma.group.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl">Категорії</h1>
      <p className="mt-1 text-sm text-muted">
        Тут редагуються тексти, які бачить відвідувач і пошукова система. Структуру фільтрів
        змінює розробник — вона зашита в адреси сторінок.
      </p>

      {saved && (
        <p className="mt-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm text-primary">
          Збережено, сторінки сайту оновлено.
        </p>
      )}

      <div className="mt-6 space-y-8">
        {groups.map((g) => (
          <section key={g.slug}>
            <h2 className="border-b border-border pb-2 text-lg">{g.nameUk}</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/admin/categories/${c.slug}/`}
                    className="card flex items-center justify-between gap-3 p-3 transition hover:border-primary/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.nameUk}</span>
                      <span className="block text-xs text-muted">{c.slug}</span>
                    </span>
                    <span
                      className={`shrink-0 text-xs tnum ${c._count.products === 0 ? 'text-danger' : 'text-muted'}`}
                    >
                      {c._count.products}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
