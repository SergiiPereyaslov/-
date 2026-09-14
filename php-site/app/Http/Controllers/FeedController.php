<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Support\Url;
use Illuminate\Http\Response;

/**
 * RSS блогу.
 *
 * Стрічка віддається обома мовами під різними адресами: читач, який
 * підписався на російську версію, не має раптом отримувати українські
 * заголовки.
 */
class FeedController extends Controller
{
    /** Скільки статей у стрічці. Більше читачі все одно не гортають. */
    private const LIMIT = 20;

    public function __invoke(): Response
    {
        $posts = Post::live()->newestFirst()->limit(self::LIMIT)->get();

        $xml = view('feeds.rss', [
            'posts' => $posts,
            'selfUrl' => Url::canonical('/blog/rss.xml'),
        ])->render();

        return response($xml, 200, [
            'Content-Type' => 'application/rss+xml; charset=utf-8',
            // Стрічка змінюється разом із блогом — раз на кілька тижнів
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
