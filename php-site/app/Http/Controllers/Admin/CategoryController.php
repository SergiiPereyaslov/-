<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CatalogCache;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(private readonly CatalogCache $cache) {}

    public function index(): View
    {
        return view('admin.categories.index', [
            'categories' => Category::with('group')->orderBy('sortOrder')->get(),
        ]);
    }

    public function edit(string $slug): View
    {
        return view('admin.categories.edit', [
            'category' => Category::findOr($slug, fn () => abort(404)),
        ]);
    }

    /**
     * Слаг не редагується навмисно: він стоїть в адресі сторінки, яка
     * вже в індексі пошуку. Зміна означала б утрату позицій і потребу в
     * новому 301 — це робота розробника, а не редактора.
     */
    public function update(Request $request, string $slug): RedirectResponse
    {
        $category = Category::findOr($slug, fn () => abort(404));

        $data = $request->validate([
            'nameUk' => ['required', 'string', 'max:200'],
            'nameRu' => ['required', 'string', 'max:200'],
            'h1Uk' => ['required', 'string', 'max:200'],
            'h1Ru' => ['required', 'string', 'max:200'],
            'introUk' => ['nullable', 'string', 'max:2000'],
            'introRu' => ['nullable', 'string', 'max:2000'],
            'seoUk' => ['nullable', 'string', 'max:20000'],
            'seoRu' => ['nullable', 'string', 'max:20000'],
            'faq' => ['nullable', 'string', 'max:20000'],
        ]);

        /*
         * Часті питання редагуються як JSON. Розбираємо його тут, щоб
         * помилка в дужці не поїхала в базу й не зламала сторінку
         * категорії — редактор побачить повідомлення одразу.
         */
        $faq = json_decode($data['faq'] ?? '[]', true);

        if (! is_array($faq)) {
            return back()->withInput()->withErrors([
                'faq' => 'Поле «Часті питання» містить некоректний JSON',
            ]);
        }

        $category->update([
            'nameUk' => $data['nameUk'],
            'nameRu' => $data['nameRu'],
            'h1Uk' => $data['h1Uk'],
            'h1Ru' => $data['h1Ru'],
            'introUk' => $data['introUk'] ?? '',
            'introRu' => $data['introRu'] ?? '',
            'seo' => $this->paragraphs($data['seoUk'] ?? '', $data['seoRu'] ?? ''),
            'faq' => $faq,
        ]);

        $this->cache->flush();

        return redirect("/admin/categories/{$category->slug}/")->with('status', __('admin.saved'));
    }

    /**
     * Абзаци SEO-тексту: порожній рядок розділяє, «## » на початку
     * робить підзаголовок. Формат обрано навмисно — редактор пише
     * звичайним текстом, без HTML і без окремого редактора.
     *
     * @return list<array{uk: string, ru: string}>
     */
    private function paragraphs(string $uk, string $ru): array
    {
        $split = fn (string $text): array => array_values(array_filter(
            array_map('trim', preg_split('/\n{2,}/', $text) ?: []),
        ));

        $a = $split($uk);
        $b = $split($ru);

        return array_map(
            // Якщо російський переклад коротший, беремо український:
            // порожній абзац гірший за текст іншою мовою
            fn (string $text, int $i): array => ['uk' => $text, 'ru' => $b[$i] ?? $text],
            $a,
            array_keys($a),
        );
    }
}
