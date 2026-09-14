<?php

namespace App\Support;

use App\Models\Product;

/**
 * Рядок для пошуку по каталогу.
 *
 * Збирається застосунком і зберігається в колонці, а не будується
 * запитом lower() на льоту. Причина конкретна: приведення до нижнього
 * регістру в PostgreSQL залежить від локалі кластера, а при LC_CTYPE=C
 * кирилиця не приводиться взагалі — пошук мовчки перестав би знаходити
 * половину каталогу на сервері з іншими налаштуваннями.
 *
 * У рядок ідуть назви обома мовами, артикул, розмір і значення фасетів:
 * половина аудиторії набирає запит російською незалежно від версії
 * сайту, а частина шукає за артикулом із рахунку.
 */
class SearchText
{
    public static function for(Product $product): string
    {
        $parts = [
            $product->nameUk,
            $product->nameRu,
            $product->specUk,
            $product->specRu,
            $product->sku,
        ];

        foreach ($product->facets ?? [] as $value) {
            $parts[] = (string) $value;
        }

        $text = implode(' ', array_filter(array_map('trim', $parts)));

        return mb_strtolower(preg_replace('/\s+/u', ' ', $text) ?? $text);
    }
}
