<?php

use App\Http\Middleware\CachePage;
use App\Http\Middleware\CanonicalUrl;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        then: function (): void {
            // Адмінка в окремому файлі: інакше маршрути сайту й панелі
            // перемішувались би в одному переліку на сотню рядків
            Route::middleware('web')
                ->group(base_path('routes/admin.php'));
        },
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

        /*
         * Маршрути не мають імен (route() зрізає завершальний слеш, тож
         * посилання будує App\Support\Url), тому стандартні редиректи
         * автентифікації задаємо адресами напряму — інакше middleware
         * шукав би неіснуючий маршрут із назвою login.
         */
        $middleware->redirectGuestsTo('/admin/');
        $middleware->redirectUsersTo('/admin/dashboard/');

        /*
         * Кеш сторінок — у групі web, після сесії: інакше він не бачив
         * би, що відвідувач авторизований, і міг би віддати анонімному
         * сторінку, зібрану для адміністратора.
         */
        $middleware->appendToGroup('web', CachePage::class);

        /*
         * Заголовки безпеки — глобально, а не в групі web: вони потрібні
         * і на API, і на карті сайту, і на всьому, що віддає застосунок.
         */
        $middleware->append(SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
