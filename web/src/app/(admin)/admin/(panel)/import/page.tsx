import { ImportForm } from './ImportForm';

export const dynamic = 'force-dynamic';

const COLUMNS: [string, string][] = [
  ['артикул', 'обов’язково, унікальний'],
  ['назва_uk', 'обов’язково'],
  ['назва_ru', 'якщо порожньо — дублюється з української'],
  ['категорія', 'обов’язково, слаг категорії з розділу «Категорії»'],
  ['розмір_uk / розмір_ru', '«340 мл», «320×200×370 мм»'],
  ['опис_uk / опис_ru', 'текст картки товару'],
  ['в_пачці', 'обов’язково, ціле число'],
  ['ціна', 'обов’язково, роздрібна за штуку, грн'],
  ['ціна_опт', 'опційно; порожньо — щаблі рахуються автоматично'],
  ['наявність', '«так» / «ні»; порожньо — так'],
  ['логотип', 'чи можна брендувати; порожньо — ні'],
  ['форма', 'cup, lid, box, bag, round, flat…'],
  ['діаметр', 'для стаканів і кришок — основа сумісності'],
  ['фасети', '«volume=340;color=kraft»'],
  ['фото', 'URL або шлях у public/'],
];

export default function ImportPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl">Імпорт каталогу</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Завантажте вивантаження товарів у CSV. Товари з наявними артикулами оновлюються,
        нові — створюються. Якщо у файлі знайдено хоча б одну помилку, не записується
        нічого: половина імпортованого каталогу гірша за жодного.
      </p>
      <p className="mt-2 text-sm text-muted">
        Excel має зберігати файл як <b>CSV UTF-8</b>. Роздільник — кома або крапка з комою,
        визначається автоматично.
      </p>

      <ImportForm />

      <h2 className="mt-8 text-lg">Колонки</h2>
      <p className="mt-1 text-xs text-muted">
        Регістр і пробіли в назвах не мають значення; працюють і англійські варіанти
        (sku, name_uk, category, price…).
      </p>
      <dl className="mt-3 divide-y divide-border overflow-hidden rounded-md border border-border">
        {COLUMNS.map(([name, note]) => (
          <div key={name} className="grid grid-cols-[200px_1fr] gap-3 bg-surface px-4 py-2 text-sm">
            <dt className="font-mono text-[13px]">{name}</dt>
            <dd className="text-muted">{note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
