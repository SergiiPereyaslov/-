import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /** Канонічні URL із завершальним слешем — так вони й у sitemap. */
  trailingSlash: true,

  /**
   * Вбудована нормалізація слеша вимкнена навмисно: вона спрацьовує раніше
   * за middleware й перетворює перехід зі старого URL на ланцюжок 308 → 301.
   * Слеш додає middleware — після того, як перевірить мапу legacy-редиректів,
   * тому старий URL веде на новий за один хоп.
   */
  skipTrailingSlashRedirect: true,

  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
