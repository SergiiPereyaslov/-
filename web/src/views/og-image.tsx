import { ImageResponse } from 'next/og';
import type { Locale } from '@/data/types';

export const OG_SIZE = { width: 1200, height: 630 };

const COPY = {
  uk: {
    title: 'Паперова упаковка для їжі навинос',
    subtitle: 'Власний склад у Дніпрі · доставка за 24 години · друк логотипу від 100 шт',
    badge: 'Опт і роздріб',
  },
  ru: {
    title: 'Бумажная упаковка для еды навынос',
    subtitle: 'Собственный склад в Днепре · доставка за 24 часа · печать логотипа от 100 шт',
    badge: 'Опт и розница',
  },
} as const;

export const OG_ALT: Record<Locale, string> = {
  uk: 'SmartEcoPack — паперова упаковка для їжі оптом у Дніпрі',
  ru: 'SmartEcoPack — бумажная упаковка для еды оптом в Днепре',
};

/**
 * Картинка для соцмереж і месенджерів.
 *
 * Віддається окремим маршрутом /og, а не файловою конвенцією
 * opengraph-image: у проєкті два кореневі layout ((uk) і (ru)), і
 * файлова картинка чіпляється лише до кореня своєї групи, а не до
 * вкладених сторінок. Свій маршрут працює однаково для всіх адрес.
 *
 * Коли з'явиться фірмове зображення від дизайнера, цей файл замінюється
 * на статичний PNG у public/, а pageMeta починає посилатися на нього.
 */
export function renderOgImage(locale: Locale = 'uk') {
  const t = COPY[locale];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F2E8D8',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0E7A4B',
              color: '#F2E8D8',
              fontSize: 34,
              fontWeight: 700,
              borderRadius: 14,
            }}
          >
            SP
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#1A1D1A' }}>SmartEcoPack</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 62, fontWeight: 700, color: '#1A1D1A', lineHeight: 1.12 }}>
            {t.title}
          </div>
          <div style={{ fontSize: 30, color: '#5F6660', lineHeight: 1.35 }}>{t.subtitle}</div>
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 26, color: '#0E7A4B', fontWeight: 600 }}>
          <div>smartecopack.com</div>
          <div style={{ color: '#C8721B' }}>{t.badge}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
