<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Канонічна форма адреси й редиректи зі старого сайту.
 *
 * Це найдорожча частина міграції: кожен старий URL — накопичена позиція
 * в пошуку. Тест закриває три речі, які легко зламати непомітно:
 * завершальний слеш, ОДИН хоп замість ланцюжка й мовні префікси.
 */
class CanonicalUrlTest extends TestCase
{
    /** Адреса без завершального слеша веде на канонічну зі слешем. */
    public function test_trailing_slash_is_added(): void
    {
        $this->get('/catalog/stakany-paperovi')
            ->assertStatus(301)
            ->assertHeader('Location', 'http://localhost/catalog/stakany-paperovi/');
    }

    /** Канонічна адреса не редиректить сама на себе. */
    public function test_canonical_url_is_served_directly(): void
    {
        $this->get('/catalog/stakany-paperovi/')->assertOk();
    }

    /**
     * Старий URL веде на новий за ОДИН хоп.
     *
     * Ціль обов'язково зі слешем: інакше відвідувач і пошуковий робот
     * отримали б 301 на адресу, яка сама віддає ще один 301.
     */
    #[DataProvider('legacyUrls')]
    public function test_legacy_url_redirects_in_one_hop(string $old, string $new): void
    {
        $response = $this->get($old);

        $response->assertStatus(301)->assertHeader('Location', 'http://localhost'.$new);

        $this->assertStringEndsWith('/', $new, 'Ціль редиректу має бути канонічною, зі слешем');
    }

    /** @return array<string, array{string, string}> */
    public static function legacyUrls(): array
    {
        return [
            'категорія зі старим слагом' => ['/catalog/stakani-paperovi', '/catalog/stakany-paperovi/'],
            'слаг з великої літери' => ['/catalog/Lanch-box', '/catalog/lanch-boksy/'],
            'товар переїхав з /products/' => ['/products/stakan-110', '/product/stakan-110/'],
            'стаття блогу' => ['/news/druk-na-paperovih-upakovkah', '/blog/druk-na-paperovykh-stakanchykakh/'],
            'стаття без свого матеріалу' => ['/news/eko-pakuvannya-j-vazhlivi-dribnichki', '/blog/'],
            'сторінка контактів' => ['/contact', '/kontakty/'],
            'функція старого рушія' => ['/wishlist', '/catalog/'],
        ];
    }

    /**
     * Транзитивні правила теж дають один хоп.
     *
     * /catalog/upakovka-dlya-fast-fudu/page-all спершу втрачає page-all,
     * а потім перетворюється на новий слаг категорії — обидва кроки
     * застосовуються до відповіді, а не по одному на запит.
     */
    #[DataProvider('transitiveUrls')]
    public function test_transitive_rules_collapse_to_one_hop(string $old, string $new): void
    {
        $this->get($old)
            ->assertStatus(301)
            ->assertHeader('Location', 'http://localhost'.$new);
    }

    /** @return array<string, array{string, string}> */
    public static function transitiveUrls(): array
    {
        return [
            'пагінація + новий слаг' => ['/catalog/upakovka-dlya-fast-fudu/page-all', '/catalog/fastfud/'],
            'фільтр + пагінація' => ['/all-products/filter-aktsiyni/page-2', '/catalog/'],
            'сторінка каталогу' => ['/catalog/stakani-gofrovani/page-3', '/catalog/stakany-gofrovani/'],
        ];
    }

    /** Російська версія живе під /ru і віддається напряму. */
    public function test_russian_tree_is_served(): void
    {
        $this->get('/ru/catalog/stakany-paperovi/')->assertOk();
    }

    /** /uk — технічний шлях: канонічна українська версія в корені. */
    public function test_uk_prefix_redirects_to_root(): void
    {
        $this->get('/uk/catalog/stakany-paperovi/')
            ->assertStatus(301)
            ->assertHeader('Location', 'http://localhost/catalog/stakany-paperovi/');
    }

    /** Правила однакові для обох мов, префікс лишається на місці. */
    public function test_legacy_rules_apply_inside_russian_tree(): void
    {
        $this->get('/ru/catalog/stakani-paperovi')
            ->assertStatus(301)
            ->assertHeader('Location', 'http://localhost/ru/catalog/stakany-paperovi/');
    }

    /** Мітки кампаній не мають губитись на редиректі. */
    public function test_query_string_survives_redirect(): void
    {
        $this->get('/contact?utm_source=google&utm_campaign=brand')
            ->assertStatus(301)
            ->assertHeader('Location', 'http://localhost/kontakty/?utm_source=google&utm_campaign=brand');
    }

    /** Локаль визначається префіксом, а не заголовком браузера. */
    public function test_locale_follows_url_prefix(): void
    {
        $this->get('/catalog/stakany-paperovi/')->assertSee('uk');
        $this->get('/ru/catalog/stakany-paperovi/')->assertSee('ru');
    }

    /**
     * Мапа редиректів — звичайний масив PHP, тож звернення до ключів
     * на кшталт constructor чи __proto__ не дає нічого особливого.
     * Перевірка лишається як запобіжник на випадок переходу на об'єкт.
     */
    public function test_prototype_like_keys_are_not_special(): void
    {
        foreach (['/constructor', '/__proto__', '/toString'] as $path) {
            $location = $this->get($path)->headers->get('Location');

            $this->assertStringStartsWith('http://localhost/', (string) $location);
            $this->assertStringNotContainsString('evil', (string) $location);
        }
    }
}
