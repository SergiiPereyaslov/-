import type { FaqItem, Locale } from '@/data/types';
import { JsonLd } from './JsonLd';

/**
 * FAQ-акордеон на <details> — працює без JS і одразу дає
 * FAQPage-розмітку для розширеного сніпета у видачі.
 */
export function Faq({
  items,
  locale,
  title,
}: {
  items: FaqItem[];
  locale: Locale;
  title: string;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {items.map((f, i) => (
          <details key={i} className="group bg-surface">
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 font-medium marker:content-none">
              {f.q[locale]}
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2"
                className="mt-0.5 shrink-0 text-muted transition-transform group-open:rotate-45"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{f.a[locale]}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((f) => ({
            '@type': 'Question',
            name: f.q[locale],
            acceptedAnswer: { '@type': 'Answer', text: f.a[locale] },
          })),
        }}
      />
    </section>
  );
}
