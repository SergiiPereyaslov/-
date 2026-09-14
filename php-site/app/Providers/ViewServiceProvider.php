<?php

namespace App\Providers;

use App\View\Composers\NavigationComposer;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class ViewServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        /*
         * Композер вішається на справжніх споживачів, а не на layout:
         * дані layout'а не потрапляють у дочірній шаблон, бо секції
         * рендеряться раніше за нього і мають власну область видимості.
         *
         * Двох запитів це не додає — результат кешується, тож другий
         * виклик уже бере готове.
         */
        View::composer(
            ['layouts.site', 'partials.header', 'partials.footer'],
            NavigationComposer::class,
        );
    }
}
