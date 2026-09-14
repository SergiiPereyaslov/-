<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Заголовки безпеки.
 *
 * Ставляться застосунком, а не лише проксі. На бойовому сервері їх
 * дублює nginx, і це навмисне: юніт слухає тільки петлю, тож обійти
 * проксі зараз неможливо — але це властивість однієї конкретної
 * конфігурації. Щойно поруч з'явиться інший спосіб дістатись до порту
 * (контейнер із опублікованим портом, тимчасовий прев'ю-стенд),
 * заголовки поїдуть разом із застосунком, а не лишаться в чужому файлі.
 */
class SecurityHeaders
{
    /**
     * Розділи, які не кешуються й не індексуються.
     *
     * Адмінка — бо в ній видно заявки з телефонами. Кошик, оформлення
     * й подяка — бо вони особисті: спільний кеш віддав би одному
     * відвідувачу те, що зібрано для іншого.
     */
    private const PRIVATE_PREFIXES = ['/admin', '/koshyk/', '/oformlennya/', '/dyakuyemo/'];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        foreach ($this->headers() as $name => $value) {
            $response->headers->set($name, $value);
        }

        foreach ($this->privateHeaders($request) as $name => $value) {
            $response->headers->set($name, $value);
        }

        /*
         * Версія PHP у заголовку нікому не потрібна, крім того, хто
         * шукає хости зі старою версією під відому вразливість.
         * Прибирається саме так: заголовок додає сам PHP через
         * expose_php, тож у колекції Symfony його ще немає. На проді
         * дублюється expose_php = Off у php.ini — але якщо хтось
         * розгорне сайт із чужим ini, захист лишиться.
         */
        header_remove('X-Powered-By');

        return $response;
    }

    /**
     * Заголовки для сторінок, які не можна ні кешувати, ні індексувати.
     *
     * Ставляться застосунком навмисно. У nginx ці ж add_header у
     * location /admin/ не спрацьовують узагалі: try_files робить
     * внутрішній редирект у location ~ \.php$, і заголовки додає вже
     * вона, а не та локація, де їх написали. Перевірено curl'ом на
     * живому стенді — заголовків у відповіді не було.
     *
     * @return array<string, string>
     */
    private function privateHeaders(Request $request): array
    {
        $path = $request->getPathInfo();

        foreach (self::PRIVATE_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix) || str_starts_with($path, '/ru'.$prefix)) {
                return [
                    // no-store, а не no-cache: no-cache дозволяє зберегти
                    // копію й лише вимагає перевірки. У панелі видно
                    // телефони клієнтів — копії не має бути взагалі.
                    'Cache-Control' => 'no-store, max-age=0',
                    'X-Robots-Tag' => 'noindex, nofollow',
                ];
            }
        }

        return [];
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return [
            'Content-Security-Policy' => $this->csp(),

            // Браузер не має вгадувати тип: завантажений файл, який видає
            // себе за картинку, не виконається як скрипт
            'X-Content-Type-Options' => 'nosniff',

            // На чужий домен їде тільки походження, без шляху й параметрів
            'Referrer-Policy' => 'strict-origin-when-cross-origin',

            // Дубль frame-ancestors у CSP — для старих браузерів
            'X-Frame-Options' => 'SAMEORIGIN',

            // Сайту не потрібні ні камера, ні мікрофон, ні геолокація
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()',
        ];
    }

    /**
     * Content-Security-Policy.
     *
     * Що вона справді дає. 'unsafe-inline' для скриптів тут немає — і це
     * головна відмінність від Next-версії, де його довелось лишити: той
     * фреймворк вставляв у кожну сторінку власний інлайн-скрипт із
     * даними, вміст якого залежав від сторінки, тож хеші порахувати
     * наперед було неможливо. У Blade власних інлайн-скриптів рівно два
     * — тема й варіант навігації, — обидва сталі, і їхні хеші рахуються
     * з того самого рядка, що йде в сторінку. Через це <script> із
     * чужим вмістом не виконається, навіть якщо зловмисник примудриться
     * вставити його в розмітку. Саме цей клас атак тут і закривається.
     *
     * Чого вона НЕ дає: 'unsafe-eval' присутній. Alpine обчислює вирази
     * з атрибутів (x-show="open", @click="add()") через new Function() —
     * без цього дозволу браузер блокує кожен такий вираз, і сторінка
     * лишається без кошика, пошуку й меню. Перевірено: 420 порушень CSP
     * на семи сторінках, поки дозволу не було.
     *
     * Ціна конкретна: код, який уже виконується на сторінці, може
     * зібрати новий код рядком і запустити його. Тобто 'unsafe-eval'
     * послаблює другий рубіж — він нічого не додає зловмиснику, поки
     * той не спромігся виконати хоч щось; але якщо спромігся, то не
     * впирається в заборону eval. Перший рубіж (заборона самого
     * вставленого скрипта) лишається на місці.
     *
     * Як прибрати: збірка @alpinejs/csp не використовує new Function(),
     * але вимагає винести всі вирази з атрибутів у Alpine.data() —
     * тобто переписати розмітку всіх компонентів. Робота велика, але
     * механічна; поки не зроблена, чесніше написати це тут, ніж
     * вдавати, що політика строгіша, ніж є.
     */
    private function csp(): string
    {
        $ga = config('site.ga_id')
            ? [
                'script' => ' https://www.googletagmanager.com',
                'connect' => ' https://www.google-analytics.com https://*.google-analytics.com',
                'img' => ' https://www.google-analytics.com https://*.google-analytics.com',
            ]
            : ['script' => '', 'connect' => '', 'img' => ''];

        $hashes = implode(' ', array_map(
            fn (string $script): string => "'sha256-".base64_encode(hash('sha256', $script, true))."'",
            InlineScripts::all(),
        ));

        $policy = [
            "default-src 'self'",
            // 'unsafe-eval' — для обчислювача виразів Alpine; подробиці й
            // ціна цього дозволу описані вище
            "script-src 'self' 'unsafe-eval' {$hashes}{$ga['script']}",
            // Tailwind і шрифти підставляють інлайн-стилі; для стилів це
            // незрівнянно менший ризик, ніж для скриптів
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:{$ga['img']}",
            "font-src 'self' data:",
            "connect-src 'self'{$ga['connect']}",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "base-uri 'none'",
            "object-src 'none'",
        ];

        /*
         * Тільки на проді: у розробці сайт віддається по http://127.0.0.1,
         * і ця директива піднімала б кожен запит у https — усе падало б
         * із помилкою протоколу.
         */
        if (app()->isProduction()) {
            $policy[] = 'upgrade-insecure-requests';
        }

        return implode('; ', $policy);
    }
}
