import { prisma } from '@/lib/db';
import { AB_ENABLED } from '@/lib/ab';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'A/B-тест навігації | SmartEcoPack' };

/**
 * Мінімальна кількість сесій на варіант, раніше якої дивитися результат
 * не має сенсу: при базовій конверсії ~3 % і очікуваній різниці 15 %
 * усе, що менше, — шум, який виглядає як результат.
 */
const MIN_SESSIONS = 1500;
/** І два повні тижні — щоб у вибірку потрапили і будні, і вихідні. */
const MIN_DAYS = 14;

const VARIANTS = [
  {
    key: 'a',
    title: 'A — контроль',
    note: 'Вхід у каталог тільки через мега-меню «Каталог». Блоку «Для кого» на головній немає.',
  },
  {
    key: 'b',
    title: 'B — нова навігація',
    note: 'Те саме мега-меню плюс блок «Для кого» на головній і в підвалі та чотири секторні посадкові.',
  },
] as const;

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

export default async function AbPage() {
  const rows = await prisma.abStat.groupBy({
    by: ['variant'],
    _sum: { sessions: true, catalog: true, cart: true, search: true, leads: true },
  });

  const days = await prisma.abStat.findMany({
    orderBy: { day: 'desc' },
    take: 60,
  });

  const totals = Object.fromEntries(
    rows.map((r) => [
      r.variant,
      {
        sessions: r._sum.sessions ?? 0,
        catalog: r._sum.catalog ?? 0,
        cart: r._sum.cart ?? 0,
        search: r._sum.search ?? 0,
        leads: r._sum.leads ?? 0,
      },
    ]),
  );

  const uniqueDays = new Set(days.map((d) => d.day.toISOString().slice(0, 10))).size;
  const minSessions = Math.min(
    ...VARIANTS.map((v) => totals[v.key]?.sessions ?? 0),
  );
  const ready = minSessions >= MIN_SESSIONS && uniqueDays >= MIN_DAYS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">A/B-тест навігації</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Порівнюються два входи в каталог. Ключова метрика — частка сесій, що дійшли до заявки.
          Допоміжні — глибина перегляду каталогу, додавання в кошик, пошук.
        </p>
      </div>

      {!AB_ENABLED && (
        <div className="card border-danger/40 bg-danger/5 p-4 text-sm">
          <strong>Тест вимкнений.</strong> Усі відвідувачі бачать варіант B — нову навігацію.
          Щоб запустити розподіл 50/50, поставте <code>NEXT_PUBLIC_AB_NAV=1</code> у <code>.env</code>{' '}
          і перезберіть застосунок.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {VARIANTS.map((v) => {
          const t = totals[v.key] ?? { sessions: 0, catalog: 0, cart: 0, search: 0, leads: 0 };
          return (
            <div key={v.key} className="card p-5">
              <h2 className="text-lg">{v.title}</h2>
              <p className="mt-1 text-[13px] leading-snug text-muted">{v.note}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[13px] text-muted">Сесій</dt>
                  <dd className="text-2xl font-semibold tnum">{t.sessions}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Заявок</dt>
                  <dd className="text-2xl font-semibold text-primary tnum">{t.leads}</dd>
                </div>
                <div className="col-span-2 border-t border-border pt-3">
                  <dt className="text-[13px] text-muted">Конверсія в заявку</dt>
                  <dd className="text-xl font-semibold tnum">
                    {pct(t.leads, t.sessions).toFixed(2)} %
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Дійшли до каталогу</dt>
                  <dd className="tnum">
                    {t.catalog} · {pct(t.catalog, t.sessions).toFixed(1)} %
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Додали в кошик</dt>
                  <dd className="tnum">
                    {t.cart} · {pct(t.cart, t.sessions).toFixed(1)} %
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Скористались пошуком</dt>
                  <dd className="tnum">
                    {t.search} · {pct(t.search, t.sessions).toFixed(1)} %
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <div className={`card p-5 ${ready ? 'border-primary/50' : ''}`}>
        <h2 className="text-lg">Умова зупинки</h2>
        {ready ? (
          <p className="mt-2 text-sm">
            <strong className="text-primary">Дані зібрано.</strong> Обидва варіанти набрали щонайменше{' '}
            {MIN_SESSIONS} сесій, тест іде {uniqueDays} днів. Результат можна інтерпретувати.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Дивитися результат ще зарано. Потрібно {MIN_SESSIONS} сесій на варіант (зараз мінімум{' '}
            <span className="tnum">{Number.isFinite(minSessions) ? minSessions : 0}</span>) і{' '}
            {MIN_DAYS} днів (зараз <span className="tnum">{uniqueDays}</span>). Рання перевірка
            результатів найчастіше і дає хибні висновки: різниця, яка «є» на трьохстах сесіях,
            зазвичай зникає на півтори тисячі.
          </p>
        )}
      </div>

      {days.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[13px] text-muted">
              <tr>
                <th className="p-3 font-medium">День</th>
                <th className="p-3 font-medium">Варіант</th>
                <th className="p-3 text-right font-medium">Сесій</th>
                <th className="p-3 text-right font-medium">Каталог</th>
                <th className="p-3 text-right font-medium">Кошик</th>
                <th className="p-3 text-right font-medium">Пошук</th>
                <th className="p-3 text-right font-medium">Заявок</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="p-3 tnum">{d.day.toISOString().slice(0, 10)}</td>
                  <td className="p-3 uppercase">{d.variant}</td>
                  <td className="p-3 text-right tnum">{d.sessions}</td>
                  <td className="p-3 text-right tnum">{d.catalog}</td>
                  <td className="p-3 text-right tnum">{d.cart}</td>
                  <td className="p-3 text-right tnum">{d.search}</td>
                  <td className="p-3 text-right tnum">{d.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
