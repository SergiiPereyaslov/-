<?php

namespace Tests\Feature;

use App\Http\Middleware\InlineScripts;
use Carbon\Carbon;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Заходи, які закривають знахідки обох аудитів.
 *
 * Тести тут навмисне перевіряють не «заголовок присутній», а те, що
 * саме він забороняє: політика, яка дозволяє все, теж присутня.
 */
class SecurityTest extends TestCase
{
    use DatabaseTransactions;

    /** Значення однієї директиви CSP — щоб не ловити підрядок із сусідньої. */
    private function directive(string $csp, string $name): string
    {
        foreach (explode(';', $csp) as $part) {
            $part = trim($part);

            if (str_starts_with($part, $name.' ')) {
                return $part;
            }
        }

        $this->fail("У політиці немає директиви {$name}: {$csp}");
    }

    public function test_security_headers_are_present_on_pages(): void
    {
        $response = $this->get('/');

        $response->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    /**
     * Головне, що дає CSP: вставлений у розмітку <script> не виконається.
     *
     * Саме 'unsafe-inline' зняв би цей захист повністю, тому його
     * відсутність перевіряється окремо від наявності заголовка.
     */
    public function test_csp_does_not_allow_arbitrary_inline_scripts(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        $scriptSrc = $this->directive($csp, 'script-src');

        $this->assertStringNotContainsString("'unsafe-inline'", $scriptSrc);
        $this->assertStringContainsString("'self'", $scriptSrc);
    }

    /**
     * Хеші рахуються з того самого рядка, що йде в сторінку.
     *
     * Якби розмітка й політика брали текст із різних місць, вони
     * розійшлись би на перший же пробіл, і браузер мовчки заблокував
     * би тему — сторінка блимала б світлим на кожному завантаженні.
     */
    public function test_csp_carries_hashes_of_the_inline_scripts_actually_rendered(): void
    {
        $response = $this->get('/');
        $csp = $response->headers->get('Content-Security-Policy');
        $html = $response->getContent();

        foreach (InlineScripts::all() as $script) {
            $hash = "'sha256-".base64_encode(hash('sha256', $script, true))."'";

            $this->assertStringContainsString($hash, $csp);
            $this->assertStringContainsString($script, $html);
        }
    }

    /** Політика забороняє вбудовувати сайт у чужий фрейм і підміняти base. */
    public function test_csp_blocks_framing_and_base_tag_hijacking(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringContainsString("base-uri 'none'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("form-action 'self'", $csp);
    }

    /**
     * Без лічильника CSP не відкриває доступ до чужих доменів.
     *
     * Інакше дозвіл на googletagmanager.com висів би на сайті, який
     * аналітикою не користується взагалі.
     */
    public function test_analytics_domains_appear_only_when_analytics_is_configured(): void
    {
        config(['site.ga_id' => null]);
        $this->assertStringNotContainsString(
            'googletagmanager',
            (string) $this->get('/')->headers->get('Content-Security-Policy'),
        );

        config(['site.ga_id' => 'G-TEST']);
        $this->assertStringContainsString(
            'googletagmanager',
            (string) $this->get('/kontakty/')->headers->get('Content-Security-Policy'),
        );
    }

    /** Версія PHP у заголовку — підказка тому, хто шукає стару збірку. */
    public function test_php_version_is_not_advertised(): void
    {
        $this->get('/')->assertHeaderMissing('X-Powered-By');
    }

    /**
     * Особисті сторінки не кешуються й не індексуються.
     *
     * Заголовки ставить саме застосунок: у nginx їхній add_header у
     * location /admin/ не спрацьовує — try_files робить внутрішній
     * редирект у локацію для .php, і заголовки додає вже вона.
     */
    public function test_private_pages_are_not_cacheable_or_indexable(): void
    {
        foreach (['/admin/', '/koshyk/', '/oformlennya/', '/dyakuyemo/', '/ru/koshyk/'] as $path) {
            $response = $this->get($path);

            $this->assertStringContainsString(
                'no-store',
                (string) $response->headers->get('Cache-Control'),
                "Сторінка {$path} може осісти в кеші",
            );
            $response->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        }
    }

    /** Публічні сторінки навпаки — мають індексуватись. */
    public function test_public_pages_stay_indexable(): void
    {
        foreach (['/', '/catalog/', '/blog/'] as $path) {
            $this->get($path)->assertHeaderMissing('X-Robots-Tag');
        }
    }

    /** Cookie сесії недосяжна для скриптів і не їде на чужі сайти. */
    public function test_session_cookie_is_http_only_and_same_site(): void
    {
        $this->assertTrue(config('session.http_only'));
        $this->assertSame('lax', config('session.same_site'));
    }

    /**
     * Неіснуючі адреси мають давати 404, а не 500.
     *
     * 500 не лише виглядає поломкою — у ньому назовні їде трасування
     * стека, якщо на сервері випадково лишиться APP_DEBUG=true.
     */
    public function test_unknown_slugs_return_404_everywhere(): void
    {
        $paths = [
            '/catalog/nemaye/',
            '/catalog/stakany-paperovi/nemaye/',
            '/product/nemaye/',
            '/blog/nemaye/',
            '/dlya/nemaye/',
            '/ru/catalog/nemaye/',
            '/ru/product/nemaye/',
        ];

        foreach ($paths as $path) {
            $this->get($path)->assertNotFound();
        }
    }

    /** RFC 9116: канал, куди писати про вразливість. */
    public function test_security_txt_is_served_with_a_future_expiry(): void
    {
        $response = $this->get('/.well-known/security.txt')->assertOk();

        $body = $response->getContent();

        $this->assertStringContainsString('Contact: mailto:', $body);
        $this->assertMatchesRegularExpression('/^Expires: (\S+)$/m', $body);

        preg_match('/^Expires: (\S+)$/m', $body, $m);
        $this->assertGreaterThan(now()->addMonths(6), Carbon::parse($m[1]));
    }

    /**
     * Захист від CSRF увімкнений і форми несуть токен.
     *
     * Перевірити його відмовою не вийде: PreventRequestForgery сам себе
     * вимикає під тестами (runningUnitTests), тож запит без токена
     * пройшов би й на зламаній конфігурації. Тому перевіряється те, що
     * від конфігурації справді залежить: посередник у групі web і
     * прихований токен у розмітці форм.
     */
    public function test_csrf_protection_is_enabled_and_forms_carry_a_token(): void
    {
        $web = app(Kernel::class)->getMiddlewareGroups()['web'];

        $this->assertContains(PreventRequestForgery::class, $web);

        $this->get('/admin/')->assertOk()->assertSee('name="_token"', escape: false);
    }

    /** Перебір пароля впирається в обмеження частоти. */
    public function test_login_attempts_are_rate_limited(): void
    {
        $last = null;

        for ($i = 0; $i < 7; $i++) {
            $last = $this->post('/admin/', [
                'email' => 'nobody@example.com',
                'password' => 'wrong-'.$i,
            ]);
        }

        $this->assertSame(429, $last->getStatusCode());
    }

    /** Заявки теж обмежені: форма публічна й відкрита для спаму. */
    public function test_lead_endpoint_is_rate_limited(): void
    {
        $last = null;

        for ($i = 0; $i < 12; $i++) {
            $last = $this->postJson('/api/lead', ['phone' => '+380501234567']);
        }

        $this->assertSame(429, $last->getStatusCode());
    }

    /** Розмір заявки обмежений, інакше в базу ляже мегабайт сміття. */
    public function test_oversized_lead_payload_is_rejected(): void
    {
        $this->postJson('/api/lead', [
            'phone' => '+380501234567',
            'comment' => str_repeat('я', 5000),
        ])->assertStatus(422);

        $this->postJson('/api/lead', [
            'phone' => '+380501234567',
            'items' => array_fill(0, 500, ['sku' => 'x', 'name' => 'y', 'packs' => 1, 'sum' => 1]),
        ])->assertStatus(422);
    }

    /** Адмінка закрита для анонімних. */
    public function test_admin_pages_require_authentication(): void
    {
        foreach (['/admin/dashboard/', '/admin/leads/', '/admin/products/'] as $path) {
            $this->get($path)->assertRedirect();
        }
    }
}
