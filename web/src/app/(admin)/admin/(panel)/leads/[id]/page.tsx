import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatPhone } from '@/lib/site';
import { updateLead } from '../actions';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  quote: 'Запит прайсу',
  order: 'Замовлення',
  branding: 'Брендування',
};

const DELIVERY_LABEL: Record<string, string> = {
  pickup: 'Самовивіз',
  city: 'Доставка по Дніпру',
  np: 'Нова пошта',
};

const STATUSES = [
  ['new', 'Нова'],
  ['in_progress', 'В роботі'],
  ['done', 'Завершена'],
  ['rejected', 'Відхилена'],
] as const;

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  const items = (lead.items as { sku: string; name: string; packs: number; sum: number }[]) ?? [];

  const fields = [
    ['Тип', KIND_LABEL[lead.kind] ?? lead.kind],
    ['Ім’я', lead.name],
    ['Телефон', formatPhone(lead.phone)],
    ['E-mail', lead.email],
    ['Заклад', lead.company],
    ['Отримання', lead.delivery ? (DELIVERY_LABEL[lead.delivery] ?? lead.delivery) : null],
    ['Місто / відділення', lead.city],
    ['Тип клієнта', lead.customerType === 'company' ? 'ФОП / ТОВ' : lead.customerType ? 'Фізична особа' : null],
    ['Реквізити', lead.requisites],
    ['Коментар клієнта', lead.comment],
    ['Джерело', lead.source],
    ['Мова', lead.locale],
    ['Створено', lead.createdAt.toLocaleString('uk-UA')],
  ] as const;

  return (
    <div>
      <Link href="/admin/leads/" className="text-sm text-primary">
        ← Усі заявки
      </Link>

      <h1 className="mt-2 text-2xl tnum">{lead.number}</h1>

      {saved && (
        <p className="mt-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm text-primary">
          Зміни збережено.
        </p>
      )}

      {!lead.notified && (
        <p className="mt-3 rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm">
          Сповіщення менеджеру не доставлено. Причина: {lead.notifyError ?? 'невідома'}.
          Сама заявка збережена — з клієнтом можна працювати.
        </p>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {fields
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="grid grid-cols-[160px_1fr] gap-3 bg-surface px-4 py-2.5 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="whitespace-pre-wrap">{value}</dd>
                </div>
              ))}
          </dl>

          {items.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg">Склад замовлення</h2>
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2 pr-3">Товар</th>
                    <th className="py-2 pr-3">Артикул</th>
                    <th className="py-2 pr-3">Пачок</th>
                    <th className="py-2">Сума</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((i) => (
                    <tr key={i.sku}>
                      <td className="py-2 pr-3">{i.name}</td>
                      <td className="py-2 pr-3 text-muted tnum">{i.sku}</td>
                      <td className="py-2 pr-3 tnum">{i.packs}</td>
                      <td className="py-2 tnum">{i.sum.toFixed(2)} грн</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-bold">
                    <td className="py-2" colSpan={3}>
                      Разом
                    </td>
                    <td className="py-2 tnum">{lead.total?.toString() ?? '—'} грн</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <form action={updateLead} className="card space-y-4 p-5">
          <input type="hidden" name="id" value={lead.id} />
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              Статус
            </label>
            <select id="status" name="status" defaultValue={lead.status} className="field">
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="managerNote" className="mb-1 block text-sm font-medium">
              Нотатка менеджера
            </label>
            <textarea
              id="managerNote"
              name="managerNote"
              className="field min-h-32"
              defaultValue={lead.managerNote ?? ''}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Зберегти
          </button>
          <a href={`tel:${lead.phone}`} className="btn btn-secondary w-full tnum">
            {formatPhone(lead.phone)}
          </a>
        </form>
      </div>
    </div>
  );
}
