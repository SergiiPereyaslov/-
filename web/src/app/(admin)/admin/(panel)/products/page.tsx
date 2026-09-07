import Link from 'next/link';
import { prisma } from '@/lib/db';
import { quickUpdate } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; stock?: string; saved?: string }>;
}) {
  const { q, category, stock, saved } = await searchParams;

  const where = {
    // Шукаємо по нормалізованому полю: ILIKE залежить від локалі кластера
    // й на LC_CTYPE=C не знаходить кирилицю (див. src/lib/search-text.ts)
    ...(q ? { searchText: { contains: q.trim().toLowerCase() } } : {}),
    ...(category ? { categorySlug: category } : {}),
    ...(stock === 'out' ? { inStock: false } : {}),
  };

  const [products, categories, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: [{ categorySlug: 'asc' }, { sortOrder: 'asc' }], take: 300 }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, nameUk: true } }),
    prisma.product.count({ where }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl">Товари</h1>
        <span className="text-sm text-muted tnum">{total} шт.</span>
      </div>

      {saved && (
        <p className="mt-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm text-primary">
          Зміни збережено, сторінки сайту оновлено.
        </p>
      )}

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs text-muted">
            Пошук за назвою або артикулом
          </label>
          <input id="q" name="q" defaultValue={q ?? ''} className="field" />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-xs text-muted">
            Категорія
          </label>
          <select id="category" name="category" defaultValue={category ?? ''} className="field !w-56">
            <option value="">Усі</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nameUk}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stock" className="mb-1 block text-xs text-muted">
            Наявність
          </label>
          <select id="stock" name="stock" defaultValue={stock ?? ''} className="field !w-40">
            <option value="">Будь-яка</option>
            <option value="out">Немає в наявності</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Показати
        </button>
      </form>

      <p className="mt-4 text-xs text-muted">
        Ціну, наявність і позначку «хіт» можна змінити прямо тут — решта полів у картці товару.
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-3">Назва</th>
              <th className="py-2 pr-3">Артикул</th>
              <th className="py-2 pr-3">Категорія</th>
              <th className="py-2 pr-3">У пачці</th>
              <th className="py-2 pr-3">Ціна, грн/шт</th>
              <th className="py-2 pr-3">Є</th>
              <th className="py-2 pr-3">Хіт</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.slug}>
                <td className="py-1.5 pr-3">
                  <Link href={`/admin/products/${p.slug}/`} className="text-primary hover:underline">
                    {p.nameUk}
                  </Link>
                </td>
                <td className="py-1.5 pr-3 text-muted tnum">{p.sku}</td>
                <td className="py-1.5 pr-3 text-muted">{p.categorySlug}</td>
                <td className="py-1.5 pr-3 tnum">{p.unitsPerPack}</td>
                <td colSpan={4} className="py-1.5">
                  <form action={quickUpdate} className="flex items-center gap-3">
                    <input type="hidden" name="slug" value={p.slug} />
                    <input
                      name="priceRetail"
                      defaultValue={p.priceRetail.toString()}
                      inputMode="decimal"
                      className="field !h-8 !min-h-8 !w-24 !py-1 tnum"
                      aria-label={`Ціна ${p.nameUk}`}
                    />
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        name="inStock"
                        defaultChecked={p.inStock}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      є
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        name="featured"
                        defaultChecked={p.featured}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      хіт
                    </label>
                    <button type="submit" className="btn btn-secondary !h-8 !min-h-8 !px-3 !text-xs">
                      Зберегти
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > products.length && (
        <p className="mt-4 text-sm text-muted">
          Показано перші {products.length} із {total}. Звузьте пошук, щоб побачити решту.
        </p>
      )}
    </div>
  );
}
