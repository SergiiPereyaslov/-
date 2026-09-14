<?php

use Illuminate\Support\Facades\Route;

/*
| Публічний API сайту: пошук, приймання заявок, лічильник A/B-тесту.
| Маршрути навмисно поза мовними деревами — мова передається параметром.
*/

Route::get('/ping', fn () => response()->json(['ok' => true]));
