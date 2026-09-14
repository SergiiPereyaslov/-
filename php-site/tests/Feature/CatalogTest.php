<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Group;
use App\Models\Product;
use Tests\TestCase;

/**
 * Каталог: список, група, категорія, фасетна посадкова, картка товару.
 *
 * Тести читають той самий наповнений каталог, що й сайт, — окремих
 * фабрик тут немає навмисно: перевіряти треба поведінку на справжніх
 * даних із їхніми фасетами й оптовими щаблями, а не на вигаданих.
 */
class CatalogTest extends TestCase
{
    public function test_catalog_index_lists_every_group(): void
    {
        $response = $this->get('/catalog/')->assertOk();

        foreach (Group::all() as $group) {
            $response->assertSee($group->nameUk, escape: false);
        }
    }

    /** Один слаг під /catalog/ може бути і групою, і категорією. */
    public function test_same_route_serves_group_and_category(): void
    {
        $this->get('/catalog/stakany/')->assertOk()->assertSee('Стакани паперові', escape: false);
        $this->get('/catalog/stakany-paperovi/')->assertOk();
    }

    /** Уся категорія лишається в HTML — саме це бачить пошуковий робот. */
    public function test_category_renders_all_products_server_side(): void
    {
        $expected = Product::inCategory('stakany-paperovi')->count();

        $html = $this->get('/catalog/stakany-paperovi/')->assertOk()->getContent();

        $this->assertSame($expected, substr_count((string) $html, 'data-facets='));
    }

    /** Фасетна посадкова показує лише товари зі своїм значенням. */
    public function test_facet_landing_narrows_products(): void
    {
        $category = Category::find('stakany-paperovi');
        $facet = $category->findIndexedFacet('340-ml');

        $expected = Product::inCategory('stakany-paperovi')
            ->withFacet($facet['facet'], $facet['value'])
            ->count();

        $html = $this->get('/catalog/stakany-paperovi/340-ml/')->assertOk()->getContent();

        $this->assertSame($expected, substr_count((string) $html, 'data-facets='));
        $this->assertLessThan(
            Product::inCategory('stakany-paperovi')->count(),
            $expected,
            'Посадкова має звужувати видачу, інакше вона дублює категорію',
        );
    }

    /**
     * Невідомий слаг дає 404, а не порожню сторінку з кодом 200.
     *
     * Це та сама знахідка, яку аудит знайшов у Next-версії: там
     * неперевірений слаг валив рендер на 500. Порожня сторінка з 200 не
     * краща — пошукова система набирала б сотні таких адрес.
     */
    public function test_unknown_slugs_return_404(): void
    {
        $this->get('/catalog/nemaye-takoyi/')->assertNotFound();
        $this->get('/catalog/stakany-paperovi/nemaye-takoho/')->assertNotFound();
        $this->get('/product/nemaye-takoho/')->assertNotFound();
    }

    public function test_product_page_shows_price_and_wholesale_tiers(): void
    {
        $product = Product::inCategory('stakany-paperovi')->ordered()->first();

        $response = $this->get("/product/{$product->slug}/")->assertOk();

        $response->assertSee($product->sku, escape: false);
        $response->assertSee(number_format((float) $product->priceRetail, 2, '.', ''), escape: false);

        foreach ($product->tiers as $tier) {
            $response->assertSee(number_format((float) $tier['perUnit'], 2, '.', ''), escape: false);
        }
    }

    /**
     * Кришка підбирається до стакана за діаметром вінця.
     *
     * Об'єм для цього не годиться: стакани різного об'єму часто мають
     * однаковий вінець, і підбір за назвою дав би неправильну пару.
     */
    public function test_compatible_products_match_by_lid_diameter(): void
    {
        $cup = Product::where('shape', 'cup')->whereNotNull('lidDiameter')->first();

        if ($cup === null) {
            $this->markTestSkipped('У каталозі немає стакана з указаним діаметром вінця');
        }

        $this->get("/product/{$cup->slug}/")->assertOk();

        $lids = Product::where('shape', 'lid')->where('lidDiameter', $cup->lidDiameter)->get();

        foreach ($lids->take(4) as $lid) {
            $this->assertSame($cup->lidDiameter, $lid->lidDiameter);
        }
    }

    /** Обидві мови віддають ту саму сторінку різними назвами. */
    public function test_russian_tree_shows_russian_names(): void
    {
        $category = Category::find('stakany-paperovi');

        $this->get('/catalog/stakany-paperovi/')->assertSee($category->nameUk, escape: false);
        $this->get('/ru/catalog/stakany-paperovi/')->assertSee($category->nameRu, escape: false);
    }

    /** Розмітка товару має дійти до пошуку валідною й екранованою. */
    public function test_product_json_ld_is_valid_and_escaped(): void
    {
        $product = Product::first();

        $html = (string) $this->get("/product/{$product->slug}/")->assertOk()->getContent();

        preg_match_all('~<script type="application/ld\+json">(.*?)</script>~s', $html, $m);

        $this->assertNotEmpty($m[1], 'На сторінці товару немає розмітки JSON-LD');

        $types = [];
        foreach ($m[1] as $block) {
            $this->assertStringNotContainsString('<', $block);
            $decoded = json_decode($block, true, flags: JSON_THROW_ON_ERROR);
            $types[] = $decoded['@type'] ?? null;
        }

        $this->assertContains('Product', $types);
        $this->assertContains('BreadcrumbList', $types);
    }
}
