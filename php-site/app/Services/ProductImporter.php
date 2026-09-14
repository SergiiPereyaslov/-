<?php

namespace App\Services;

use App\Models\Product;
use App\Support\SearchText;
use Illuminate\Support\Str;

/**
 * Розбір CSV каталогу.
 *
 * Формат перенесено з Next-версії разом із його поблажливістю: заголовки
 * приймаються двома мовами й у будь-якому регістрі, розділювач
 * визначається сам. Причина проста — файл готує не розробник, а
 * менеджер у звичайному табличному редакторі, і вимагати від нього
 * точних технічних назв колонок означало б робити імпорт непридатним.
 */
class ProductImporter
{
    /** Форми заглушок, які вміє малювати сайт. */
    private const SHAPES = ['cup', 'lid', 'sleeve', 'holder', 'straw', 'box', 'round', 'bag', 'flat'];

    /**
     * @param  list<string>  $knownCategories
     * @return array{products: list<array<string, mixed>>, errors: list<string>, warnings: list<string>}
     */
    public function parse(string $csv, array $knownCategories): array
    {
        $rows = $this->rows($csv);

        if ($rows === []) {
            return ['products' => [], 'errors' => ['У файлі немає рядків з даними.'], 'warnings' => []];
        }

        $products = [];
        $errors = [];
        $warnings = [];
        $seenSlugs = [];

        foreach ($rows as $line => $row) {
            $number = $line + 2; // +1 за заголовок, +1 бо рядки з одиниці

            $sku = $this->pick($row, 'артикул', 'sku');
            $nameUk = $this->pick($row, 'назваuk', 'назва', 'nameuk', 'name');
            $category = $this->pick($row, 'категорія', 'category');
            $unitsPerPack = (int) $this->number($this->pick($row, 'впачці', 'unitsperpack', 'pack'));
            $price = $this->number($this->pick($row, 'ціна', 'price'));

            if ($sku === '' || $nameUk === '') {
                $errors[] = "Рядок {$number}: немає артикула або назви";

                continue;
            }

            if (! in_array($category, $knownCategories, true)) {
                $errors[] = "Рядок {$number}: невідома категорія «{$category}»";

                continue;
            }

            if ($unitsPerPack < 1) {
                $errors[] = "Рядок {$number}: некоректна кількість у пачці";

                continue;
            }

            if ($price <= 0) {
                $errors[] = "Рядок {$number}: некоректна ціна";

                continue;
            }

            $slug = $this->slug($this->pick($row, 'слаг', 'слагтовару', 'url', 'посилання', 'slug', 'link'), $nameUk);

            if (isset($seenSlugs[$slug])) {
                $errors[] = "Рядок {$number}: слаг «{$slug}» уже є в рядку {$seenSlugs[$slug]}";

                continue;
            }

            $seenSlugs[$slug] = $number;

            if ($this->pick($row, 'слаг', 'слагтовару', 'url', 'посилання', 'slug', 'link') === '') {
                // Товар імпортується, але втрачає стару адресу — саме те,
                // через що можна непомітно втратити позиції в пошуку
                $warnings[] = "Рядок {$number}: слага немає, згенеровано «{$slug}»";
            }

            $specUk = $this->pick($row, 'розмірuk', 'розмір', 'specuk', 'spec');
            $descUk = $this->pick($row, 'описuk', 'опис', 'descriptionuk', 'description');
            $shape = $this->pick($row, 'форма', 'shape');
            $lidDiameter = (int) $this->number($this->pick($row, 'діаметр', 'liddiameter'));
            $priceOpt = $this->number($this->pick($row, 'цінаопт', 'priceopt'));

            $product = [
                'slug' => $slug,
                'sku' => $sku,
                'categorySlug' => $category,
                'nameUk' => $nameUk,
                'nameRu' => $this->pick($row, 'назваru', 'nameru') ?: $nameUk,
                'specUk' => $specUk,
                'specRu' => $this->pick($row, 'розмірru', 'specru') ?: $specUk,
                'descriptionUk' => $descUk,
                'descriptionRu' => $this->pick($row, 'описru', 'descriptionru') ?: $descUk,
                'facets' => $this->facets($this->pick($row, 'фасети', 'facets')),
                'attributes' => [],
                'unitsPerPack' => $unitsPerPack,
                'priceRetail' => round($price, 2),
                'tiers' => $priceOpt > 0
                    ? [['minPacks' => config('site.wholesale_from_packs'), 'perUnit' => round($priceOpt, 2)]]
                    : [],
                'inStock' => $this->boolean($this->pick($row, 'наявність', 'instock'), true),
                'brandable' => $this->boolean($this->pick($row, 'логотип', 'brandable'), false),
                'featured' => false,
                'shape' => in_array($shape, self::SHAPES, true) ? $shape : 'box',
                'lidDiameter' => $lidDiameter > 0 ? $lidDiameter : null,
                'image' => $this->pick($row, 'фото', 'image') ?: null,
            ];

            $product['searchText'] = SearchText::for(new Product($product));

            $products[] = $product;
        }

        return ['products' => $products, 'errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Рядки файлу з нормалізованими назвами колонок.
     *
     * @return list<array<string, string>>
     */
    private function rows(string $csv): array
    {
        $csv = preg_replace('/^\x{FEFF}/u', '', $csv) ?? $csv;
        $lines = preg_split('/\r\n|\r|\n/', trim($csv)) ?: [];

        if ($lines === []) {
            return [];
        }

        /*
         * Розділювач визначається за заголовком: українська локаль Excel
         * зберігає CSV із крапкою з комою, а не з комою, і файл із неї
         * інакше розібрався б як один стовпець.
         */
        $head = $lines[0];
        $delimiter = substr_count($head, ';') > substr_count($head, ',') ? ';' : ',';

        $header = array_map(
            fn (string $h): string => preg_replace('/[\s_-]+/u', '', mb_strtolower(trim($h))) ?? '',
            str_getcsv($head, $delimiter, '"', '\\'),
        );

        $rows = [];

        foreach (array_slice($lines, 1) as $line) {
            if (trim($line) === '') {
                continue;
            }

            $values = str_getcsv($line, $delimiter, '"', '\\');
            $row = [];

            foreach ($header as $i => $name) {
                $row[$name] = trim((string) ($values[$i] ?? ''));
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /** @param  array<string, string>  $row */
    private function pick(array $row, string ...$names): string
    {
        foreach ($names as $name) {
            if (($row[$name] ?? '') !== '') {
                return $row[$name];
            }
        }

        return '';
    }

    private function number(string $value): float
    {
        return (float) str_replace([',', ' ', "\u{00A0}"], ['.', '', ''], $value);
    }

    private function boolean(string $value, bool $default): bool
    {
        if ($value === '') {
            return $default;
        }

        return in_array(mb_strtolower($value), ['так', 'да', 'yes', 'y', '1', 'true', '+'], true);
    }

    /**
     * Слаг зі старого посилання або з назви.
     *
     * Збереження старого слага — найважливіша частина імпорту: саме він
     * тримає позицію сторінки в пошуку.
     */
    private function slug(string $raw, string $fallback): string
    {
        if ($raw === '') {
            return Str::slug($fallback);
        }

        // Приймаємо і повний URL, і сам слаг
        $path = parse_url($raw, PHP_URL_PATH) ?: $raw;
        $last = basename(rtrim(explode('?', $path)[0], '/'));

        return Str::slug($last) ?: Str::slug($fallback);
    }

    /**
     * Фасети у форматі «volume=340;color=kraft».
     *
     * @return array<string, string>
     */
    private function facets(string $raw): array
    {
        $out = [];

        foreach (explode(';', $raw) as $pair) {
            [$key, $value] = array_pad(explode('=', $pair, 2), 2, null);

            $key = trim((string) $key);
            $value = trim((string) $value);

            if ($key !== '' && $value !== '') {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
