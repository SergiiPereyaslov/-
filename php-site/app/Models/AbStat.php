<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Лічильники A/B-тесту навігації, агреговані по днях.
 *
 * Свідомо не зберігається жоден ідентифікатор відвідувача: для рішення
 * потрібні лише суми по варіанту й дню, а зайві персональні дані — це
 * зобов'язання, а не актив.
 *
 * @property string $variant
 * @property \Illuminate\Support\Carbon $day
 */
class AbStat extends Model
{
    protected $table = 'ab_stats';

    /** Таблиця без createdAt/updatedAt — це агрегат, а не подія. */
    public $timestamps = false;

    /** Метрики, які застосунок має право інкрементувати. */
    public const METRICS = ['sessions', 'catalog', 'cart', 'search', 'leads'];

    /** Варіанти навігації, що беруть участь у тесті. */
    public const VARIANTS = ['a', 'b'];

    protected $fillable = ['variant', 'day', 'sessions', 'catalog', 'cart', 'search', 'leads'];

    protected function casts(): array
    {
        return [
            'day' => 'date',
            'sessions' => 'integer',
            'catalog' => 'integer',
            'cart' => 'integer',
            'search' => 'integer',
            'leads' => 'integer',
        ];
    }
}
