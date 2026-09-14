<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Заявки, адміністратори та лічильники A/B-тесту.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * Типи-перелічення PostgreSQL, а не текст із перевіркою в коді:
         * база сама не дасть записати стан, якого не існує, і це
         * лишається правдою навіть коли в неї полізуть повз застосунок.
         */
        $this->createEnum('LeadKind', ['quote', 'order', 'branding']);
        $this->createEnum('LeadStatus', ['new', 'in_progress', 'done', 'rejected']);

        Schema::create('leads', function (Blueprint $table) {
            /*
             * text, а не native uuid: так колонка виглядала в базі, яку
             * створювала Prisma, і схема має лишитись однаковою для
             * свіжого встановлення й для перенесеного з Next-версії.
             * Інакше два однакові сайти мали б різні типи ключа.
             */
            $table->text('id')->primary();
            $table->text('number')->unique();
            $table->text('name')->nullable();
            $table->text('phone');
            $table->text('email')->nullable();
            $table->text('company')->nullable();
            $table->text('comment')->nullable();
            $table->text('delivery')->nullable();
            $table->text('customerType')->nullable();
            $table->text('city')->nullable();
            $table->text('requisites')->nullable();
            $table->text('locale')->default('uk');
            $table->text('source')->nullable();
            // Варіант навігації, у якому опинився відвідувач: 'a' | 'b' | null
            $table->string('abVariant', 1)->nullable();
            // [{ sku, name, packs, sum }]
            $table->jsonb('items')->default('[]');
            $table->decimal('total', 10, 2)->nullable();
            // Чи вдалось доставити в Telegram / на пошту
            $table->boolean('notified')->default(false);
            $table->text('notifyError')->nullable();
            $table->text('managerNote')->nullable();
            $table->timestamp('createdAt', 3)->useCurrent();
            $table->timestamp('updatedAt', 3)->useCurrent();
        });

        DB::statement('ALTER TABLE leads ADD COLUMN kind "LeadKind" NOT NULL');
        DB::statement('ALTER TABLE leads ADD COLUMN status "LeadStatus" NOT NULL DEFAULT \'new\'');
        DB::statement('CREATE INDEX leads_status_createdAt_idx ON leads (status, "createdAt")');

        Schema::create('admin_users', function (Blueprint $table) {
            // text — з тієї ж причини, що й у leads
            $table->text('id')->primary();
            $table->text('email')->unique();
            $table->text('name');
            // Колонка зветься так з часів Next-версії; модель показує її
            // стандартній автентифікації через getAuthPassword()
            $table->text('passwordHash');
            /*
             * Захист від перебору пароля на рівні застосунку — другий рубіж
             * поруч із лімітом частоти в nginx. Лічильник обнуляється
             * успішним входом, до lockedUntil вхід відхиляється навіть із
             * правильним паролем.
             */
            $table->integer('failedAttempts')->default(0);
            $table->timestamp('lockedUntil', 3)->nullable();
            $table->timestamp('createdAt', 3)->useCurrent();
        });

        /*
         * Лічильники A/B-тесту навігації, агреговані по днях.
         *
         * Свідомо не зберігається жоден ідентифікатор відвідувача: для
         * рішення потрібні лише суми по варіанту й дню, а зайві
         * персональні дані — це зобов'язання, а не актив.
         */
        Schema::create('ab_stats', function (Blueprint $table) {
            // integer, а не bigint: лічильник по днях і варіантах — це
            // кілька тисяч рядків за все життя сайту
            $table->increments('id');
            $table->string('variant', 1);
            $table->date('day');
            $table->integer('sessions')->default(0);
            $table->integer('catalog')->default(0);
            $table->integer('cart')->default(0);
            $table->integer('search')->default(0);
            $table->integer('leads')->default(0);

            $table->unique(['variant', 'day']);
        });
    }

    /**
     * Створити тип-перелічення, якщо його ще немає.
     *
     * DROP TABLE не прибирає типи, тому після migrate:fresh вони
     * лишаються в базі, і повторний CREATE TYPE падає. Перевірка тут
     * робить міграцію придатною до повторного запуску.
     *
     * @param  list<string>  $values
     */
    private function createEnum(string $name, array $values): void
    {
        $exists = DB::selectOne('SELECT 1 FROM pg_type WHERE typname = ?', [$name]);

        if ($exists !== null) {
            return;
        }

        $list = implode(', ', array_map(fn (string $v): string => "'{$v}'", $values));

        DB::statement("CREATE TYPE \"{$name}\" AS ENUM ({$list})");
    }

    public function down(): void
    {
        Schema::dropIfExists('ab_stats');
        Schema::dropIfExists('admin_users');
        Schema::dropIfExists('leads');
        DB::statement('DROP TYPE IF EXISTS "LeadStatus"');
        DB::statement('DROP TYPE IF EXISTS "LeadKind"');
    }
};
