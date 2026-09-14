<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Collection;

class ProductController extends Controller
{
    public function show(string $slug): View
    {
        $product = Product::with('category.group')->findOr($slug, fn () => abort(404));

        return view('pages.product.show', [
            'product' => $product,
            'category' => $product->category,
            'group' => $product->category?->group,
            'compatible' => $this->compatible($product),
            'related' => Product::inCategory($product->categorySlug)
                ->where('slug', '!=', $product->slug)
                ->ordered()
                ->limit(4)
                ->get(),
        ]);
    }

    /**
     * Крос-продаж за таблицею сумісності стакан ↔ кришка.
     *
     * Діаметр вінця — єдине, що справді вирішує, чи сяде кришка на стакан,
     * тому підбір іде саме по ньому, а не за назвою чи об'ємом: стакани
     * різного об'єму часто мають однаковий вінець.
     *
     * @return Collection<int, Product>
     */
    private function compatible(Product $product): Collection
    {
        $opposite = match ($product->shape) {
            'lid' => 'cup',
            'cup' => 'lid',
            default => null,
        };

        if ($product->lidDiameter === null || $opposite === null) {
            return new Collection;
        }

        return Product::query()
            ->where('lidDiameter', $product->lidDiameter)
            ->where('shape', $opposite)
            ->orderBy('sortOrder')
            ->limit(4)
            ->get();
    }
}
