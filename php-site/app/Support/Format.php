<?php

namespace App\Support;

/**
 * Форматування значень, які показуються відвідувачу.
 */
class Format
{
    /** Телефон у вигляді +38 (050) 280 40 50. */
    public static function phone(string $raw): string
    {
        return preg_replace(
            '/^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/',
            '+38 ($1) $2 $3 $4',
            $raw,
        ) ?? $raw;
    }

    /** Ціна з двома знаками й нерозривним пробілом перед гривнею. */
    public static function price(float|string $value): string
    {
        return number_format((float) $value, 2, ',', ' ')."\u{00A0}грн";
    }

    /**
     * Екранування JSON для вставки всередину тега <script>.
     *
     * json_encode не чіпає «<», «>» і «/», а браузер шукає рядок
     * «</script>» незалежно від того, що той лежить усередині рядка JSON.
     * Значення для розмітки беруться з бази — назви категорій, питання
     * FAQ, — тож текст, введений в адмінці, міг би закрити тег і відкрити
     * свій. Ця саме вада знайшлась аудитом Next-версії.
     *
     * Прапорці json_encode роблять те саме на рівні кодувальника, тож
     * екранування не залежить від того, чи хтось згодом додасть сюди
     * власну обробку рядка.
     *
     * @param  array<mixed>  $data
     */
    public static function jsonLd(array $data): string
    {
        return json_encode(
            $data,
            JSON_UNESCAPED_UNICODE
            | JSON_HEX_TAG      // < і > → <, >
            | JSON_HEX_AMP      // & → &
            | JSON_HEX_APOS     // ' → '
            | JSON_HEX_QUOT,    // " → "
        ) ?: '{}';
    }
}
