import type { NextConfig } from 'next';

const gaId = process.env.NEXT_PUBLIC_GA_ID ?? '';

/** Джерела GA підключаються, лише коли лічильник справді налаштований. */
const ga = gaId
  ? {
      script: ' https://www.googletagmanager.com',
      connect: ' https://www.google-analytics.com https://*.google-analytics.com',
      img: ' https://www.google-analytics.com https://*.google-analytics.com',
    }
  : { script: '', connect: '', img: '' };

/**
 * Content-Security-Policy.
 *
 * Чому `script-src` із 'unsafe-inline', а не з хешами чи nonce — перевірено
 * на зібраному сайті: Next вставляє в кожну сторінку власні інлайн-скрипти
 * з RSC-payload (`self.__next_f.push(...)`). Їхній вміст залежить від
 * сторінки, тому хеші порахувати наперед неможливо, а nonce вимагає
 * динамічного рендерингу — це знищило б 258 статичних сторінок. Політика з
 * хешами блокувала їх і ламала гідратацію (React #412): кошик, фільтри й
 * пошук переставали працювати.
 *
 * Що політика все одно дає:
 *   • блокує підвантаження скриптів зі сторонніх доменів;
 *   • немає 'unsafe-eval' — payload через eval не запуститься;
 *   • base-uri 'none' — не можна підмінити базовий URL сторінки;
 *   • form-action 'self' — форму не перенаправити на чужий сервер;
 *   • frame-ancestors 'none' — захист від клікджекінгу.
 *
 * Чого не дає: не зупинить інлайн-скрипт, який зловмисник зумів вставити в
 * саму розмітку. Головний захист від цього — React, який екранує весь текст,
 * і відсутність місць, де HTML від користувача рендериться як розмітка.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${ga.script}`,
  // Tailwind і next/font підставляють інлайн-стилі
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${ga.img}`,
  "font-src 'self' data:",
  `connect-src 'self'${ga.connect}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  /*
   * Тільки на проді: у розробці сайт віддається по http://localhost, і ця
   * директива піднімала б кожен префетч у https — усі переходи падали б із
   * ERR_SSL_PROTOCOL_ERROR. На бойовому сайті сторінка й так по HTTPS.
   */
  ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
].join('; ');

const nextConfig: NextConfig = {
  /** Версію фреймворка стороннім знати нема потреби. */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy', value: csp }],
      },
    ];
  },

  /**
   * Збірка в .next/standalone: у контейнер їде мінімальний набір файлів
   * замість усього node_modules — образ виходить у рази менший.
   */
  output: 'standalone',

  /** Канонічні URL із завершальним слешем — так вони й у sitemap. */
  trailingSlash: true,

  /**
   * Вбудована нормалізація слеша вимкнена навмисно: вона спрацьовує раніше
   * за middleware й перетворює перехід зі старого URL на ланцюжок 308 → 301.
   * Слеш додає middleware — після перевірки мапи legacy-редиректів, тому
   * старий URL веде на новий за один хоп.
   */
  skipTrailingSlashRedirect: true,

  experimental: {
    /** Вмикає app/global-not-found.tsx — 404 для адрес поза мовними деревами. */
    globalNotFound: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  /** У корені репозиторію лежить інший проєкт зі своїм lockfile — фіксуємо корінь. */
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
