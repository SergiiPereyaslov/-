import 'server-only';
import { revalidatePath } from 'next/cache';

/**
 * Публічні сторінки генеруються статично, тому після правки в адмінці їх
 * треба перебудувати точково. Тут зібрані всі місця, де може «світитися»
 * товар чи категорія, — інакше зміна ціни лишалась би невидимою до
 * наступного деплою.
 */
const both = (path: string) => {
  revalidatePath(path);
  revalidatePath(`/ru${path === '/' ? '' : path}`);
};

export const revalidateProduct = (slug: string, categorySlug: string, groupSlug?: string) => {
  both(`/product/${slug}/`);
  both(`/catalog/${categorySlug}/`);
  if (groupSlug) both(`/catalog/${groupSlug}/`);
  both('/catalog/');
  both('/');
  revalidatePath('/sitemap.xml');
};

export const revalidateCategory = (slug: string, groupSlug?: string) => {
  both(`/catalog/${slug}/`);
  if (groupSlug) both(`/catalog/${groupSlug}/`);
  both('/catalog/');
  both('/');
  revalidatePath('/sitemap.xml');
};

export const revalidatePost = (slug: string) => {
  both(`/blog/${slug}/`);
  both('/blog/');
  revalidatePath('/sitemap.xml');
};

/** Після масового імпорту дешевше перебудувати весь сайт, ніж перелічувати шляхи. */
export const revalidateEverything = () => {
  revalidatePath('/', 'layout');
  revalidatePath('/ru', 'layout');
  revalidatePath('/sitemap.xml');
};
