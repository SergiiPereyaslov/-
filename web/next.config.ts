import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /** Канонічні URL із завершальним слешем — так вони й у sitemap. */
  trailingSlash: true,

  /**
   * Вбудована нормалізація слеша вимкнена навмисно: вона спрацьовує раніше
   * за middleware й перетворює перехід зі старого URL на ланцюжок 308 → 301.
   * Слеш додає middleware — після перевірки мапи legacy-редиректів, тому
   * старий URL веде на новий за один хоп.
   */
  skipTrailingSlashRedirect: true,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  /** У корені репозиторію лежить інший проєкт зі своїм lockfile — фіксуємо корінь. */
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
