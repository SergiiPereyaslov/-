<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogCache;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Кеш готових сторінок.
 *
 * Заміна тому, що в Next-версії робила статична генерація. Головні
 * ризики тут два: віддати одному відвідувачу сторінку, зібрану для
 * іншого, і показувати стару ціну після правки в адмінці.
 */
class PageCacheTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        // Кожен тест починає з чистого кешу, інакше вони впливали б один
        // на одного через спільне сховище
        Cache::clear();
    }

    public function test_second_request_is_served_from_cache(): void
    {
        $this->get('/catalog/stakany-paperovi/')->assertOk()->assertHeaderMissing('X-Page-Cache');
        $this->get('/catalog/stakany-paperovi/')->assertOk()->assertHeader('X-Page-Cache', 'hit');
    }

    /**
     * Правка в адмінці має бути видна одразу.
     *
     * Це та частина, заради якої взагалі є явна інвалідація: кеш із
     * простим строком життя показував би стару ціну добу.
     */
    public function test_saving_in_admin_invalidates_the_cache(): void
    {
        $product = Product::inCategory('stakany-paperovi')->ordered()->first();

        $this->get('/catalog/stakany-paperovi/');
        $this->get('/catalog/stakany-paperovi/')->assertHeader('X-Page-Cache', 'hit');

        $this->actingAs(AdminUser::create([
            'email' => 'cache-'.uniqid().'@example.com',
            'name' => 'Тест',
            'passwordHash' => Hash::make('Sup3rS3cret!pass'),
        ]));

        $this->put("/admin/products/{$product->slug}/quick", ['priceRetail' => '77.77']);

        $this->app['auth']->logout();

        $response = $this->get('/catalog/stakany-paperovi/')->assertOk();

        $response->assertHeaderMissing('X-Page-Cache');
        $response->assertSee('77.77', escape: false);
    }

    /** Сторінки з особистими даними не кешуються ніколи. */
    public function test_private_pages_are_never_cached(): void
    {
        foreach (['/koshyk/', '/oformlennya/', '/dyakuyemo/'] as $path) {
            $this->get($path);
            $this->get($path)->assertHeaderMissing('X-Page-Cache');
        }
    }

    /**
     * Сторінка, зібрана для адміністратора, не має поїхати анонімному.
     *
     * Тут би й сталась найдорожча помилка кешування: у панелі видно
     * заявки з телефонами клієнтів.
     */
    public function test_authenticated_requests_neither_read_nor_write_the_cache(): void
    {
        $admin = AdminUser::create([
            'email' => 'cache2-'.uniqid().'@example.com',
            'name' => 'Тест',
            'passwordHash' => Hash::make('Sup3rS3cret!pass'),
        ]);

        $this->actingAs($admin);
        $this->get('/catalog/stakany-paperovi/')->assertHeaderMissing('X-Page-Cache');
        $this->get('/catalog/stakany-paperovi/')->assertHeaderMissing('X-Page-Cache');

        $this->app['auth']->logout();

        // Анонімний відвідувач теж починає з порожнього кешу
        $this->get('/catalog/stakany-paperovi/')->assertHeaderMissing('X-Page-Cache');
    }

    /** Адмінка не кешується навіть без входу. */
    public function test_admin_section_is_never_cached(): void
    {
        $this->get('/admin/');
        $this->get('/admin/')->assertHeaderMissing('X-Page-Cache');
    }

    /** Мови кешуються окремо — інакше одна перетирала б іншу. */
    public function test_languages_have_separate_cache_entries(): void
    {
        $category = Category::find('stakany-paperovi');

        $this->get('/catalog/stakany-paperovi/');
        $this->get('/ru/catalog/stakany-paperovi/')
            ->assertHeaderMissing('X-Page-Cache')
            ->assertSee($category->nameRu, escape: false);
    }

    /** Різні параметри запиту — різні записи. */
    public function test_query_string_is_part_of_the_key(): void
    {
        $this->get('/catalog/');
        $this->get('/catalog/?page=2')->assertHeaderMissing('X-Page-Cache');
    }

    /** Помилкові відповіді не мають осідати в кеші на добу. */
    public function test_errors_are_not_cached(): void
    {
        $this->get('/catalog/nemaye/')->assertNotFound();
        $this->get('/catalog/nemaye/')->assertNotFound()->assertHeaderMissing('X-Page-Cache');
    }

    /** Збільшення версії робить усі старі записи недосяжними. */
    public function test_version_bump_invalidates_everything(): void
    {
        $this->get('/catalog/');
        $this->get('/catalog/')->assertHeader('X-Page-Cache', 'hit');

        app(CatalogCache::class)->flush();

        $this->get('/catalog/')->assertHeaderMissing('X-Page-Cache');
    }
}
