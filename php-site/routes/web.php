<?php

use Illuminate\Support\Facades\Route;

/*
| Маршрути сайту.
|
| Дві мовні гілки: українська в корені, російська під /ru. Мову ставить
| middleware CanonicalUrl за префіксом, тому контролери про неї не знають
| і однакові для обох дерев.
*/

$pages = function (): void {
    // Тимчасова сторінка для перевірки каркаса — замінюється на етапі 4
    Route::get('/', fn () => view('pages.home'))->name('home');
    Route::get('/catalog/{slug}', fn (string $slug) => view('pages.home'))->name('catalog.show');
};

Route::group([], $pages);
Route::prefix('ru')->group($pages);
