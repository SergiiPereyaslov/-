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
        $keepSlash = $uri !== '/' && str_ends_with($uri, '/');

        $url = parent::prepareUrlForRequest($uri);

        return $keepSlash ? $url.'/' : $url;
    }
}
