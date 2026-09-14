<?php

namespace App\Http\Controllers;

use App\Support\Url;
use Illuminate\Http\Response;

/**
 * Канал для дослідників безпеки (RFC 9116).
 *
 * Не статичний файл у public/, а маршрут — саме через поле Expires:
 * стандарт вимагає його, а прострочений файл вважається недійсним.
 * Тут дата завжди рахується на рік уперед від запиту, тож нагадувати
 * про щорічне оновлення нікому не доведеться.
 */
class SecurityTxtController extends Controller
{
    public function __invoke(): Response
    {
        $expires = now()->addYear()->utc()->format('Y-m-d\TH:i:s\Z');

        $lines = [
            'Contact: mailto:'.config('site.email'),
            'Expires: '.$expires,
            'Preferred-Languages: uk, en, ru',
            'Canonical: '.Url::canonical('/.well-known/security.txt', 'uk'),
            '',
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
