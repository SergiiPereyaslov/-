import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Тільки службові сторінки. Правило на кшталт '/*?*' тут не потрібне:
        // фільтри працюють станом на клієнті й не створюють URL з параметрами,
        // натомість таке правило заблокувало б переходи з UTM-мітками.
        disallow: [
          '/api/',
          '/koshyk/',
          '/oformlennya/',
          '/dyakuyemo/',
          '/ru/koshyk/',
          '/ru/oformlennya/',
          '/ru/dyakuyemo/',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
