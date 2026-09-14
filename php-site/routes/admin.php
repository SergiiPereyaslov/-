<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImportController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\LoginController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\ProductController;
use Illuminate\Support\Facades\Route;

/*
| Адмінка.
|
| Живе поза мовними деревами: панеллю користується команда компанії, і
| другий переклад тут нічого не дав би, крім розсинхрону.
|
| Перевірка прав стоїть на групі маршрутів, а не в кожному контролері.
| У Next-версії вона була в layout, і аудит справедливо зауважив, що для
| серверних дій цього замало — там кожна дія перевіряла сесію сама.
| У Laravel middleware групи виконується для будь-якого запиту в ній,
| включно з POST, тож одного місця досить.
*/

Route::prefix('admin')->group(function (): void {
    Route::middleware('guest')->group(function (): void {
        Route::get('/', [LoginController::class, 'show']);
        // Вхід обмежений частотою: п'ять спроб за хвилину з одного IP
        Route::post('/', [LoginController::class, 'store'])->middleware('throttle:5,1');
    });

    Route::middleware('auth')->group(function (): void {
        Route::post('/logout', [LoginController::class, 'destroy']);

        Route::get('/dashboard', DashboardController::class);

        Route::get('/leads', [LeadController::class, 'index']);
        Route::get('/leads/{id}', [LeadController::class, 'show']);
        Route::put('/leads/{id}', [LeadController::class, 'update']);

        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{slug}', [ProductController::class, 'edit']);
        Route::put('/products/{slug}', [ProductController::class, 'update']);
        Route::put('/products/{slug}/quick', [ProductController::class, 'quickUpdate']);

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/{slug}', [CategoryController::class, 'edit']);
        Route::put('/categories/{slug}', [CategoryController::class, 'update']);

        Route::get('/posts', [PostController::class, 'index']);
        Route::get('/posts/new', [PostController::class, 'create']);
        Route::post('/posts', [PostController::class, 'store']);
        Route::get('/posts/{slug}', [PostController::class, 'edit']);
        Route::put('/posts/{slug}', [PostController::class, 'update']);
        Route::delete('/posts/{slug}', [PostController::class, 'destroy']);

        Route::get('/import', [ImportController::class, 'show']);
        Route::post('/import', [ImportController::class, 'store']);

        Route::get('/ab', DashboardController::class);
    });
});
