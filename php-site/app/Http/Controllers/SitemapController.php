<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Group;
use App\Models\Post;
use App\Models\Product;
use App\Support\Url;
use Illuminate\Http\Response;

/**
 * Карта сайту.
 *
 * Кожна адреса подається один раз, з посиланнями на свою пару іншою
 * мовою через xhtml:link. Два окремі записи — український і російський —
 * пошукова система порахувала б різними сторінками з однаковим змістом.
 *
 * Сторінки кошика, оформлення й подяки сюди не потрапляють: у кожного
 * відвідувача вони свої й нічого не дають у видачі.
 */
class SitemapController extends Controller
{
    /** Статичні сторінки з пріоритетом і частотою оновлення. */
    private const STATIC_PAGES = [
        ['/', '1.0', 'weekly'],
        ['/catalog/', '0.9', 'weekly'],
        ['/brenduvannya/', '0.8', 'monthly'],
        ['/brenduvannya/druk-na-stakanakh/', '0.7', 'monthly'],
        ['/brenduvannya/druk-na-paketakh/', '0.7', 'monthly'],
        ['/dostavka-i-oplata/', '0.6', 'monthly'],
        ['/pro-nas/', '0.5', 'monthly'],
        ['/kontakty/', '0.6', 'monthly'],
        ['/blog/', '0.7', 'weekly'],
        ['/polityka-konfidentsiynosti/', '0.2', 'yearly'],
        ['/publichna-oferta/', '0.2', 'yearly'],
    ];

    public function __invoke(): Response
    {
        $urls = [];

        foreach (self::STATIC_PAGES as [$path, $priority, $changefreq]) {
            $urls[] = compact('path', 'priority', 'changefreq');
        }

        foreach (Group::orderBy('sortOrder')->get() as $group) {
            $urls[] = ['path' => "/catalog/{$group->slug}/", 'priority' => '0.8', 'changefreq' => 'weekly'];
        }

        foreach (Category::orderBy('sortOrder')->get() as $category) {
            $urls[] = ['path' => "/catalog/{$category->slug}/", 'priority' => '0.8', 'changefreq' => 'weekly'];

            // Фасетні посадкові — окремі сторінки з власним текстом
            foreach ($category->indexed_facets as $facet) {
                $urls[] = [
                    'path' => "/catalog/{$category->slug}/{$facet['slug']}/",
                    'priority' => '0.6',
                    'changefreq' => 'monthly',
                ];
            }
        }

        foreach (Product::ordered()->get() as $product) {
            $urls[] = ['path' => "/product/{$product->slug}/", 'priority' => '0.7', 'changefreq' => 'weekly'];
        }

        foreach (Post::live()->newestFirst()->get() as $post) {
            $urls[] = [
                'path' => "/blog/{$post->slug}/",
                'priority' => '0.5',
                'changefreq' => 'yearly',
                'lastmod' => $post->updatedAt?->toDateString(),
            ];
        }

        foreach (config('cities') as $city) {
            $urls[] = ['path' => "/upakovka/{$city['slug']}/", 'priority' => '0.6', 'changefreq' => 'monthly'];
        }

        foreach (config('sectors') as $sector) {
            $urls[] = ['path' => "/dlya/{$sector['slug']}/", 'priority' => '0.6', 'changefreq' => 'monthly'];
        }

        return response()
            ->view('feeds.sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    /**
     * robots.txt.
     *
     * Віддається маршрутом, а не файлом: адреса карти сайту залежить від
     * домену, а той береться зі змінної оточення й може відрізнятись на
     * тестовому стенді.
     */
    public function robots(): Response
    {
        $lines = [
            'User-Agent: *',
            'Allow: /',
            // Ці розділи не дають нічого у видачі, але з'їдають бюджет обходу
            'Disallow: /admin/',
            'Disallow: /api/',
            'Disallow: /koshyk/',
            'Disallow: /oformlennya/',
            'Disallow: /dyakuyemo/',
            'Disallow: /ru/koshyk/',
            'Disallow: /ru/oformlennya/',
            'Disallow: /ru/dyakuyemo/',
            '',
            'Sitemap: '.Url::canonical('/sitemap.xml', 'uk'),
            '',
        ];

        return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain; charset=utf-8']);
    }
}
