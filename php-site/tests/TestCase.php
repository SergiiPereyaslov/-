<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Зберегти завершальний слеш в адресі запиту.
     *
     * Стандартний помічник тестів зрізає його: prepareUrlForRequest()
     * робить trim($url, '/'). Для більшості застосунків це нешкідливо,
     * але тут кожна канонічна адреса саме зі слешем, і без цього
     * перевизначення тест запитував би /catalog/x замість /catalog/x/ —
     * тобто перевіряв би не ту адресу й давав хибний 301.
     */
    protected function prepareUrlForRequest($uri): string
    {
        // Слеш стоїть у кінці шляху, а не всього рядка: у /a/?b=1 його
        // треба шукати перед знаком питання
        [$path, $query] = array_pad(explode('?', $uri, 2), 2, null);

        $keepSlash = $path !== '/' && str_ends_with((string) $path, '/');

        $url = parent::prepareUrlForRequest((string) $path);

        return ($keepSlash ? $url.'/' : $url).($query === null ? '' : '?'.$query);
    }
}
