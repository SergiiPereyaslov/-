<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Group;
use App\Models\Post;
use App\Models\Product;
use Tests\TestCase;

/**
 * Технічне SEO: канонічні адреси, hreflang, карта сайту, robots.
 *
 * Найдорожча частина міграції після редиректів. Помилка тут не видна
 * на сайті взагалі — вона видна через місяць у падінні трафіку.
 */
class SeoTest extends TestCase
{
    /** Канонічна адреса вказує сама на себе, зі слешем і повним доменом. */
    public function test_canonical_points_to_the_page_itself(): void
    {
        $html = (string) $this->get('/catalog/stakany-paperovi/')->getContent();

        $this->assertStringContainsString(
            '<link rel="canonical" href="'.config('site.url').'/catalog/stakany-paperovi/">',
            $html,
        );
    }

    /** Російська версія канонізується на себе, а не на українську. */
    public function test_russian_page_is_canonical_to_itself(): void
    {
        $html = (string) $this->get('/ru/catalog/stakany-paperovi/')->getContent();

        $this->assertStringContainsString(
            '<link rel="canonical" href="'.config('site.url').'/ru/catalog/stakany-paperovi/">',
            $html,
        );
    }

    /**
     * hreflang зв'язує пару взаємно.
     *
     * Без цього дві мовні версії того самого товару виглядають як дублі,
     * і пошук сам обирає, яку показати — часто не ту.
     */
    public function test_hreflang_links_both_languages_and_x_default(): void
    {
        foreach (['/catalog/stakany-paperovi/', '/ru/catalog/stakany-paperovi/'] as $path) {
            $html = (string) $this->get($path)->getContent();

            $this->assertStringContainsString('hreflang="uk" href="'.config('site.url').'/catalog/stakany-paperovi/"', $html);
            $this->assertStringContainsString('hreflang="ru" href="'.config('site.url').'/ru/catalog/stakany-paperovi/"', $html);
            $this->assertStringContainsString('hreflang="x-default"', $html);
        }
    }

    public function test_sitemap_covers_the_whole_site(): void
    {
        $xml = simplexml_load_string($this->get('/sitemap.xml')->assertOk()->getContent());

        $this->assertNotFalse($xml);

        $locs = array_map(fn ($url): string => (string) $url->loc, iterator_to_array($xml->url, false));

        // Кожна адреса подана рівно раз: два записи на мову пошук
        // порахував би дублями
        $this->assertSame(count($locs), count(array_unique($locs)));

        $expected = 11                              // статичні сторінки
            + Group::count()
            + Category::count()
            + Product::count()
            + Post::live()->count()
            + count(config('cities'))
            + count(config('sectors'));

        $this->assertGreaterThanOrEqual($expected, count($locs));
    }

    /** Приватні сторінки в карту не потрапляють. */
    public function test_sitemap_omits_private_pages(): void
    {
        $content = (string) $this->get('/sitemap.xml')->getContent();

        foreach (['/koshyk/', '/oformlennya/', '/dyakuyemo/', '/admin/'] as $path) {
            $this->assertStringNotContainsString('<loc>'.config('site.url').$path, $content);
        }
    }

    /** Кожна адреса в карті має посилання на свою пару іншою мовою. */
    public function test_every_sitemap_entry_has_language_alternates(): void
    {
        $xml = simplexml_load_string($this->get('/sitemap.xml')->getContent());

        foreach ($xml->url as $url) {
            $links = $url->children('http://www.w3.org/1999/xhtml')->link;

            $this->assertCount(3, $links, "Немає hreflang для {$url->loc}");
        }
    }

    public function test_robots_points_to_the_sitemap_and_hides_private_paths(): void
    {
        $body = (string) $this->get('/robots.txt')->assertOk()->getContent();

        $this->assertStringContainsString('Sitemap: '.config('site.url').'/sitemap.xml', $body);

        foreach (['/admin/', '/api/', '/koshyk/'] as $path) {
            $this->assertStringContainsString("Disallow: {$path}", $body);
        }
    }

    /** Картка для месенджерів: без неї в чаті буде голий URL. */
    public function test_open_graph_tags_are_present(): void
    {
        $html = (string) $this->get('/')->getContent();

        foreach (['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card'] as $tag) {
            $this->assertStringContainsString($tag, $html);
        }

        $this->assertFileExists(public_path('images/og-uk.png'));
        $this->assertFileExists(public_path('images/og-ru.png'));
    }

    /** Кожна сторінка має власний title і опис, а не спільну заглушку. */
    public function test_pages_have_distinct_titles(): void
    {
        $titles = [];

        foreach (['/', '/catalog/', '/brenduvannya/', '/pro-nas/', '/blog/', '/kontakty/'] as $path) {
            preg_match('~<title>(.*?)</title>~s', (string) $this->get($path)->getContent(), $m);

            $this->assertNotEmpty($m[1] ?? '', "Немає title у {$path}");
            $titles[] = $m[1];
        }

        $this->assertSame(count($titles), count(array_unique($titles)));
    }
}
