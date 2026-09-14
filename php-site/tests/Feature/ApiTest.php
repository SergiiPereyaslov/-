<?php

namespace Tests\Feature;

use App\Models\Product;
use Tests\TestCase;

/**
 * Публічний API: підказки пошуку й дані товарів для кошика.
 */
class ApiTest extends TestCase
{
    public function test_search_finds_products_by_name(): void
    {
        $this->getJson('/api/search?q=стакан&locale=uk')
            ->assertOk()
            ->assertJsonStructure([['slug', 'name', 'spec', 'sku', 'price', 'shape']]);
    }

    /**
     * Пошук знаходить товар і російською в українській версії, і навпаки.
     *
     * Колонка searchText навмисно містить назви обома мовами: половина
     * аудиторії набирає запит російською незалежно від версії сайту.
     */
    public function test_search_works_across_languages(): void
    {
        $uk = $this->getJson('/api/search?q=стакан&locale=uk')->json();
        $ru = $this->getJson('/api/search?q=стакан&locale=ru')->json();

        $this->assertNotEmpty($uk);
        $this->assertNotEmpty($ru);
        $this->assertStringContainsString('Стакан', $ru[0]['name']);
    }

    /** Артикул — теж робочий запит: менеджер шукає саме так. */
    public function test_search_finds_by_sku(): void
    {
        $product = Product::first();

        $hits = $this->getJson('/api/search?q='.urlencode($product->sku))->assertOk()->json();

        $this->assertContains($product->slug, array_column($hits, 'slug'));
    }

    /** Один символ нічого не звужує й віддав би пів каталогу. */
    public function test_search_ignores_too_short_queries(): void
    {
        $this->getJson('/api/search?q=с')->assertOk()->assertExactJson([]);
    }

    /**
     * Дуже довгий запит відсікається до звернення до бази.
     *
     * Нічого осмисленого він не знайде, а сканування таблиці коштує
     * стільки ж, скільки й для корисного запиту.
     */
    public function test_search_survives_a_very_long_query(): void
    {
        $this->getJson('/api/search?q='.str_repeat('а', 10000))->assertOk();
    }

    /** Невідома мова не має ламати відповідь — просто береться типова. */
    public function test_search_falls_back_to_default_locale(): void
    {
        $this->getJson('/api/search?q=стакан&locale=xx')->assertOk();
    }

    public function test_cart_products_returns_current_prices(): void
    {
        $product = Product::first();

        $this->getJson("/api/cart-products?slugs={$product->slug}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.slug', $product->slug)
            ->assertJsonPath('0.priceRetail', (float) $product->priceRetail);
    }

    /** Порожній або сміттєвий список слагів не має доходити до бази. */
    public function test_cart_products_rejects_malformed_slugs(): void
    {
        $this->getJson('/api/cart-products?slugs=')->assertOk()->assertExactJson([]);
        $this->getJson('/api/cart-products?slugs=../../etc/passwd')->assertOk()->assertExactJson([]);
        $this->getJson("/api/cart-products?slugs=' OR 1=1--")->assertOk()->assertExactJson([]);
    }

    /**
     * Кількість слагів обмежена: інакше одним запитом можна було б
     * витягти весь каталог і навантажити базу.
     */
    public function test_cart_products_caps_the_number_of_slugs(): void
    {
        $slugs = Product::query()->pluck('slug')->take(134)->implode(',');

        $response = $this->getJson("/api/cart-products?slugs={$slugs}")->assertOk();

        $this->assertLessThanOrEqual(100, count($response->json()));
    }
}
