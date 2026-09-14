<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Дані товарів для кошика.
 *
 * У localStorage лежать тільки слаг і кількість пачок — ціни й назви
 * навмисно не зберігаються. Інакше прайс, покладений у браузер місяць
 * тому, показувався б відвідувачу як чинний, і в заявці приїхала б
 * неправильна сума. Актуальні дані завжди беруться звідси.
 */
class CartProductsController extends Controller
{
    /**
     * Скільки позицій максимум обробляти за раз.
     *
     * Кошик такого розміру ніхто не збирає руками; обмеження стоїть, щоб
     * підробленим запитом не можна було витягти весь каталог одним
     * викликом і навантажити базу.
     */
    private const MAX_SLUGS = 100;

    public function __invoke(Request $request): JsonResponse
    {
        $slugs = array_slice(
            array_values(array_filter(
                explode(',', (string) $request->query('slugs', '')),
                fn (string $slug): bool => $slug !== '' && preg_match('/^[a-z0-9-]+$/', $slug) === 1,
            )),
            0,
            self::MAX_SLUGS,
        );

        if ($slugs === []) {
            return response()->json([]);
        }

        $products = Product::query()->whereIn('slug', $slugs)->get();

        return response()->json($products->map(fn (Product $p): array => [
            'slug' => $p->slug,
            'sku' => $p->sku,
            'name' => $p->name,
            'spec' => $p->spec,
            'shape' => $p->shape,
            'unitsPerPack' => $p->unitsPerPack,
            'priceRetail' => (float) $p->priceRetail,
            'tiers' => array_map(fn (array $t): array => [
                'minPacks' => (int) $t['minPacks'],
                'perUnit' => (float) $t['perUnit'],
            ], $p->tiers ?? []),
        ])->all());
    }
}
