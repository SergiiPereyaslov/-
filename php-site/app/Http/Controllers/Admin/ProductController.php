<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogCache;
use App\Support\SearchText;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private readonly CatalogCache $cache) {}

    public function index(Request $request): View
    {
        $query = trim((string) $request->query('q', ''));

        return view('admin.products.index', [
            'products' => Product::query()
                ->when($query !== '', fn ($q) => $q->where('searchText', 'like', '%'.mb_strtolower($query).'%'))
                ->ordered()
                ->paginate(config('admin.per_page'))
                ->withQueryString(),
            'q' => $query,
        ]);
    }

    public function edit(string $slug): View
    {
        return view('admin.products.edit', [
            'product' => Product::findOr($slug, fn () => abort(404)),
            'categories' => Category::orderBy('sortOrder')->get(),
        ]);
    }

    /**
     * Швидка правка просто зі списку: ціна, наявність, «хіт».
     *
     * Це те, що змінюється щодня, — заради цього не варто відкривати
     * повну картку товару.
     */
    public function quickUpdate(Request $request, string $slug): RedirectResponse
    {
        $product = Product::findOr($slug, fn () => abort(404));

        $data = $request->validate([
            'priceRetail' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'inStock' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
        ]);

        $product->update([
            'priceRetail' => $data['priceRetail'],
            'inStock' => $request->boolean('inStock'),
            'featured' => $request->boolean('featured'),
        ]);

        $this->cache->flush();

        return back()->with('status', __('admin.saved'));
    }

    public function update(Request $request, string $slug): RedirectResponse
    {
        $product = Product::findOr($slug, fn () => abort(404));

        $data = $request->validate([
            'categorySlug' => ['required', 'string', 'exists:categories,slug'],
            'nameUk' => ['required', 'string', 'max:200'],
            'nameRu' => ['required', 'string', 'max:200'],
            'specUk' => ['nullable', 'string', 'max:200'],
            'specRu' => ['nullable', 'string', 'max:200'],
            'descriptionUk' => ['nullable', 'string', 'max:8000'],
            'descriptionRu' => ['nullable', 'string', 'max:8000'],
            'unitsPerPack' => ['required', 'integer', 'min:1', 'max:100000'],
            'priceRetail' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'shape' => ['required', 'string', 'in:cup,lid,sleeve,holder,straw,box,round,bag,flat'],
            'lidDiameter' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'sortOrder' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);

        $product->fill($data);
        $product->inStock = $request->boolean('inStock');
        $product->brandable = $request->boolean('brandable');
        $product->featured = $request->boolean('featured');

        // Рядок пошуку перезбирається при кожному збереженні: інакше
        // перейменований товар перестав би знаходитись за новою назвою
        $product->searchText = SearchText::for($product);

        $product->save();

        $this->cache->flush();

        return redirect("/admin/products/{$product->slug}/")->with('status', __('admin.saved'));
    }
}
