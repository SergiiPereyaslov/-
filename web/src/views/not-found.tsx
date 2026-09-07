import Link from 'next/link';

/**
 * 404 з виходом у каталог, а не глухий кут.
 * Особливо важливо під час міграції: якщо якийсь старий URL випав із мапи
 * 301, користувач має куди піти замість того, щоб закрити вкладку.
 */
export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <p className="font-display text-6xl font-bold text-border tnum">404</p>
      <h1 className="mt-4 text-2xl">Сторінку не знайдено</h1>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
        Можливо, адреса змінилася або сторінку прибрано. Скористайтеся каталогом
        або пошуком у шапці сайту.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/catalog/" className="btn btn-primary">
          Перейти в каталог
        </Link>
        <Link href="/" className="btn btn-secondary">
          На головну
        </Link>
      </div>
    </div>
  );
}
