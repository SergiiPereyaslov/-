<?php

use App\Http\Middleware\CanonicalUrl;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * CanonicalUrl іде перед усім: він вирішує долю адреси (301 зі
         * старого URL, завершальний слеш, мовний префікс) ще до того, як
         * маршрутизатор почне щось шукати. Якби він стояв у групі web,
         * запит спершу отримав би 404 на невідомий старий URL.
         */
        $middleware->prepend(CanonicalUrl::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
