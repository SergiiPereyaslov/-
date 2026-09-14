<?php

namespace App\Models;

use App\Models\Concerns\HasBilingualFields;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Категорія каталогу — 32 штуки, основна посадкова під пошуковий кластер.
 *
 * @property string $slug
 * @property string $groupSlug
 * @property array<int, array{uk: string, ru: string}> $seo
 * @property array<int, array{q: array, a: array}> $faq
 * @property array<int, array{key: string, label: array, values: array}> $facets
 */
class Category extends Model
{
    use HasBilingualFields;

    protected $table = 'categories';

    protected $primaryKey = 'slug';

    public $incrementing = false;

    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'slug', 'groupSlug', 'nameUk', 'nameRu', 'h1Uk', 'h1Ru',
        'introUk', 'introRu', 'seo', 'faq', 'facets', 'sortOrder',
    ];

    protected function casts(): array
    {
        return [
            'seo' => 'array',
            'faq' => 'array',
            'facets' => 'array',
            'sortOrder' => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'groupSlug', 'slug');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'categorySlug', 'slug');
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

    /** @return list<string> */
    protected function seoParagraphs(): Attribute
    {
        return Attribute::get(fn (): array => array_values(array_filter(
            array_map(fn (array $p): string => $this->pickLang($p), $this->seo ?? []),
        )));
    }

    /**
     * Часті питання поточною мовою: [['q' => …, 'a' => …], …].
     *
     * @return list<array{q: string, a: string}>
     */
    protected function faqPairs(): Attribute
    {
        return Attribute::get(fn (): array => array_values(array_map(
            fn (array $item): array => [
                'q' => $this->pickLang($item['q'] ?? null),
                'a' => $this->pickLang($item['a'] ?? null),
            ],
            $this->faq ?? [],
        )));
    }

    /**
     * Значення фасетів, які мають власні URL виду /catalog/{slug}/{facet}/.
     *
     * Прапорець indexed стоїть на самому фасеті, а не на окремому значенні:
     * або весь фасет породжує посадкові, або жодне його значення. Не кожен
     * фасет цього заслуговує — під «об'єм» і «колір» попит у пошуку є,
     * а решта дала б сотні тонких дублів однієї сторінки.
     *
     * У URL іде slug значення (110-ml), а value — те, що лежить у
     * products.facets і за чим потім фільтруються товари.
     *
     * @return list<array{facet: string, slug: string, value: string, label: string}>
     */
    protected function indexedFacets(): Attribute
    {
        return Attribute::get(function (): array {
            $out = [];

            foreach ($this->facets ?? [] as $facet) {
                if (($facet['indexed'] ?? false) !== true) {
                    continue;
                }

                foreach ($facet['values'] ?? [] as $value) {
                    $out[] = [
                        'facet' => (string) ($facet['key'] ?? ''),
                        'slug' => (string) ($value['slug'] ?? ''),
                        'value' => (string) ($value['value'] ?? ''),
                        'label' => $this->pickLang($value['label'] ?? null),
                    ];
                }
            }

            return $out;
        });
    }

    /**
     * Знайти значення фасета за слагом з URL. null — слага немає в цій
     * категорії, і сторінка має віддати 404, а не порожній список товарів.
     *
     * @return array{facet: string, slug: string, value: string, label: string}|null
     */
    public function findIndexedFacet(string $slug): ?array
    {
        foreach ($this->indexed_facets as $item) {
            if ($item['slug'] === $slug) {
                return $item;
            }
        }

        return null;
    }
}
