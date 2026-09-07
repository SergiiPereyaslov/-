import Link from 'next/link';
import type { Locale } from '@/data/types';

const COPY = {
  uk: {
    title: 'Сторінку не знайдено',
    body: 'Можливо, адреса змінилася або сторінку прибрано. Скористайтеся каталогом або пошуком у шапці сайту.',
    catalog: 'Перейти в каталог',
    home: 'На головну',
  },
  ru: {
    title: 'Страница не найдена',
    body: 'Возможно, адрес изменился или страница удалена. Воспользуйтесь каталогом или поиском в шапке сайта.',
    catalog: 'Перейти в каталог',
    home: 'На главную',
  },
} as const;

/**
 * 404 з виходом у каталог, а не глухий кут.
 * Особливо важливо під час міграції: якщо якийсь старий URL випав із мапи
 * 301, користувач має куди піти замість того, щоб закрити вкладку.
 */
export default function NotFoundView({ locale = 'uk' }: { locale?: Locale }) {
  const t = COPY[locale];
  const p = locale === 'uk' ? '' : '/ru';

  return (
    <div className="container-page py-20 text-center">
      <p className="font-display text-6xl font-bold text-border tnum">404</p>
      <h1 className="mt-4 text-2xl">{t.title}</h1>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">{t.body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`${p}/catalog/`} className="btn btn-primary">
          {t.catalog}
        </Link>
        <Link href={`${p}/`} className="btn btn-secondary">
          {t.home}
        </Link>
      </div>
    </div>
  );
}
