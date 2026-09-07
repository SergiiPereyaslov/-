import type { NextConfig } from 'next';

/**
 * Мапа 301 зі старих URL. Джерело — docs/smartecopack/redirects-301.csv.
 * Кожен запис розгортається у чотири правила: корінь і /ru, зі слешем і без,
 * бо старий сайт віддавав адреси без завершального слеша.
 */
const LEGACY: [string, string][] = [
  ['/catalog/stakani-paperovi', '/catalog/stakany-paperovi/'],
  ['/catalog/stakani-dvosharovi', '/catalog/stakany-dvosharovi/'],
  ['/catalog/stakani-gofrovani', '/catalog/stakany-gofrovani/'],
  ['/catalog/krishki-dlya-stakaniv', '/catalog/kryshky-dlya-stakaniv/'],
  ['/catalog/termochohli', '/catalog/termochokhly/'],
  ['/catalog/trimachi', '/catalog/trymachi-dlya-stakaniv/'],
  ['/catalog/trubochki-paperovi', '/catalog/trubochky-paperovi/'],
  ['/catalog/trubochki-polimerni', '/catalog/trubochky-polimerni/'],
  ['/catalog/Lanch-box', '/catalog/lanch-boksy/'],
  ['/catalog/lanch-box', '/catalog/lanch-boksy/'],
  ['/catalog/salatnitsa', '/catalog/salatnyky/'],
  ['/catalog/supnik', '/catalog/supnyky/'],
  ['/catalog/alyuminievi-kontejneri', '/catalog/konteynery-alyuminiyevi/'],
  ['/catalog/tarilka-pryamokutna', '/catalog/tarilky-ta-sousnyky/'],
  ['/catalog/upakovka-dlya-fast-fudu', '/catalog/fastfud/'],
  ['/catalog/upakovka-dlya-fast-fudu/page-all', '/catalog/fastfud/'],
  ['/catalog/paketi-paperovi', '/catalog/pakety-z-ruchkamy/'],
  ['/catalog/paket-sashe', '/catalog/pakety-sashe/'],
  ['/catalog/suputni-tovari', '/catalog/suputni-tovary/'],
  ['/all-products', '/catalog/'],
  ['/branding', '/brenduvannya/'],
  ['/druk-na-paperovih-stakanchikah', '/brenduvannya/druk-na-stakanakh/'],
  ['/news', '/blog/'],
  ['/contact', '/kontakty/'],
];

const expand = () =>
  LEGACY.flatMap(([from, to]) =>
    ['', '/ru'].flatMap((prefix) =>
      [from, `${from}/`].map((source) => ({
        source: `${prefix}${source}`,
        destination: `${prefix}${to}`,
        permanent: true,
      })),
    ),
  );

const nextConfig: NextConfig = {
  trailingSlash: true,

  async redirects() {
    return [
      ...expand(),
      // Шаблонні правила зі старої пагінації
      { source: '/catalog/:slug/page-all', destination: '/catalog/:slug/', permanent: true },
      { source: '/ru/catalog/:slug/page-all', destination: '/ru/catalog/:slug/', permanent: true },
      // Старий шлях товару був /products/:slug (мн.), новий — /product/:slug
      { source: '/products/:slug', destination: '/product/:slug/', permanent: true },
      { source: '/ru/products/:slug', destination: '/ru/product/:slug/', permanent: true },
      // Блог переїхав з /news на /blog
      { source: '/news/:slug', destination: '/blog/:slug/', permanent: true },
      { source: '/ru/news/:slug', destination: '/ru/blog/:slug/', permanent: true },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
