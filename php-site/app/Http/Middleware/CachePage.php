<?php

namespace App\Http\Middleware;

use App\Services\CatalogCache;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response as BaseResponse;

/**
 * Кеш готових сторінок.
 *
 * Це заміна тому, що в Next-версії робила статична генерація: там 258
 * сторінок збирались на збірці й лежали файлами, тут вони збираються
 * один раз на запит і лягають у кеш. Результат для відвідувача той
 * самий — сторінка віддається без звернення до бази, — але зміна ціни
 * в адмінці не вимагає перезбірки всього сайту.
 *
 * Кешується тільки те, що однакове для всіх: анонімний GET, який
 * повернув 200. Сторінки з кошиком і оформленням не кешуються взагалі —
 * вони й так порожні до виконання скриптів, а кеш зробив би їх ще й
 * спільними.
 */
class CachePage
{
    /** Доба: інвалідація явна, тож строк потрібен лише як запобіжник. */
    private const TTL_SECONDS = 86400;

    /**
     * Розділи, які не кешуються ніколи.
     *
     * Адмінка — бо в ній видно дані, що залежать від користувача.
     * Кошик і оформлення — бо вони особисті. API — бо там свої правила
     * й свої заголовки.
     */
    private const NEVER = ['/admin', '/api', '/koshyk/', '/oformlennya/', '/dyakuyemo/'];

    public function __construct(private readonly CatalogCache $catalog) {}

    public function handle(Request $request, Closure $next): BaseResponse
    {
        if (! $this->isCacheable($request)) {
            return $next($request);
        }

        $key = $this->key($request);
        $cached = Cache::get($key);

        if (is_array($cached)) {
            return new Response($cached['body'], 200, $cached['headers'] + [
                // Видно, що сторінка прийшла з кешу — корисно під час
                // розбору скарг на «стару ціну»
                'X-Page-Cache' => 'hit',
            ]);
        }

        $response = $next($request);

        if ($this->isStorable($response)) {
            Cache::put($key, [
                'body' => $response->getContent(),
                'headers' => [
                    'Content-Type' => $response->headers->get('Content-Type', 'text/html; charset=utf-8'),
                ],
            ], self::TTL_SECONDS);
        }

        return $response;
    }

    private function isCacheable(Request $request): bool
    {
        if (! $request->isMethod('GET')) {
            return false;
        }

        /*
         * Авторизований відвідувач кеш не читає й не пише: інакше
         * сторінка, зібрана для адміністратора, могла б поїхати
         * анонімному — або навпаки.
         */
        if ($request->user() !== null) {
            return false;
        }

        $path = $request->getPathInfo();

        foreach (self::NEVER as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Ключ містить версію каталогу, мову, шлях і рядок запиту.
     *
     * Версія робить інвалідацію миттєвою: збереження в адмінці збільшує
     * її, і всі старі записи перестають читатись одразу — без обходу
     * ключів і без тегів, яких файловий драйвер не має.
     */
    private function key(Request $request): string
    {
        $query = $request->getQueryString();

        return $this->catalog->key('page.'.sha1(
            app()->getLocale().'|'.$request->getPathInfo().'|'.($query ?? ''),
        ));
    }

    private function isStorable(BaseResponse $response): bool
    {
        // Тільки успішні сторінки: кешований 404 чи 500 жив би добу
        return $response->getStatusCode() === 200
            && str_contains((string) $response->headers->get('Content-Type'), 'text/html');
    }
}
