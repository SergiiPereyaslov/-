'use client';

import { useState } from 'react';
import { TITLE_LIMIT, DESCRIPTION_MIN, DESCRIPTION_MAX } from '@/lib/meta-text';

/**
 * Поле з лічильником довжини під ліміти пошукової видачі.
 *
 * Потрібне тому, що ліміт не видно, поки сторінка не потрапить у видачу.
 * На старому сайті 324 з 445 заголовків були довші за 60 символів — не через
 * недбалість, а тому що ніде не було видно, коли саме ти вийшов за межу.
 *
 * Обмеження м'яке: зберегти можна завжди, але буде видно наслідок.
 */
export function MetaCounter({
  name,
  label,
  defaultValue,
  kind,
  max: maxOverride,
  required,
  multiline,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue: string;
  kind: 'title' | 'description';
  /** Жорсткіший ліміт, коли до значення ще дописується хвіст шаблону. */
  max?: number;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const n = value.length;

  const isTitle = kind === 'title';
  const max = maxOverride ?? (isTitle ? TITLE_LIMIT : DESCRIPTION_MAX);
  const min = isTitle ? 0 : DESCRIPTION_MIN;

  const over = n > max;
  const under = !isTitle && n > 0 && n < min;

  const hint = over
    ? isTitle
      ? `На ${n - max} довше за ліміт — у видачі хвіст обріжеться`
      : `На ${n - max} довше за ліміт — сніпет обріжеться`
    : under
      ? `Коротко: сніпет вміщає ${max}, місце лишиться порожнім`
      : '';

  const tone = over ? 'text-danger' : under ? 'text-muted' : 'text-primary';

  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-xs tnum ${tone}`}>
          {n}/{max}
        </span>
      </span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          required={required}
          className="field"
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          className="field"
        />
      )}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
