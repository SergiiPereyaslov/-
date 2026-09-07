'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidateProduct } from '@/lib/revalidate';
import { revalidatePath } from 'next/cache';
import { buildSearchText } from '@/lib/search-text';

const requireSession = async () => {
  const session = await getSession();
  if (!session) throw new Error('Немає доступу');
  return session;
};

const num = (v: FormDataEntryValue | null) => Number(String(v ?? '').replace(',', '.'));

const groupOf = async (categorySlug: string) =>
  (await prisma.category.findUnique({ where: { slug: categorySlug }, select: { groupSlug: true } }))
    ?.groupSlug;

/**
 * Швидка правка просто зі списку: ціна, наявність, «хіт».
 * Це те, що змінюється щодня, — заради цього не варто відкривати
 * повну картку товару.
 */
export async function quickUpdate(formData: FormData) {
  await requireSession();

  const slug = String(formData.get('slug') ?? '');
  const priceRetail = num(formData.get('priceRetail'));
  if (!slug || !Number.isFinite(priceRetail) || priceRetail <= 0) {
    throw new Error('Некоректна ціна');
  }

  const product = await prisma.product.update({
    where: { slug },
    data: {
      priceRetail,
      inStock: formData.get('inStock') === 'on',
      featured: formData.get('featured') === 'on',
    },
  });

  revalidateProduct(slug, product.categorySlug, await groupOf(product.categorySlug));
  revalidatePath('/admin/products/');
}

/** Повне збереження картки товару. */
export async function saveProduct(formData: FormData) {
  await requireSession();

  const slug = String(formData.get('slug') ?? '');
  if (!slug) throw new Error('Немає слага');

  const priceRetail = num(formData.get('priceRetail'));
  const unitsPerPack = Math.trunc(num(formData.get('unitsPerPack')));
  if (!Number.isFinite(priceRetail) || priceRetail <= 0) throw new Error('Некоректна ціна');
  if (!Number.isFinite(unitsPerPack) || unitsPerPack < 1) throw new Error('Некоректна кількість у пачці');

  const parseJson = (field: string, fallback: unknown) => {
    const raw = String(formData.get(field) ?? '').trim();
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Поле «${field}» містить некоректний JSON`);
    }
  };

  const lidDiameter = Math.trunc(num(formData.get('lidDiameter')));

  const sku = String(formData.get('sku') ?? '').trim();
  const nameUk = String(formData.get('nameUk') ?? '').trim();
  const nameRu = String(formData.get('nameRu') ?? '').trim();
  const specUk = String(formData.get('specUk') ?? '').trim();
  const specRu = String(formData.get('specRu') ?? '').trim();
  const facets = parseJson('facets', {}) as Record<string, string>;

  const product = await prisma.product.update({
    where: { slug },
    data: {
      sku,
      categorySlug: String(formData.get('categorySlug') ?? ''),
      nameUk,
      nameRu,
      specUk,
      specRu,
      descriptionUk: String(formData.get('descriptionUk') ?? '').trim(),
      descriptionRu: String(formData.get('descriptionRu') ?? '').trim(),
      attributes: parseJson('attributes', []) as never,
      facets: facets as never,
      searchText: buildSearchText({ nameUk, nameRu, sku, specUk, specRu, facets }),
      tiers: parseJson('tiers', []) as never,
      unitsPerPack,
      priceRetail,
      inStock: formData.get('inStock') === 'on',
      brandable: formData.get('brandable') === 'on',
      featured: formData.get('featured') === 'on',
      shape: String(formData.get('shape') ?? 'box'),
      lidDiameter: Number.isFinite(lidDiameter) && lidDiameter > 0 ? lidDiameter : null,
      image: String(formData.get('image') ?? '').trim() || null,
    },
  });

  revalidateProduct(slug, product.categorySlug, await groupOf(product.categorySlug));
  revalidatePath('/admin/products/');
  redirect('/admin/products/?saved=1');
}
