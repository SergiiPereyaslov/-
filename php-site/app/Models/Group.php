<?php

namespace App\Models;

use App\Models\Concerns\HasBilingualFields;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Верхній рівень каталогу: 6 груп, кожна — самостійна SEO-посадкова.
 *
 * Ключ — слаг, а не автоінкремент: він і так унікальний, стоїть в URL
 * і не змінюється, тож зайвий сурогатний id лише додав би джойнів.
 *
 * @property string $slug
 * @property array<int, array{uk: string, ru: string}> $seo
 */
class Group extends Model
{
    use HasBilingualFields;

    protected $table = 'groups';

    protected $primaryKey = 'slug';

    public $incrementing = false;

    protected $keyType = 'string';

    /** Колонки часу успадковані від Next-версії — camelCase, а не snake_case. */
    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'slug', 'nameUk', 'nameRu', 'h1Uk', 'h1Ru',
        'introUk', 'introRu', 'seo', 'sortOrder',
    ];

    protected function casts(): array
    {
        return [
            'seo' => 'array',
            'sortOrder' => 'integer',
        ];
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class, 'groupSlug', 'slug');
    }

    protected function name(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('name'));
    }

    protected function h1(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('h1'));
    }

    protected function intro(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('intro'));
    }

    /**
     * Абзаци SEO-тексту поточною мовою.
     *
     * @return list<string>
     */
    protected function seoParagraphs(): Attribute
    {
        return Attribute::get(fn (): array => array_values(array_filter(
            array_map(fn (array $p): string => $this->pickLang($p), $this->seo ?? []),
        )));
    }
}
