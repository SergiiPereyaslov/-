'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';
import {
  getConsent,
  getServerConsent,
  hasConsent,
  setConsent,
  subscribeConsent,
} from '@/lib/analytics';

/**
 * GA4 + банер згоди.
 *
 * Скрипт аналітики не вантажиться, доки користувач не погодився: це і
 * вимога до обробки персональних даних, і мінус ~50 КБ на першому візиті.
 * Якщо NEXT_PUBLIC_GA_ID не задано, компонент не рендерить нічого —
 * на локальній розробці й у клієнта до налаштування лічильника він мовчить.
 */
export function Analytics({ gaId }: { gaId?: string }) {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);

  if (!gaId) return null;

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {consent === 'unknown' && (
        <div
          role="dialog"
          aria-label="Згода на аналітику"
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-surface p-4 shadow-lg md:inset-x-auto md:bottom-4 md:left-4 md:max-w-md md:rounded-lg md:border"
        >
          <p className="text-sm leading-relaxed">
            Ми використовуємо аналітику, щоб бачити, які сторінки корисні відвідувачам.
            Без вашої згоди жодні скрипти статистики не завантажуються.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary !min-h-9 flex-1" onClick={() => setConsent('granted')}>
              Погоджуюсь
            </button>
            <button type="button" className="btn btn-secondary !min-h-9 flex-1" onClick={() => setConsent('denied')}>
              Відмовитись
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export { hasConsent };
