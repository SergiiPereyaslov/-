<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Каст для колонки типу text[] у PostgreSQL.
 *
 * Потрібен, бо Eloquent такий тип не знає: драйвер віддає його як рядок
 * у вигляді {a,b,c}, і без касту в коді опинявся б саме рядок, а не масив.
 * Використовується для posts.related — слагів категорій для перелінковки.
 *
 * Формат масивів PostgreSQL: елементи через кому у фігурних дужках, а ті,
 * що містять кому, лапки чи пробіл, беруться в подвійні лапки з
 * екрануванням зворотним слешем.
 *
 * @implements CastsAttributes<list<string>, list<string>>
 */
class PostgresTextArray implements CastsAttributes
{
    /** @return list<string> */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null || $value === '' || $value === '{}') {
            return [];
        }

        if (is_array($value)) {
            return array_values($value);
        }

        $inner = substr((string) $value, 1, -1);

        preg_match_all('/"((?:[^"\\\\]|\\\\.)*)"|([^,]+)/', $inner, $matches, PREG_SET_ORDER);

        $out = [];
        foreach ($matches as $m) {
            $out[] = isset($m[2]) && $m[2] !== ''
                ? $m[2]
                : stripslashes($m[1]);
        }

        return $out;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $items = is_array($value) ? $value : [];

        $escaped = array_map(
            fn (string $item): string => '"'.addcslashes($item, '"\\').'"',
            array_map('strval', $items),
        );

        return '{'.implode(',', $escaped).'}';
    }
}
