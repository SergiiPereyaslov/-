<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Схема каталогу.
 *
 * Повторює структуру, яку раніше створювала Prisma: сайт переїхав з Next
 * на Laravel разом із базою, і дані переносити не довелось. Звідси
 * особливості, незвичні для Laravel: слаг як первинний ключ, колонки в
 * camelCase і timestamp без часової зони.
 *
 * Міняти їх на звичні snake_case означало б переписувати всі дані —
 * заради косметики, яка нічого не дає.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->text('slug')->primary();
            $table->text('nameUk');
            $table->text('nameRu');
            $table->text('h1Uk');
            $table->text('h1Ru');
            $table->text('introUk');
            $table->text('introRu');
            // Абзаци SEO-тексту: [{ uk, ru }]
            $table->jsonb('seo')->default('[]');
            $table->integer('sortOrder')->default(0);
            $table->timestamp('createdAt', 3)->useCurrent();
            $table->timestamp('updatedAt', 3)->useCurrent();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->text('slug')->primary();
            $table->text('groupSlug');
            $table->text('nameUk');
            $table->text('nameRu');
            $table->text('h1Uk');
            $table->text('h1Ru');
            $table->text('introUk');
            $table->text('introRu');
            $table->jsonb('seo')->default('[]');
            // [{ q: { uk, ru }, a: { uk, ru } }]
            $table->jsonb('faq')->default('[]');
            // Визначення фасетів; ті, що з indexed: true, дають власні URL
            $table->jsonb('facets')->default('[]');
            $table->integer('sortOrder')->default(0);
            $table->timestamp('createdAt', 3)->useCurrent();
            $table->timestamp('updatedAt', 3)->useCurrent();

            $table->index('groupSlug');
            // restrict, а не cascade: видалення групи не має тихо забрати
            // з собою категорії з усім їхнім SEO-текстом
            $table->foreign('groupSlug')->references('slug')->on('groups')->restrictOnDelete();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->text('slug')->primary();
            $table->text('sku')->unique();
            $table->text('categorySlug');
            $table->text('nameUk');
            $table->text('nameRu');
            $table->text('specUk')->default('');
            $table->text('specRu')->default('');
            $table->text('descriptionUk')->default('');
            $table->text('descriptionRu')->default('');
            // [{ label: { uk, ru }, value: { uk, ru } }]
            $table->jsonb('attributes')->default('[]');
            // Значення фасетів: { volume: "340", color: "kraft" }
            $table->jsonb('facets')->default('{}');
            $table->integer('unitsPerPack');
            // Гроші — decimal, не float: копійки не мають губитись на округленні
            $table->decimal('priceRetail', 10, 2);
            // Оптові щаблі: [{ minPacks, perUnit }]
            $table->jsonb('tiers')->default('[]');
            $table->boolean('inStock')->default(true);
            $table->boolean('brandable')->default(false);
            $table->boolean('featured')->default(false);
            // Силует заглушки, поки немає фото: cup | lid | box | bag | …
            $table->text('shape')->default('box');
            // Діаметр вінця — основа сумісності стакан ↔ кришка
            $table->integer('lidDiameter')->nullable();
            $table->text('image')->nullable();
            /*
             * Нормалізований у нижній регістр текст для пошуку. Заповнюється
             * застосунком, а не запитом lower(): інакше пошук залежав би від
             * локалі кластера, а при LC_CTYPE=C кирилиця до нижнього регістру
             * не приводиться взагалі.
             */
            $table->text('searchText')->default('');
            $table->integer('sortOrder')->default(0);
            $table->timestamp('createdAt', 3)->useCurrent();
            $table->timestamp('updatedAt', 3)->useCurrent();

            $table->index('categorySlug');
            $table->index('featured');
            $table->index('lidDiameter');
            $table->index('searchText');
            $table->foreign('categorySlug')->references('slug')->on('categories')->restrictOnDelete();
        });

        Schema::create('posts', function (Blueprint $table) {
            $table->text('slug')->primary();
            $table->timestamp('publishedAt', 3);
            $table->text('titleUk');
            $table->text('titleRu');
            $table->text('excerptUk');
            $table->text('excerptRu');
            // Абзаци: [{ uk, ru }]; рядок із «## » стає підзаголовком
            $table->jsonb('body')->default('[]');
            $table->boolean('published')->default(true);
            $table->timestamp('createdAt', 3)->useCurrent();
            $table->timestamp('updatedAt', 3)->useCurrent();

            $table->index(['published', 'publishedAt']);
        });

        // text[], а не jsonb: слаги категорій для перелінковки, і масив
        // PostgreSQL дає оператор ANY() замість перебору JSON
        DB::statement('ALTER TABLE posts ADD COLUMN related text[] DEFAULT ARRAY[]::text[]');
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('posts');
    }
};
