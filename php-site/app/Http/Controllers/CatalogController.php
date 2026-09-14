<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Group;
use App\Models\Post;
use App\Models\Product;
use App\Support\CatalogPhotos;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Collection;

/**
 * Каталог: список, група, категорія і фасетна посадкова.
 *
 * Один слаг у /catalog/{slug}/ може означати і групу, і категорію — так
 * склалось історично, і міняти адреси не можна: вони вже в індексі.
 * Тому show() спершу розв'язує, що саме за слагом, і лише потім вибирає
 * шаблон.
 */
class CatalogController extends Controller
{
    /** Список усіх груп із картками категорій. */
    public function index(): View
    {
        $groups = Group::with(['categories' => fn ($q) => $q->orderBy('sortOrder')])
            ->orderBy('sortOrder')
            ->get();

        return view('pages.catalog.index', [
            'groups' => $groups,
            'counts' => $this->categoryCounts(),
            'categoryCount' => $groups->sum(fn (Group $g) => $g->categories->count()),
            // Кількість беремо з даних, а не з тексту: інакше при кожній
            // зміні каталогу число в описі мовчки застаріває
            'productCount' => Product::count(),
        ]);
    }

    /** Група або категорія — залежно від того, чий це слаг. */
    public function show(string $slug): View
    {
        if ($group = Group::with(['categories' => fn ($q) => $q->orderBy('sortOrder')])->find($slug)) {
            return $this->group($group);
        }

        $category = Category::with('group')->findOr($slug, fn () => abort(404));

        return $this->category($category);
    }

    /**
     * Посадкова під одне значення фасета: /catalog/stakany-paperovi/340-ml/.
     *
     * Невідомий фасет має дати 404, а не порожній список товарів: інакше
     * пошукова система набирала б сотні порожніх сторінок, кожна з яких
     * віддає 200.
     */
    public function facet(string $slug, string $facetSlug): View
    {
        $category = Category::with('group')->findOr($slug, fn () => abort(404));

        $facet = $category->findIndexedFacet($facetSlug) ?? abort(404);

        $products = Product::inCategory($category->slug)
            ->withFacet($facet['facet'], $facet['value'])
            ->ordered()
            ->get();

        return view('pages.catalog.facet', [
            'category' => $category,
            'facet' => $facet,
            'products' => $products,
        ]);
    }

    private function group(Group $group): View
    {
        $slugs = $group->categories->pluck('slug');

        return view('pages.catalog.group', [
            'group' => $group,
            'counts' => $this->categoryCounts(),
            // Вісім популярних позицій групи — щоб сторінка не була
            // самим лише переліком посилань на категорії
            'topProducts' => Product::query()
                ->whereIn('categorySlug', $slugs)
                ->ordered()
                ->limit(8)
                ->get(),
        ]);
    }

    private function category(Category $category): View
    {
        $products = Product::inCategory($category->slug)->ordered()->get();

        return view('pages.catalog.category', [
            'category' => $category,
            'products' => $products,
            'photos' => CatalogPhotos::for($category->slug),
            /*
             * Зворотна перелінковка. Статті вже вели в категорії через
             * поле related, але назад посилань не було — граф виходив
             * односпрямованим, і вага з каталогу в блог не переходила.
             * Тут той самий зв'язок читається у зворотний бік, без
             * окремого поля в даних.
             */
            'articles' => Post::live()->relatedToCategory($category->slug)->newestFirst()->limit(3)->get(),
        ]);
    }

    /**
     * Кількість позицій і мінімальна ціна по кожній категорії.
     *
     * Одним запитом на всі категорії, а не запитом на картку: інакше
     * сторінка каталогу з 32 категоріями робила б 32 запити.
     *
     * @return array<string, array{count: int, min: float}>
     */
    private function categoryCounts(): array
    {
        return Product::query()
            ->selectRaw('"categorySlug", count(*) as n, min("priceRetail") as min_price')
            ->groupBy('categorySlug')
            ->get()
            ->keyBy('categorySlug')
            ->map(fn ($row): array => [
                'count' => (int) $row->n,
                'min' => (float) $row->min_price,
            ])
            ->all();
    }

    /**
     * Мінімальна ціна за пачку в наборі товарів.
     *
     * @param  Collection<int, Product>  $products
     */
    public static function priceFrom(Collection $products): float
    {
        return $products->min(fn (Product $p) => (float) $p->priceRetail) ?? 0.0;
    }
}
