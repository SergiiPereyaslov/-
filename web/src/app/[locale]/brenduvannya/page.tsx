import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/data/types';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BrandingCalculator } from '@/components/BrandingCalculator';
import { Faq } from '@/components/Faq';
import { Placeholder, type Shape } from '@/components/Placeholder';

const COPY = {
  uk: {
    h1: 'Брендування упаковки для кафе та ресторанів',
    lead: 'Стакан і пакет виходять із закладу на вулицю. Це найдешевша зовнішня реклама, яку може дозволити собі кав’ярня на одну точку — від 100 штук тиражу.',
    whyTitle: 'Навіщо брендувати упаковку',
    why: [
      ['Реклама, за яку вже заплачено', 'Ви й так купуєте стакани. Логотип на них додає кілька копійок до собівартості й перетворює витратний матеріал на носій.'],
      ['Вузнаваність з першого разу', 'Клієнт, який побачив ваш стакан у руках колеги, приходить із готовою асоціацією.'],
      ['Сприйняття рівня закладу', 'Брендована упаковка читається як ознака стабільного бізнесу, а не тимчасової точки.'],
    ],
    stepsTitle: 'Як це відбувається',
    steps: [
      ['Прорахунок', 'Ви називаєте виріб, тираж і кількість кольорів — ми даємо ціну того ж дня.'],
      ['Макет', 'Присилаєте логотип у векторі. Немає макета — розробимо самі.'],
      ['Затвердження', 'Показуємо цифровий прев’ю на розгортці виробу. Друк починається після вашого «так».'],
      ['Виробництво й доставка', 'Від 5 робочих днів. По Дніпру привозимо самі.'],
    ],
    reqTitle: 'Вимоги до макета',
    req: [
      'Векторний формат: AI, EPS, PDF або SVG',
      'Кольори у Pantone — так друк збігається з вашим фірмовим стилем',
      'Текст переведений у криві',
      'Відступ від краю виробу не менше 5 мм',
      'Для гофрованих стаканів — без тонких ліній і градієнтів: рельєф їх «з’їдає»',
    ],
    whatTitle: 'Що можна брендувати',
    faqTitle: 'Часті питання',
  },
  ru: {
    h1: 'Брендирование упаковки для кафе и ресторанов',
    lead: 'Стакан и пакет выходят из заведения на улицу. Это самая дешёвая наружная реклама, которую может позволить себе кофейня на одну точку — от 100 штук тиража.',
    whyTitle: 'Зачем брендировать упаковку',
    why: [
      ['Реклама, за которую уже заплачено', 'Вы и так покупаете стаканы. Логотип на них добавляет несколько копеек к себестоимости и превращает расходник в носитель.'],
      ['Узнаваемость с первого раза', 'Клиент, увидевший ваш стакан в руках коллеги, приходит с готовой ассоциацией.'],
      ['Восприятие уровня заведения', 'Брендированная упаковка читается как признак стабильного бизнеса, а не временной точки.'],
    ],
    stepsTitle: 'Как это происходит',
    steps: [
      ['Просчёт', 'Вы называете изделие, тираж и количество цветов — мы даём цену в тот же день.'],
      ['Макет', 'Присылаете логотип в векторе. Нет макета — разработаем сами.'],
      ['Утверждение', 'Показываем цифровое превью на развёртке изделия. Печать начинается после вашего «да».'],
      ['Производство и доставка', 'От 5 рабочих дней. По Днепру привозим сами.'],
    ],
    reqTitle: 'Требования к макету',
    req: [
      'Векторный формат: AI, EPS, PDF или SVG',
      'Цвета в Pantone — так печать совпадает с вашим фирменным стилем',
      'Текст переведён в кривые',
      'Отступ от края изделия не менее 5 мм',
      'Для гофрированных стаканов — без тонких линий и градиентов: рельеф их «съедает»',
    ],
    whatTitle: 'Что можно брендировать',
    faqTitle: 'Частые вопросы',
  },
} as const;

const FAQ = {
  uk: [
    ['Від якого тиражу ви друкуєте?', 'Від 100 штук. Це свідомо низький поріг — щоб брендування було доступне точці на одну кав’ярню, а не лише мережам.'],
    ['Скільки часу займає виготовлення?', 'Від 5 робочих днів для тиражів до 1000 штук і до 12 днів для великих. Відлік починається після затвердження макета.'],
    ['У мене немає логотипа у векторі. Що робити?', 'Наш дизайнер відмалює наявне зображення у вектор. Якщо логотипа немає взагалі — розробимо з нуля.'],
    ['Чи можна побачити результат до друку?', 'Так, ми надсилаємо цифрове прев’ю на розгортці виробу. Друк стартує тільки після вашого підтвердження.'],
    ['Скільки кольорів оптимально?', 'Один-два. Кожен додатковий колір збільшує вартість і час, а на упаковці лаконічний логотип читається краще за складний макет.'],
  ],
  ru: [
    ['От какого тиража вы печатаете?', 'От 100 штук. Это сознательно низкий порог — чтобы брендирование было доступно точке на одну кофейню, а не только сетям.'],
    ['Сколько времени занимает изготовление?', 'От 5 рабочих дней для тиражей до 1000 штук и до 12 дней для больших. Отсчёт начинается после утверждения макета.'],
    ['У меня нет логотипа в векторе. Что делать?', 'Наш дизайнер отрисует имеющееся изображение в вектор. Если логотипа нет вообще — разработаем с нуля.'],
    ['Можно ли увидеть результат до печати?', 'Да, мы присылаем цифровое превью на развёртке изделия. Печать стартует только после вашего подтверждения.'],
    ['Сколько цветов оптимально?', 'Один-два. Каждый дополнительный цвет увеличивает стоимость и время, а на упаковке лаконичный логотип читается лучше сложного макета.'],
  ],
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  return pageMeta({
    locale: l,
    path: '/brenduvannya/',
    title: l === 'uk' ? 'Брендування упаковки — друк логотипу' : 'Брендирование упаковки — печать логотипа',
    description:
      l === 'uk'
        ? 'Друк логотипу на стаканах, пакетах і боксах від 100 штук. Порахуйте вартість у калькуляторі, макет розробимо самі. Термін від 5 робочих днів.'
        : 'Печать логотипа на стаканах, пакетах и боксах от 100 штук. Рассчитайте стоимость в калькуляторе, макет разработаем сами. Срок от 5 рабочих дней.',
  });
}

export default async function BrandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  const dict = getDict(l);
  const t = COPY[l];
  const p = l === 'uk' ? '' : '/ru';

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: dict.nav.branding }]}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
        <div>
          <h1 className="text-3xl">{t.h1}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">{t.lead}</p>

          <section className="mt-10">
            <h2 className="text-xl">{t.whyTitle}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {t.why.map(([title, body]) => (
                <div key={title} className="card p-4">
                  <h3 className="text-[15px] font-bold leading-snug">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl">{t.whatTitle}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ['cup', l === 'uk' ? 'Стакани' : 'Стаканы', 'stakany-paperovi'],
                ['sleeve', l === 'uk' ? 'Термочохли' : 'Термочехлы', 'termochokhly'],
                ['bag', l === 'uk' ? 'Пакети' : 'Пакеты', 'pakety-z-ruchkamy'],
                ['box', l === 'uk' ? 'Бокси' : 'Боксы', 'lanch-boksy'],
              ] as [Shape, string, string][]).map(([shape, label, cat]) => (
                <Link key={cat} href={`${p}/catalog/${cat}/`} className="card overflow-hidden transition hover:border-primary/50">
                  <Placeholder shape={shape} className="aspect-square w-full" />
                  <span className="block p-2.5 text-center text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl">{t.stepsTitle}</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {t.steps.map(([title, body], i) => (
                <li key={title} className="card p-4">
                  <span className="font-display text-2xl font-bold text-border tnum">{i + 1}</span>
                  <h3 className="mt-1 font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-xl">{t.reqTitle}</h2>
            <ul className="mt-3 space-y-2">
              {t.req.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <div className="max-w-3xl">
            <Faq
              items={FAQ[l].map(([q, a]) => ({ q: { uk: q, ru: q }, a: { uk: a, ru: a } }))}
              locale={l}
              title={t.faqTitle}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-32">
          <BrandingCalculator locale={l} dict={dict} />
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        {l === 'uk' ? 'Мінімальний тираж' : 'Минимальный тираж'}:{' '}
        <b className="text-ink tnum">{SITE.brandingMinUnits}</b> {dict.common.pcs}
      </p>
    </div>
  );
}
