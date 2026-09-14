<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Group;
use App\Models\Product;
use Illuminate\Contracts\View\View;

/**
 * Посадкові сторінки: міста доставки та сегменти «для кого».
 *
 * Другий і третій входи в каталог. Кав'ярня шукає не «стакани паперові»,
 * а «що потрібно для кав'ярні»; замовник із Харкова — не «упаковку», а
 * «упаковку з доставкою в Харків». Ці сторінки відповідають саме на такі
 * запитання, а вже звідти ведуть у каталог.
 */
class LandingController extends Controller
{
    /**
     * Місто доставки.
     *
     * Невідомий слаг дає 404, а не падіння. У Next-версії саме тут аудит
     * знайшов 500: місто діставали з мапи без перевірки, і сторінка
     * валилась на першому ж зверненні до відмінка назви.
     */
    public function city(string $slug): View
    {
        $city = $this->find(config('cities'), $slug) ?? abort(404);

        return view('pages.landing.city', [
            'city' => $city,
            'groups' => Group::orderBy('sortOrder')->get(),
            'minPrices' => $this->minPriceByGroup(),
        ]);
    }

    /** Сегмент «для кого» зі стартовим комплектом. */
    public function sector(string $slug): View
    {
        $sector = $this->find(config('sectors'), $slug) ?? abort(404);

        $categories = Category::query()
            ->whereIn('slug', array_column($sector['kit'], 'category'))
            ->get()
            ->keyBy('slug');

        return view('pages.landing.sector', [
            'sector' => $sector,
            'categories' => $categories,
            'counts' => $this->countsByCategory($categories->keys()->all()),
        ]);
    }

    /**
     * @param  list<array{slug: string}>  $items
     * @return array<string, mixed>|null
     */
    private function find(array $items, string $slug): ?array
    {
        foreach ($items as $item) {
            if ($item['slug'] === $slug) {
                return $item;
            }
        }

        return null;
    }

    /** @return array<string, float> */
    private function minPriceByGroup(): array
    {
        return Product::query()
            ->join('categories', 'products.categorySlug', '=', 'categories.slug')
            ->selectRaw('categories."groupSlug" as g, min(products."priceRetail") as min_price')
            ->groupBy('g')
            ->pluck('min_price', 'g')
            ->map(fn ($v): float => (float) $v)
            ->all();
    }

    /**
     * @param  list<string>  $slugs
     * @return array<string, int>
     */
    private function countsByCategory(array $slugs): array
    {
        return Product::query()
            ->whereIn('categorySlug', $slugs)
            ->selectRaw('"categorySlug", count(*) as n')
            ->groupBy('categorySlug')
            ->pluck('n', 'categorySlug')
            ->map(fn ($v): int => (int) $v)
            ->all();
    }
}
