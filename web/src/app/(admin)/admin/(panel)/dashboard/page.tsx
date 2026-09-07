import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  new: 'Нові',
  in_progress: 'В роботі',
  done: 'Завершені',
  rejected: 'Відхилені',
};

export default async function DashboardPage() {
  const [leadsByStatus, products, outOfStock, categories, posts, failed, recent] = await Promise.all([
    prisma.lead.groupBy({ by: ['status'], _count: true }),
    prisma.product.count(),
    prisma.product.count({ where: { inStock: false } }),
    prisma.category.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.lead.count({ where: { notified: false } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const counts = Object.fromEntries(leadsByStatus.map((r) => [r.status, r._count]));

  const tiles = [
    ['Нові заявки', counts.new ?? 0, '/admin/leads/?status=new'],
    ['В роботі', counts.in_progress ?? 0, '/admin/leads/?status=in_progress'],
    ['Товарів', products, '/admin/products/'],
    ['Немає в наявності', outOfStock, '/admin/products/?stock=out'],
    ['Категорій', categories, '/admin/categories/'],
    ['Статей', posts, '/admin/posts/'],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl">Огляд</h1>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value, href]) => (
          <Link key={label} href={href} className="card p-4 transition hover:border-primary/50">
            <div className="font-display text-2xl font-bold tnum">{value}</div>
            <div className="mt-1 text-[13px] leading-snug text-muted">{label}</div>
          </Link>
        ))}
      </div>

      {failed > 0 && (
        <p className="mt-5 rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm">
          <b>{failed}</b> заявок не вдалося надіслати менеджеру. Перевірте налаштування
          Telegram або SMTP — самі заявки збережені й доступні у списку.
        </p>
      )}

      <h2 className="mt-8 text-lg">Останні заявки</h2>
      {recent.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Заявок ще немає.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3">Номер</th>
                <th className="py-2 pr-3">Клієнт</th>
                <th className="py-2 pr-3">Телефон</th>
                <th className="py-2 pr-3">Сума</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-3">
                    <Link href={`/admin/leads/${l.id}/`} className="font-medium text-primary tnum">
                      {l.number}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{l.name ?? '—'}</td>
                  <td className="py-2 pr-3 tnum">{l.phone}</td>
                  <td className="py-2 pr-3 tnum">{l.total ? `${l.total.toString()} грн` : '—'}</td>
                  <td className="py-2 pr-3">{STATUS_LABEL[l.status]}</td>
                  <td className="py-2 text-muted tnum">
                    {l.createdAt.toLocaleDateString('uk-UA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
