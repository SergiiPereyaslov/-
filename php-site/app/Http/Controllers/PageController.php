<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Group;
use App\Models\Post;
use App\Models\Product;
use App\Support\Schema;
use Illuminate\Contracts\View\View;

/**
 * Контентні сторінки: головна, брендування, доставка, про нас, контакти
 * та юридичні тексти.
 *
 * Тексти живуть у lang/{uk,ru}/pages.php, а не в шаблонах: так обидві
 * мови лежать поруч і видно, коли переклад відстав від оригіналу.
 */
class PageController extends Controller
{
    public function home(): View
    {
        return view('pages.home', [
            'groups' => Group::orderBy('sortOrder')->get(),
            'hits' => Product::query()->where('featured', true)->ordered()->limit(8)->get(),
            'localBusiness' => Schema::localBusiness(),
        ]);
    }

    public function branding(): View
    {
        $faq = array_map(
            fn (array $pair): array => ['q' => $pair[0], 'a' => $pair[1]],
            __('pages.branding.faq'),
        );

        return view('pages.branding', ['t' => __('pages.branding.copy'), 'faq' => $faq]);
    }

    /**
     * Підсторінки брендування: друк на стаканах і на пакетах.
     *
     * Окремі сторінки, а не якорі на спільній: під «друк на стаканчиках»
     * і «друк на крафт-пакетах» у пошуку різні запити й різна конкуренція.
     */
    public function brandingPage(string $slug): View
    {
        $pages = __('pages.brandingPages.pages');

        abort_unless(isset($pages[$slug]), 404);

        return view('pages.branding-page', ['slug' => $slug, 'page' => $pages[$slug]]);
    }

    public function delivery(): View
    {
        $faq = array_map(
            fn (array $pair): array => ['q' => $pair[0], 'a' => $pair[1]],
            __('pages.delivery.faq'),
        );

        return view('pages.delivery', ['t' => __('pages.delivery.copy'), 'faq' => $faq]);
    }

    public function about(): View
    {
        return view('pages.about', ['t' => __('pages.about.copy')]);
    }

    public function contacts(): View
    {
        return view('pages.contacts', ['localBusiness' => Schema::localBusiness()]);
    }

    public function legal(string $page): View
    {
        return view('pages.legal', [
            'page' => $page,
            'blocks' => config("legal.{$page}.".app()->getLocale(), []),
            'title' => __("pages.{$page}.meta.title"),
        ]);
    }

    /** Блог: список статей. */
    public function blog(): View
    {
        return view('pages.blog.index', [
            'posts' => Post::live()->newestFirst()->get(),
        ]);
    }

    public function post(string $slug): View
    {
        $post = Post::live()->where('slug', $slug)->firstOr(fn () => abort(404));

        return view('pages.blog.show', [
            'post' => $post,
            // Категорії, на які посилається стаття — зв'язок в обидва боки
            'related' => Category::query()->whereIn('slug', $post->related)->get(),
            'more' => Post::live()->where('slug', '!=', $slug)->newestFirst()->limit(3)->get(),
        ]);
    }
}
