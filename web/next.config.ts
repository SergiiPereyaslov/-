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

  /**
   * Заголовки безпеки віддає сам застосунок, а не лише nginx.
   *
   * Дублювання з deploy/nginx.conf навмисне: поки що застосунок слухає
   * тільки 127.0.0.1 і обійти проксі неможливо, але це властивість однієї
   * конкретної конфігурації. Щойно поруч з'явиться інший спосіб дістатись
   * до порту — контейнер із опублікованим портом, тимчасовий прев'ю-стенд —
   * заголовки поїдуть разом із застосунком, а не лишаться в чужому конфізі.
   *
   * HSTS тут немає свідомо: у розробці сайт віддається по http://localhost,
   * і браузер запам'ятав би домен як «тільки https» на рік. Його ставить
   * nginx, який і термінує TLS.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          // Браузер не має вгадувати тип: завантажений файл, який видає себе
          // за картинку, не виконається як скрипт.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // На чужий домен їде тільки походження, без шляху й параметрів.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Дубль frame-ancestors у CSP — для старих браузерів.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Сайту не потрібні ні камера, ні мікрофон, ні геолокація.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
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

    /**
     * Імпорт каталогу йде Server Action'ом, а типовий ліміт тіла — 1 МБ.
     * Без цього рядка перевірка «файл більший за 5 МБ» в import/actions.ts
     * недосяжна: CSV на 1–5 МБ падав би раніше й з невиразною помилкою
     * фреймворка замість зрозумілого тексту. Три рубежі мають збігатися —
     * nginx client_max_body_size 8m, ця межа, і перевірка в коді.
     */
    serverActions: {
      bodySizeLimit: '5mb',
    },
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
