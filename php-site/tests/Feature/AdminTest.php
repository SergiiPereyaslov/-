<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\Category;
use App\Models\Lead;
use App\Models\Post;
use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Адмінка: доступ, вхід і правки.
 *
 * Головна частина — перевірки доступу. Аудит Next-версії показав, що тут
 * легко помилитись: там захист стояв у layout, який для серверних дій
 * не виконується взагалі.
 */
class AdminTest extends TestCase
{
    use DatabaseTransactions;

    private const PASSWORD = 'Sup3rS3cret!pass';

    private function admin(array $overrides = []): AdminUser
    {
        return AdminUser::create(array_merge([
            'email' => 'test-'.uniqid().'@example.com',
            'name' => 'Тест',
            'passwordHash' => Hash::make(self::PASSWORD),
        ], $overrides));
    }

    /** @return array<string, array{string, string}> */
    public static function guardedRoutes(): array
    {
        return [
            'огляд' => ['get', '/admin/dashboard/'],
            'заявки' => ['get', '/admin/leads/'],
            'товари' => ['get', '/admin/products/'],
            'категорії' => ['get', '/admin/categories/'],
            'блог' => ['get', '/admin/posts/'],
            'нова стаття' => ['get', '/admin/posts/new/'],
            'імпорт' => ['get', '/admin/import/'],
            'A/B' => ['get', '/admin/ab/'],
            'створення статті' => ['post', '/admin/posts/'],
            'імпорт файлу' => ['post', '/admin/import/'],
        ];
    }

    /**
     * Жодна адреса панелі не відкривається без входу — ні на читання,
     * ні на запис.
     */
    #[DataProvider('guardedRoutes')]
    public function test_admin_routes_require_authentication(string $method, string $path): void
    {
        $this->{$method}($path)->assertRedirect();
        $this->assertGuest();
    }

    /** Зміна даних без входу теж має відхилятись. */
    public function test_writes_require_authentication(): void
    {
        $product = Product::first();

        $this->put("/admin/products/{$product->slug}/quick", ['priceRetail' => 1])->assertRedirect();
        $this->delete('/admin/posts/'.Post::first()->slug.'/')->assertRedirect();

        // Ціна не змінилась
        $this->assertSame(
            (float) $product->priceRetail,
            (float) $product->fresh()->priceRetail,
        );
    }

    public function test_login_succeeds_with_correct_password(): void
    {
        $user = $this->admin();

        $this->post('/admin/', ['email' => $user->email, 'password' => self::PASSWORD])
            ->assertRedirect('/admin/dashboard/');

        $this->assertAuthenticatedAs($user->fresh());
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = $this->admin();

        $this->post('/admin/', ['email' => $user->email, 'password' => 'не той'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    /**
     * Акаунт блокується після десяти невдалих спроб.
     *
     * Ліміт частоти в nginx відсікає навалу, але повільний перебір під
     * нього не потрапляє — цей рубіж саме для нього.
     */
    public function test_account_locks_after_repeated_failures(): void
    {
        $user = $this->admin();

        /*
         * Ліміт частоти відсік би спроби вже на п'ятій — і це правильно:
         * він захищає від швидкого перебору з одного IP. Блокування
         * акаунта закриває інший випадок — повільний перебір з багатьох
         * адрес, під ліміт не підпадає. Тут перевіряється саме воно, тож
         * перший рубіж вимикаємо.
         */
        $this->withoutMiddleware(ThrottleRequests::class);

        for ($i = 0; $i < AdminUser::MAX_ATTEMPTS; $i++) {
            $this->post('/admin/', ['email' => $user->email, 'password' => 'не той']);
        }

        $this->assertTrue($user->fresh()->isLocked());

        // Навіть правильний пароль тепер не пускає
        $this->post('/admin/', ['email' => $user->email, 'password' => self::PASSWORD])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    /** Успішний вхід обнуляє лічильник — інакше акаунт замкнувся б з часом. */
    public function test_successful_login_resets_the_counter(): void
    {
        $user = $this->admin();

        $this->post('/admin/', ['email' => $user->email, 'password' => 'не той']);
        $this->assertSame(1, $user->fresh()->failedAttempts);

        $this->post('/admin/', ['email' => $user->email, 'password' => self::PASSWORD]);
        $this->assertSame(0, $user->fresh()->failedAttempts);
    }

    /**
     * За часом відповіді не можна з'ясувати, чи існує адреса.
     *
     * Без хеша-пустушки відповідь для неіснуючого e-mail поверталась би
     * за мілісекунди замість ~250 мс, і форму входу можна було б
     * використати як довідник зареєстрованих адрес. Саме це знайшов
     * аудит Next-версії.
     */
    public function test_login_timing_does_not_reveal_existing_emails(): void
    {
        $user = $this->admin();

        // Відповідь 429 повертається миттєво й зіпсувала б вимірювання
        $this->withoutMiddleware(ThrottleRequests::class);

        $measure = function (string $email): float {
            $start = microtime(true);
            $this->post('/admin/', ['email' => $email, 'password' => 'не той']);

            return (microtime(true) - $start) * 1000;
        };

        $existing = $measure($user->email);
        $missing = $measure('nobody-'.uniqid().'@example.com');

        // Обидві гілки рахують bcrypt, тож різниця має лишатись у межах шуму
        $this->assertLessThan(
            max($existing, $missing) * 0.5,
            abs($existing - $missing),
            sprintf('Різниця в часі завелика: %.0f мс проти %.0f мс', $existing, $missing),
        );
    }

    public function test_admin_can_change_a_price(): void
    {
        $this->actingAs($this->admin());

        $product = Product::first();

        $this->put("/admin/products/{$product->slug}/quick", [
            'priceRetail' => '9.99',
            'inStock' => '1',
        ])->assertRedirect();

        $this->assertSame('9.99', $product->fresh()->priceRetail);
    }

    /** Безглузда ціна не має потрапити в каталог. */
    public function test_absurd_price_is_rejected(): void
    {
        $this->actingAs($this->admin());

        $product = Product::first();
        $before = $product->priceRetail;

        $this->put("/admin/products/{$product->slug}/quick", ['priceRetail' => '-5'])
            ->assertSessionHasErrors('priceRetail');

        $this->assertSame($before, $product->fresh()->priceRetail);
    }

    /** Менеджер міняє стан заявки, але не те, що написав клієнт. */
    public function test_manager_can_update_lead_status_only(): void
    {
        $this->actingAs($this->admin());

        $lead = Lead::create([
            'number' => 'SEP-ADM001',
            'kind' => 'quote',
            'phone' => '+380501234567',
            'name' => 'Клієнт',
        ]);

        $this->put("/admin/leads/{$lead->id}/", [
            'status' => 'done',
            'managerNote' => 'Передзвонив',
            // Спроба підмінити те, що надіслав клієнт
            'phone' => '+380999999999',
            'name' => 'Підміна',
        ])->assertRedirect();

        $fresh = $lead->fresh();

        $this->assertSame('done', $fresh->status);
        $this->assertSame('Передзвонив', $fresh->managerNote);
        $this->assertSame('+380501234567', $fresh->phone);
        $this->assertSame('Клієнт', $fresh->name);
    }

    /** Некоректний JSON у частих питаннях не має доїхати до бази. */
    public function test_broken_faq_json_is_rejected(): void
    {
        $this->actingAs($this->admin());

        $category = Category::first();
        $before = $category->faq;

        $this->put("/admin/categories/{$category->slug}/", [
            'nameUk' => $category->nameUk,
            'nameRu' => $category->nameRu,
            'h1Uk' => $category->h1Uk,
            'h1Ru' => $category->h1Ru,
            'faq' => '[{"q": зламано}]',
        ])->assertSessionHasErrors('faq');

        $this->assertSame($before, $category->fresh()->faq);
    }

    /** Вихід із системи закриває доступ одразу. */
    public function test_logout_ends_the_session(): void
    {
        $this->actingAs($this->admin());

        $this->post('/admin/logout')->assertRedirect();
        $this->assertGuest();

        $this->get('/admin/dashboard/')->assertRedirect();
    }

    /** Панель не має потрапляти в індекс за жодних обставин. */
    public function test_admin_pages_are_noindex(): void
    {
        $this->get('/admin/')->assertOk()->assertSee('noindex', escape: false);

        $this->actingAs($this->admin());
        $this->get('/admin/dashboard/')->assertOk()->assertSee('noindex', escape: false);
    }
}
