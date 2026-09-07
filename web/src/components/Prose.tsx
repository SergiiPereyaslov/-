import type { L, Locale } from '@/data/types';

/**
 * Текстовий блок із простою розміткою: абзац, який починається з «## »,
 * стає підзаголовком. Такий формат обрано навмисно — редактор в адмінці
 * пише звичайним текстом, без HTML і без окремого редактора.
 */
export function Prose({
  blocks,
  locale,
  className = '',
}: {
  blocks: L[];
  locale: Locale;
  className?: string;
}) {
  if (!blocks.length) return null;

  return (
    <div className={`prose-uk ${className}`}>
      {blocks.map((block, i) => {
        const text = block[locale];
        return text.startsWith('## ') ? (
          <h2 key={i}>{text.slice(3)}</h2>
        ) : (
          <p key={i}>{text}</p>
        );
      })}
    </div>
  );
}
