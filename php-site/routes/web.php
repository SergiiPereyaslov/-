<?php

use Illuminate\Support\Facades\Route;

// Тимчасовий маршрут для перевірки нормалізації адрес — замінюється на етапі 4
Route::get('/', fn () => response('корінь: '.app()->getLocale()));
Route::get('/ru', fn () => response('корінь: '.app()->getLocale()));
Route::get('/catalog/{slug}', fn (string $slug) => response("категорія {$slug}: ".app()->getLocale()));
Route::get('/ru/catalog/{slug}', fn (string $slug) => response("категорія {$slug}: ".app()->getLocale()));
