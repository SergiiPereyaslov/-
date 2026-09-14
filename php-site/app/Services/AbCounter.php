<?php

namespace App\Services;

use App\Models\AbStat;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Лічильники A/B-тесту навігації.
 *
 * Зберігаються тільки суми по варіанту й дню — жодного ідентифікатора
 * відвідувача, IP чи user-agent. Для рішення потрібні саме агрегати, а
 * зайві персональні дані — це зобов'язання, а не актив.
 */
class AbCounter
{
    /**
     * Інкрементує метрику.
     *
     * Помилка лічильника ніколи не має ламати сторінку відвідувачу чи
     * втрачати заявку, тому виняток гаситься тут.
     */
    public function bump(string $variant, string $metric): void
    {
        if (! config('site.ab_enabled')
            || ! in_array($variant, AbStat::VARIANTS, true)
            || ! in_array($metric, AbStat::METRICS, true)) {
            return;
        }

        try {
            /*
             * Атомарний інкремент одним запитом: паралельні відвідувачі
             * інакше перезаписували б значення одне одного, читаючи його
             * перед оновленням.
             *
             * Назва метрики підставляється в SQL, але прийти може лише
             * одне з п'яти значень білого списку вище — довільний рядок
             * сюди не дійде.
             */
            DB::statement(
                'INSERT INTO ab_stats (variant, day, '.$metric.') VALUES (?, ?, 1)
                 ON CONFLICT (variant, day) DO UPDATE SET '.$metric.' = ab_stats.'.$metric.' + 1',
                [$variant, now()->toDateString()],
            );
        } catch (Throwable) {
            // Лічильник тесту не має права зламати сторінку відвідувачу.
        }
    }
}
