<?php

use App\Http\Controllers\Api\CartProductsController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Support\Facades\Route;

/*
| Публічний API сайту.
|
| Маршрути поза мовними деревами — мова передається параметром. Через це
| middleware CanonicalUrl їх не чіпає: ні мовного префікса, ні
| завершального слеша тут не потрібно.
|
| Обмеження частоти стоїть і в nginx (див. deploy/nginx.conf), і тут:
| перший рубіж відсікає навалу ще до PHP, другий лишається чинним, навіть
| якщо застосунок колись опиниться за іншим проксі.
*/

Route::middleware('throttle:120,1')->group(function (): void {
    Route::get('/search', SearchController::class);
    Route::get('/cart-products', CartProductsController::class);
});

/*
| Приймання заявок — найдорожчий публічний ендпоінт: пише в базу й смикає
| Telegram та пошту. Ліміт тут значно жорсткіший: справжня людина надсилає
| форму раз на кілька хвилин, а без обмеження цим можна засипати менеджера
| й підставити поштовий домен під блоклист.
*/
Route::middleware('throttle:10,1')->post('/lead', LeadController::class);
