<?php

namespace Tests\Feature;

use App\Models\Post;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Контентні сторінки, блог і посадкові.
 *
 * Перевіряється не верстка, а те, що кожна адреса з мапи сайту жива
 * обома мовами й що невідомий слаг дає 404, а не 200 із порожнечею.
 */
class PagesTest extends TestCase
{
    /** @return array<string, array{string}> */
    public static function publicPages(): array
    {
        $paths = [
            'головна' => '/',
            'каталог' => '/catalog/',
            'брендування' => '/brenduvannya/',
            'друк на стаканах' => '/brenduvannya/druk-na-stakanakh/',
            'друк на пакетах' => '/brenduvannya/druk-na-paketakh/',
            'доставка й оплата' => '/dostavka-i-oplata/',
            'про нас' => '/pro-nas/',
            'контакти' => '/kontakty/',
            'політика конфіденційності' => '/polityka-konfidentsiynosti/',
            'публічна оферта' => '/publichna-oferta/',
            'блог' => '/blog/',
            'кошик' => '/koshyk/',
            'оформлення' => '/oformlennya/',
            'подяка' => '/dyakuyemo/',
            'місто Дніпро' => '/upakovka/dnipro/',
            'місто Київ' => '/upakovka/kyiv/',
            'сегмент кав’ярні' => '/dlya/kavyarni/',
            'сегмент пекарні' => '/dlya/pekarni/',
        ];

        return array_map(fn (string $path): array => [$path], $paths);
    }

    #[DataProvider('publicPages')]
    public function test_page_is_served_in_both_languages(string $path): void
    {
        $this->get($path)->assertOk();
        $this->get('/ru'.$path)->assertOk();
    }

    /** Кожна опублікована стаття має свою сторінку. */
    public function test_every_published_post_has_a_page(): void
    {
        foreach (Post::live()->get() as $post) {
            $this->get("/blog/{$post->slug}/")->assertOk()->assertSee($post->titleUk, escape: false);
        }
    }

    /**
     * Невідомий слаг посадкової дає 404.
     *
     * У Next-версії саме тут аудит знайшов 500: місто діставали з мапи
     * без перевірки, і сторінка валилась на першому ж зверненні до
     * відмінка назви.
     */
    public function test_unknown_landing_slugs_return_404(): void
    {
        foreach (['/upakovka/nemaye/', '/dlya/nemaye/', '/brenduvannya/nemaye/', '/blog/nemaye/'] as $path) {
            $this->get($path)->assertNotFound();
            $this->get('/ru'.$path)->assertNotFound();
        }
    }

    /** Сторінки, що не мають потрапляти в індекс, кажуть про це прямо. */
    public function test_private_pages_are_noindex(): void
    {
        foreach (['/koshyk/', '/oformlennya/', '/dyakuyemo/'] as $path) {
            $this->get($path)->assertOk()->assertSee('noindex', escape: false);
        }
    }

    /** Номер заявки показується лише якщо схожий на справжній. */
    public function test_thanks_page_ignores_a_forged_number(): void
    {
        $this->get('/dyakuyemo/?n=SEP-ABC1234')->assertOk()->assertSee('SEP-ABC1234', escape: false);
        $this->get('/dyakuyemo/?n=<script>alert(1)</script>')->assertOk()->assertDontSee('alert(1)', escape: false);
    }

    public function test_rss_feed_is_valid_xml(): void
    {
        $response = $this->get('/blog/rss.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/rss+xml; charset=utf-8');

        $xml = simplexml_load_string($response->getContent());

        $this->assertNotFalse($xml, 'Стрічка має бути валідним XML');
        $this->assertSame(Post::live()->count(), $xml->channel->item->count());
    }

    /**
     * Адреса файлу в стрічці — без завершального слеша.
     *
     * Канонічна форма сторінок цього сайту зі слешем, але для файлу це
     * зробило б адресу схожою на теку, і читалка стрічки її не знайшла б.
     */
    public function test_feed_self_link_has_no_trailing_slash(): void
    {
        $xml = simplexml_load_string($this->get('/blog/rss.xml')->getContent());
        $self = (string) $xml->channel->children('http://www.w3.org/2005/Atom')->link->attributes()['href'];

        $this->assertStringEndsWith('/blog/rss.xml', $self);
    }
}
