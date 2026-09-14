<?php

use App\Http\Controllers\CatalogController;
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
    Route::get('/', fn () => view('pages.home'));

    Route::get('/catalog', [CatalogController::class, 'index']);
    Route::get('/catalog/{slug}', [CatalogController::class, 'show']);
    Route::get('/catalog/{slug}/{facet}', [CatalogController::class, 'facet']);

    Route::get('/product/{slug}', [ProductController::class, 'show']);

    Route::get('/koshyk', fn () => view('pages.cart'));
    Route::get('/oformlennya', fn () => view('pages.checkout'));

    /*
     * Номер заявки приходить параметром і показується відвідувачу.
     * Обрізаємо його за форматом номера, а не довіряємо як є: інакше
     * в адресу можна було б покласти довільний текст і показати його
     * на нашій сторінці як «номер заявки».
     */
    Route::get('/dyakuyemo', fn (Request $request) => view('pages.thanks', [
        'number' => preg_match('/^SEP-[A-Z0-9]{6,8}$/', (string) $request->query('n'))
            ? $request->query('n')
            : null,
    ]));
};

Route::group([], $pages);
Route::prefix('ru')->group($pages);
