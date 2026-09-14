<?php

namespace App\Models;

use App\Models\Concerns\HasBilingualFields;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Товар каталогу.
 *
 * @property string $slug
 * @property string $categorySlug
 * @property array<string, string> $facets
 * @property array<int, array{minPacks: int, perUnit: float}> $tiers
 * @property array<int, array{label: array, value: array}> $attributes_json
 */
class Product extends Model
{
    use HasBilingualFields;

    protected $table = 'products';

    protected $primaryKey = 'slug';

    public $incrementing = false;

    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'slug', 'sku', 'categorySlug', 'nameUk', 'nameRu', 'specUk', 'specRu',
        'descriptionUk', 'descriptionRu', 'attributes', 'facets', 'unitsPerPack',
        'priceRetail', 'tiers', 'inStock', 'brandable', 'featured', 'shape',
        'lidDiameter', 'image', 'searchText', 'sortOrder',
    ];

    protected function casts(): array
    {
        return [
            'attributes' => 'array',
            'facets' => 'array',
            'tiers' => 'array',
            'unitsPerPack' => 'integer',
            // Гроші як рядок із двома знаками, не float: копійки не мають
            // губитись на подвійному округленні при розрахунку кошика.
            'priceRetail' => 'decimal:2',
            'inStock' => 'boolean',
            'brandable' => 'boolean',
            'featured' => 'boolean',
            'lidDiameter' => 'integer',
            'sortOrder' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categorySlug', 'slug');
    }

    /** Порядок видачі, однаковий для всіх списків каталогу. */
    #[Scope]
    protected function ordered(Builder $query): Builder
    {
        return $query->orderByDesc('featured')->orderBy('sortOrder')->orderBy('slug');
    }

    /** Товари категорії. */
    #[Scope]
    protected function inCategory(Builder $query, string $categorySlug): Builder
    {
        return $query->where('categorySlug', $categorySlug);
    }

    /**
     * Фільтр за значенням фасета, наприклад volume=340.
     *
     * Порівняння йде по jsonb-ключу, а не по тексту всього поля: інакше
     * volume=34 збігся б із 340.
     */
    #[Scope]
    protected function withFacet(Builder $query, string $key, string $value): Builder
    {
        return $query->where("facets->{$key}", $value);
    }

    protected function name(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('name'));
    }

    protected function spec(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('spec'));
    }

    protected function description(): Attribute
    {
        return Attribute::get(fn (): string => $this->localized('description'));
    }

    /**
     * Характеристики поточною мовою.
     *
     * Ім'я attributes_json, бо attributes — службова властивість Eloquent,
     * і аксесор із такою назвою зламав би модель.
     *
     * @return list<array{label: string, value: string}>
     */
    protected function specs(): Attribute
    {
        return Attribute::get(fn (): array => array_values(array_map(
            fn (array $row): array => [
                'label' => $this->pickLang($row['label'] ?? null),
                'value' => $this->pickLang($row['value'] ?? null),
            ],
            $this->getAttribute('attributes') ?? [],
        )));
    }

    /**
     * Ціна за одиницю з урахуванням оптових щаблів.
     *
     * Щаблі впорядковані за зростанням minPacks, тож останній, який
     * перекрито кількістю пачок, і дає остаточну ціну.
     */
    public function unitPriceFor(int $packs): float
    {
        $price = (float) $this->priceRetail;

        foreach ($this->tiers ?? [] as $tier) {
            if ($packs >= (int) ($tier['minPacks'] ?? 0)) {
                $price = (float) ($tier['perUnit'] ?? $price);
            }
        }

        return $price;
    }

    /**
     * Наступний щабель, до якого ще не дотягнули. Показується в кошику
     * як підказка «додайте ще N пачок — і ціна впаде».
     *
     * @return array{minPacks: int, perUnit: float}|null
     */
    public function nextTier(int $packs): ?array
    {
        foreach ($this->tiers ?? [] as $tier) {
            if ($packs < (int) ($tier['minPacks'] ?? 0)) {
                return [
                    'minPacks' => (int) $tier['minPacks'],
                    'perUnit' => (float) $tier['perUnit'],
                ];
            }
        }

        return null;
    }
}
