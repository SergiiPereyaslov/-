<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogCache;
use App\Services\ProductImporter;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Завантаження каталогу файлом CSV.
 *
 * Якщо у файлі є хоч одна помилка, не пишеться нічого: половина
 * імпортованого каталогу гірша за жодного — на сайті з'явилась би
 * частина товарів за новими цінами й частина за старими, і зрозуміти,
 * де межа, було б неможливо.
 */
class ImportController extends Controller
{
    /**
     * Обмеження розміру файлу.
     *
     * Узгоджене з client_max_body_size у nginx і post_max_size у PHP —
     * три рубежі мають збігатись, інакше відвідувач упирався б у той,
     * про який ніде не написано.
     */
    private const MAX_KILOBYTES = 5120;

    public function __construct(
        private readonly ProductImporter $importer,
        private readonly CatalogCache $cache,
    ) {}

    public function show(): View
    {
        return view('admin.import', ['result' => session('import')]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimetypes:text/plain,text/csv,application/csv', 'max:'.self::MAX_KILOBYTES],
        ], [], ['file' => 'файл']);

        $csv = (string) file_get_contents($request->file('file')->getRealPath());

        $known = Category::query()->pluck('slug')->all();
        $result = $this->importer->parse($csv, $known);

        if ($result['errors'] !== []) {
            return back()->with('import', [
                'status' => 'error',
                'message' => 'Імпорт не виконано: знайдено '.count($result['errors']).' помилок. Нічого не змінено.',
                'errors' => array_slice($result['errors'], 0, 60),
            ]);
        }

        // Одна транзакція: або весь каталог оновився, або жодного рядка
        DB::transaction(function () use ($result): void {
            foreach ($result['products'] as $i => $product) {
                Product::updateOrCreate(
                    ['slug' => $product['slug']],
                    $product + ['sortOrder' => $i],
                );
            }
        });

        $this->cache->flush();

        return back()->with('import', [
            'status' => 'ok',
            'message' => 'Імпортовано позицій: '.count($result['products']),
            'warnings' => $result['warnings'],
        ]);
    }
}
