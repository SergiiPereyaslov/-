<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Наповнення каталогу.
 *
 * Дані лежать готовими фікстурами, а не генеруються: це не демонстраційний
 * набір, а справжній каталог — 6 груп, 32 категорії, 134 товари й 10 статей
 * із написаними SEO-текстами. Вигадати їх наново неможливо, тому вони
 * їдуть разом із кодом.
 *
 * Порядок таблиць визначений зовнішніми ключами: категорія посилається на
 * групу, товар — на категорію.
 */
class CatalogSeeder extends Seeder
{
    /** Таблиці в порядку, який не порушує зовнішні ключі. */
    private const TABLES = ['groups', 'categories', 'products', 'posts'];

    public function run(): void
    {
        foreach (self::TABLES as $table) {
            $rows = $this->rows($table);

            /*
             * upsert, а не insert: сідер має бути безпечним для повторного
             * запуску. Оновлення каталогу на бойовому сервері — це той
             * самий сідер, і він не повинен падати на вже наявних слагах.
             */
            DB::table($table)->upsert($rows, ['slug']);

            $this->command?->info(sprintf('  %s: %d', $table, count($rows)));
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function rows(string $table): array
    {
        $path = __DIR__."/data/{$table}.json";

        if (! is_file($path)) {
            throw new RuntimeException("Немає фікстури {$path}");
        }

        $rows = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

        return array_map($this->encodeComplexColumns(...), $rows);
    }

    /**
     * Підготувати рядок до запису.
     *
     * json_decode розгорнув колонки jsonb у масиви PHP, а драйвер очікує
     * рядок — тож пакуємо назад. Масив text[] (posts.related) вимагає
     * власного синтаксису PostgreSQL, який json_encode не дає.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function encodeComplexColumns(array $row): array
    {
        foreach ($row as $column => $value) {
            if (! is_array($value)) {
                continue;
            }

            $row[$column] = $column === 'related'
                ? '{'.implode(',', array_map(fn ($v) => '"'.addcslashes((string) $v, '"\\').'"', $value)).'}'
                : json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        return $row;
    }
}
