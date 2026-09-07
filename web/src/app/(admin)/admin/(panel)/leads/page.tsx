import Link from 'next/link';
import { prisma } from '@/lib/db';
import type { LeadStatus } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  done: 'Завершена',
  rejected: 'Відхилена',
};

const KIND_LABEL: Record<string, string> = {
  quote: 'Прайс',
  order: 'Замовлення',
  branding: 'Брендування',
};

const FILTERS = [
  ['', 'Усі'],
  ['new', 'Нові'],
  ['in_progress', 'В роботі'],
  ['done', 'Завершені'],
  ['rejected', 'Відхилені'],
] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const current = Number(page ?? 1) || 1;
  const perPage = 30;
  const where = status && STATUS_LABEL[status] ? { status: status as LeadStatus } : {};

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (current - 1) * perPage,
      take: perPage,
    }),
    prisma.lead.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl">Заявки</h1>
        <span className="text-sm text-muted tnum">{total} шт.</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/admin/leads/?status=${value}` : '/admin/leads/'}
            className={`chip ${(status ?? '') === value ? '!border-primary !text-primary' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="mt-6 text-muted">Заявок за цим фільтром немає.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3">Номер</th>
                <th className="py-2 pr-3">Тип</th>
                <th className="py-2 pr-3">Клієнт</th>
                <th className="py-2 pr-3">Телефон</th>
                <th className="py-2 pr-3">Позицій</th>
                <th className="py-2 pr-3">Сума</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2">Створено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((l) => {
                const items = (l.items as { packs: number }[]) ?? [];
                return (
                  <tr key={l.id} className={l.status === 'new' ? 'bg-primary/5' : undefined}>
                    <td className="py-2 pr-3">
                      <Link href={`/admin/leads/${l.id}/`} className="font-medium text-primary tnum">
                        {l.number}
                      </Link>
                      {!l.notified && (
                        <span className="ml-1 text-xs text-danger" title={l.notifyError ?? ''}>
                          ⚠
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{KIND_LABEL[l.kind] ?? l.kind}</td>
                    <td className="py-2 pr-3">{l.name ?? '—'}</td>
                    <td className="py-2 pr-3 tnum">{l.phone}</td>
                    <td className="py-2 pr-3 tnum">{items.length || '—'}</td>
                    <td className="py-2 pr-3 tnum">{l.total ? l.total.toString() : '—'}</td>
                    <td className="py-2 pr-3">{STATUS_LABEL[l.status]}</td>
                    <td className="py-2 text-muted tnum">
                      {l.createdAt.toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/leads/?${status ? `status=${status}&` : ''}page=${n}`}
              className={`chip tnum ${n === current ? '!border-primary !text-primary' : ''}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
