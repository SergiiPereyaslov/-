import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { saveProduct } from '../actions';

export const dynamic = 'force-dynamic';

const SHAPES = ['cup', 'lid', 'sleeve', 'holder', 'straw', 'box', 'round', 'bag', 'flat'] as const;

const Field = ({
  name,
  label,
  defaultValue,
  hint,
  ...rest
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label htmlFor={name} className="mb-1 block text-sm font-medium">
      {label}
    </label>
    <input id={name} name={name} defaultValue={defaultValue ?? ''} className="field" {...rest} />
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

const Area = ({
  name,
  label,
  defaultValue,
  hint,
  rows = 4,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  rows?: number;
}) => (
  <div>
    <label htmlFor={name} className="mb-1 block text-sm font-medium">
      {label}
    </label>
    <textarea id={name} name={name} rows={rows} defaultValue={defaultValue} className="field font-mono text-[13px]" />
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

export default async function ProductEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, nameUk: true } }),
  ]);
  if (!product) notFound();

  const j = (v: unknown) => JSON.stringify(v, null, 2);

  return (
    <div>
      <Link href="/admin/products/" className="text-sm text-primary">
        ← Усі товари
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl">{product.nameUk}</h1>
        <Link href={`/product/${product.slug}/`} target="_blank" className="text-sm text-primary">
          Подивитись на сайті ↗
        </Link>
      </div>

      <form action={saveProduct} className="mt-6 space-y-6">
        <input type="hidden" name="slug" value={product.slug} />

        <section className="card space-y-4 p-5">
          <h2 className="text-lg">Основне</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="sku" label="Артикул" defaultValue={product.sku} required />
            <div>
              <label htmlFor="categorySlug" className="mb-1 block text-sm font-medium">
                Категорія
              </label>
              <select
                id="categorySlug"
                name="categorySlug"
                defaultValue={product.categorySlug}
                className="field"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nameUk}
                  </option>
                ))}
              </select>
            </div>
            <Field name="nameUk" label="Назва (укр)" defaultValue={product.nameUk} required />
            <Field name="nameRu" label="Назва (рос)" defaultValue={product.nameRu} required />
            <Field name="specUk" label="Розмір (укр)" defaultValue={product.specUk} hint="340 мл, 320×200×370 мм" />
            <Field name="specRu" label="Розмір (рос)" defaultValue={product.specRu} />
          </div>
          <Area name="descriptionUk" label="Опис (укр)" defaultValue={product.descriptionUk} />
          <Area name="descriptionRu" label="Опис (рос)" defaultValue={product.descriptionRu} />
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-lg">Ціни та наявність</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              name="priceRetail"
              label="Роздрібна ціна, грн/шт"
              defaultValue={product.priceRetail.toString()}
              inputMode="decimal"
              required
            />
            <Field
              name="unitsPerPack"
              label="Штук у пачці"
              defaultValue={product.unitsPerPack}
              inputMode="numeric"
              required
            />
            <Field
              name="lidDiameter"
              label="Діаметр вінця, мм"
              defaultValue={product.lidDiameter ?? ''}
              inputMode="numeric"
              hint="Основа сумісності стакан ↔ кришка"
            />
          </div>
          <Area
            name="tiers"
            label="Оптові щаблі"
            defaultValue={j(product.tiers)}
            rows={6}
            hint="JSON: [{ &quot;minPacks&quot;: 10, &quot;perUnit&quot;: 2.13 }]"
          />
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="inStock" defaultChecked={product.inStock} className="h-4 w-4 accent-[var(--primary)]" />
              У наявності
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="brandable" defaultChecked={product.brandable} className="h-4 w-4 accent-[var(--primary)]" />
              Можна брендувати
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product.featured} className="h-4 w-4 accent-[var(--primary)]" />
              Хіт продажів
            </label>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-lg">Характеристики та фільтри</h2>
          <Area
            name="attributes"
            label="Характеристики"
            defaultValue={j(product.attributes)}
            rows={8}
            hint="JSON: [{ &quot;label&quot;: { &quot;uk&quot;: &quot;Об’єм&quot;, &quot;ru&quot;: &quot;Объём&quot; }, &quot;value&quot;: { &quot;uk&quot;: &quot;340 мл&quot;, &quot;ru&quot;: &quot;340 мл&quot; } }]"
          />
          <Area
            name="facets"
            label="Значення фільтрів"
            defaultValue={j(product.facets)}
            rows={5}
            hint="JSON: { &quot;volume&quot;: &quot;340&quot;, &quot;color&quot;: &quot;kraft&quot; } — ключі беруться з налаштувань категорії"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="shape" className="mb-1 block text-sm font-medium">
                Силует заглушки
              </label>
              <select id="shape" name="shape" defaultValue={product.shape} className="field">
                {SHAPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">Показується, поки немає фото товару.</p>
            </div>
            <Field name="image" label="URL фото" defaultValue={product.image ?? ''} hint="Порожньо — показуємо силует" />
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">
            Зберегти й оновити сайт
          </button>
          <Link href="/admin/products/" className="btn btn-secondary">
            Скасувати
          </Link>
        </div>
      </form>
    </div>
  );
}
