<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /** Скільки підказок показувати. Більше не влізає в випадне меню. */
    private const LIMIT = 8;

    /** Коротші запити нічого не звужують і дали б пів каталогу. */
    private const MIN_LENGTH = 2;

    /**
     * Підказки пошуку по каталогу.
     *
     * Шукає по колонці searchText — нормалізованому в нижній регістр
     * рядку з назвами обома мовами, артикулом, розміром і значеннями
     * фасетів. Саме тому аудиторія знаходить товар і за «стакан 340», і
     * за артикулом, і російською в українській версії.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        // Довгі рядки відсікаємо до того, як вони дійдуть до LIKE: нічого
        // осмисленого вони не знайдуть, а сканування коштує так само.
        $query = mb_substr($query, 0, 100);

        if (mb_strlen($query) < self::MIN_LENGTH) {
            return response()->json([]);
        }

        $locale = in_array($request->query('locale'), config('site.locales'), true)
            ? $request->query('locale')
            : 'uk';

        $products = Product::query()
            ->where('searchText', 'like', '%'.mb_strtolower($query).'%')
            ->orderByDesc('featured')
            ->orderBy('sortOrder')
            ->limit(self::LIMIT)
            ->get();

        return response()->json($products->map(fn (Product $p): array => [
            'slug' => $p->slug,
            'name' => $p->{'name'.($locale === 'ru' ? 'Ru' : 'Uk')},
            'spec' => $p->{'spec'.($locale === 'ru' ? 'Ru' : 'Uk')},
            'sku' => $p->sku,
            'price' => number_format((float) $p->priceRetail, 2, '.', ''),
            'shape' => $p->shape,
        ])->all());
    }
}
