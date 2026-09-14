<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
| Маршрути сайту.
|
| Дві мовні гілки: українська в корені, російська під /ru. Мову ставить
| middleware CanonicalUrl за префіксом, тому контролери про неї не знають
| і однакові для обох дерев — звідси спільне замикання нижче.
|
| Імена маршрутів не використовуються для генерації посилань: route()
| зрізає завершальний слеш, а канонічна форма адрес цього сайту — саме
| зі слешем. Посилання будує App\Support\Url.
*/

$pages = function (): void {
    Route::get('/', [PageController::class, 'home']);

    /* ── Каталог ───────────────────────────────────────────────────── */
    Route::get('/catalog', [CatalogController::class, 'index']);
    Route::get('/catalog/{slug}', [CatalogController::class, 'show']);
    Route::get('/catalog/{slug}/{facet}', [CatalogController::class, 'facet']);
    Route::get('/product/{slug}', [ProductController::class, 'show']);

    /* ── Кошик і заявка ────────────────────────────────────────────── */
    Route::get('/koshyk', fn () => view('pages.cart'));
    Route::get('/oformlennya', fn () => view('pages.checkout'));

    /*
     * Номер заявки приходить параметром і показується відвідувачу.
     * Звіряємо його за форматом, а не довіряємо як є: інакше в адресу
     * можна було б покласти довільний текст і показати його на нашій
     * сторінці як «номер заявки».
     */
    Route::get('/dyakuyemo', fn (Request $request) => view('pages.thanks', [
        'number' => preg_match('/^SEP-[A-Z0-9]{6,8}$/', (string) $request->query('n'))
            ? $request->query('n')
            : null,
    ]));

    /* ── Контентні сторінки ────────────────────────────────────────── */
    Route::get('/brenduvannya', [PageController::class, 'branding']);
    Route::get('/brenduvannya/{slug}', [PageController::class, 'brandingPage']);
    Route::get('/dostavka-i-oplata', [PageController::class, 'delivery']);
    Route::get('/pro-nas', [PageController::class, 'about']);
    Route::get('/kontakty', [PageController::class, 'contacts']);

    Route::get('/polityka-konfidentsiynosti', fn () => app(PageController::class)->legal('polityka-konfidentsiynosti'));
    Route::get('/publichna-oferta', fn () => app(PageController::class)->legal('publichna-oferta'));

    /* ── Блог ──────────────────────────────────────────────────────── */
    Route::get('/blog', [PageController::class, 'blog']);
    // Перед /blog/{slug}, інакше rss.xml розібрався б як слаг статті
    Route::get('/blog/rss.xml', FeedController::class);
    Route::get('/blog/{slug}', [PageController::class, 'post']);

    /* ── Посадкові: міста й сегменти ───────────────────────────────── */
    Route::get('/upakovka/{slug}', [LandingController::class, 'city']);
    Route::get('/dlya/{slug}', [LandingController::class, 'sector']);
};

Route::group([], $pages);
Route::prefix('ru')->group($pages);
