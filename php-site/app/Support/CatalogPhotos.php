<?php

namespace App\Support;

/**
 * Реальні фото зі старого сайту, розкладені по категоріях під час імпорту.
 *
 * Не прив'язані до конкретних артикулів демо-каталогу, тому не несуть ні
 * ціни, ні характеристик — лише візуальний доказ, що товар справді є.
 */
class CatalogPhotos
{
    /**
     * Фото категорії, відсортовані за іменем файлу.
     *
     * Слаг береться з уже розв'язаної таксономії, а не з адреси напряму,
     * і все ж проходить перевірку: якби сюди колись потрапив слаг із
     * «..», readdir видав би вміст чужої теки. Дешева перевірка на межі
     * коштує менше за припущення про всіх майбутніх викликачів.
     *
     * @return list<string>
     */
    public static function for(string $categorySlug): array
    {
        if (! preg_match('/^[a-z0-9-]+$/', $categorySlug)) {
            return [];
        }

        $dir = public_path("images/catalog/{$categorySlug}");

        if (! is_dir($dir)) {
            return [];
        }

        $files = array_values(array_filter(
            scandir($dir) ?: [],
            fn (string $file): bool => str_ends_with($file, '.webp'),
        ));

        sort($files);

        return array_map(
            fn (string $file): string => "/images/catalog/{$categorySlug}/{$file}",
            $files,
        );
    }
}
