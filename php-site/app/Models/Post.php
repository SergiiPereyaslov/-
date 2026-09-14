<?php

namespace App\Models;

use App\Casts\PostgresTextArray;
use App\Models\Concerns\HasBilingualFields;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

/**
 * Стаття блогу.
 *
 * @property string $slug
 * @property list<string> $related
 * @property array<int, array{uk: string, ru: string}> $body
 */
class Post extends Model
{
    use HasBilingualFields;

    protected $table = 'posts';

    protected $primaryKey = 'slug';

    public $incrementing = false;

    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'slug', 'publishedAt', 'titleUk', 'titleRu',
        'excerptUk', 'excerptRu', 'body', 'related', 'published',
    ];

    protected function casts(): array
    {
        return [
            'publishedAt' => 'datetime',
            'body' => 'array',
            // text[] у PostgreSQL, а не jsonb — Eloquent такий тип не знає
            'related' => PostgresTextArray::class,
            'published' => 'boolean',
        ];
    }

    /**
     * Опубліковані статті з датою, що вже настала.
     *
     * Дата в майбутньому — це відкладена публікація: стаття вже написана
     * в адмінці, але на сайті має з'явитись у свій день.
     */
    #[Scope]
    protected function live(Builder $query): Builder
    {
        return $query->where('published', true)->where('publishedAt', '<=', now());
    }

    #[Scope]
    protected function newestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('publishedAt');
    }

    /** Статті, перелінковані з конкретною категорією каталогу. */
    #[Scope]
    protected function relatedToCategory(Builder $query, string $categorySlug): Builder
    {
        return $query->whereRaw('? = ANY(related)', [$categorySlug]);
    }

    protected function title(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('title'));
    }

    protected function excerpt(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('excerpt'));
    }

    /**
     * Абзаци статті поточною мовою. Рядок, що починається з «## »,
     * у шаблоні стає підзаголовком — так редактор ставить структуру,
     * не маючи справи з розміткою.
     *
     * @return list<string>
     */
    protected function paragraphs(): Attribute
    {
        return Attribute::get(fn (): array => array_values(array_filter(
            array_map(fn (array $p): string => $this->pickLang($p), $this->body ?? []),
        )));
    }
}
