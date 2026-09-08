'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AB_ENABLED } from '@/lib/ab';
import { abOnce } from '@/lib/analytics';

/**
 * Рахує дві базові метрики тесту: сесію та перехід у каталог.
 *
 * Обидві — один раз за сесію браузера (дедуплікація в abOnce), тому
 * знаменник конверсії не роздувається від перезавантажень сторінки.
 */
export function AbTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!AB_ENABLED) return;
    abOnce('sessions');
    if (pathname.includes('/catalog') || pathname.includes('/product/')) abOnce('catalog');
  }, [pathname]);

  return null;
}
