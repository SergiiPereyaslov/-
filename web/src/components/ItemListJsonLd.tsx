import { JsonLd } from './JsonLd';

/**
 * ItemList для сторінок зі списком.
 *
 * Форма з самими URL — та, яку Google рекомендує для «сторінки-зведення»:
 * елементи живуть за власними адресами, а список лише каже, у якому порядку
 * вони йдуть. Вкладати сюди повні об'єкти Product означало б дублювати
 * розмітку картки товару й ризикувати розбіжністю даних між сторінками.
 *
 * Обмеження в 30 позицій навмисне: довший список нічого не додає до
 * розуміння сторінки, але помітно роздуває HTML на кожній категорії.
 */
const MAX_ITEMS = 30;

export function ItemListJsonLd({ urls, name }: { urls: string[]; name: string }) {
  if (!urls.length) return null;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        numberOfItems: urls.length,
        itemListElement: urls.slice(0, MAX_ITEMS).map((url, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url,
        })),
      }}
    />
  );
}
