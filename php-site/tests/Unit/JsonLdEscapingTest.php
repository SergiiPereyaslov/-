<?php

namespace Tests\Unit;

use App\Support\Format;
use PHPUnit\Framework\TestCase;

/**
 * Екранування розмітки JSON-LD.
 *
 * Аудит Next-версії знайшов тут справжню діру: JSON.stringify не чіпав
 * «<» і «/», тому текст із адмінки міг закрити тег <script> і відкрити
 * свій. Вміст розмітки береться з бази — назви категорій, питання FAQ, —
 * тож джерело цілком реальне. Тест закриває це на рівні одиниці коду.
 */
class JsonLdEscapingTest extends TestCase
{
    public function test_closing_script_tag_cannot_escape_the_script_element(): void
    {
        $html = Format::jsonLd([
            'name' => 'Стакани</script><script>alert(1)</script>',
        ]);

        $this->assertStringNotContainsString('</script>', $html);
        $this->assertStringNotContainsString('<script>', $html);
    }

    public function test_angle_brackets_and_ampersands_are_escaped(): void
    {
        $html = Format::jsonLd(['name' => '<b>&</b>']);

        foreach (['<', '>', '&'] as $char) {
            $this->assertStringNotContainsString($char, $html);
        }
    }

    /** Екранування не має ламати розмітку для пошукових систем. */
    public function test_result_is_still_valid_json_with_original_values(): void
    {
        $data = ['name' => 'Стакани</script>', 'url' => 'https://smartecopack.com/catalog/'];

        $decoded = json_decode(Format::jsonLd($data), true);

        $this->assertSame($data, $decoded);
    }

    /** Кирилиця лишається читабельною, а не перетворюється на \uXXXX. */
    public function test_cyrillic_is_not_escaped(): void
    {
        $this->assertStringContainsString('Стакани паперові', Format::jsonLd(['name' => 'Стакани паперові']));
    }
}
