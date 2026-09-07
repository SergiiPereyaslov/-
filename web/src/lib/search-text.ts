/**
 * Побудова рядка для пошуку.
 *
 * Приведення до нижнього регістру робиться в застосунку, а не запитом
 * lower()/ILIKE: результат PostgreSQL залежить від LC_CTYPE кластера, і при
 * локалі C кирилиця не згортається взагалі — пошук за «Стакан» мовчки
 * перестає знаходити товари. JS-ий toLowerCase() працює за Unicode завжди.
 */
export const buildSearchText = (p: {
  nameUk: string;
  nameRu: string;
  sku: string;
  specUk?: string | null;
  specRu?: string | null;
  facets?: unknown;
}) => {
  const facetValues =
    p.facets && typeof p.facets === 'object'
      ? Object.values(p.facets as Record<string, unknown>).map(String)
      : [];

  return [p.nameUk, p.nameRu, p.sku, p.specUk ?? '', p.specRu ?? '', ...facetValues]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};
