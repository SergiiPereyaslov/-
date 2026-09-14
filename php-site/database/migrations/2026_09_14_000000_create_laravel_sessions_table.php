<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Сесії Laravel.
 *
 * Назва таблиці — laravel_sessions, а не стандартна sessions: у цій же базі
 * лишається таблиця sessions від Next-версії сайту, і обидва застосунки
 * мають працювати паралельно, поки перехід не завершено.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laravel_sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            /*
             * Рядок, а не foreignId: ідентифікатори адміністраторів —
             * UUID, успадковані від Next-версії. Числова колонка тут
             * валила б будь-який запит із відкритою сесією.
             */
            $table->string('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laravel_sessions');
    }
};
