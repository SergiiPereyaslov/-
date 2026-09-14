<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RuntimeException;

/**
 * Малює зображення для соцмереж — по одному на мову.
 *
 * Картинки генеруються цією командою й лежать у репозиторії готовими, а
 * не малюються на кожен запит. Причини дві: на бойовому сервері може не
 * бути потрібного шрифту, і тоді сторінка мовчки віддавала б порожній
 * прямокутник; а ще кожна генерація — це робота процесора заради
 * зображення, яке змінюється раз на рік.
 *
 * Запускати після зміни слогана або палітри:
 *   php artisan site:og
 */
class GenerateOgImages extends Command
{
    protected $signature = 'site:og';

    protected $description = 'Згенерувати зображення для соцмереж (public/images/og-*.png)';

    /** Розмір, який очікують Facebook, LinkedIn і Telegram. */
    private const WIDTH = 1200;

    private const HEIGHT = 630;

    /** Шрифти шукаємо серед типових шляхів; без них команда чесно падає. */
    private const FONT_CANDIDATES = [
        'bold' => [
            '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
        ],
        'regular' => [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        ],
    ];

    public function handle(): int
    {
        $bold = $this->font('bold');
        $regular = $this->font('regular');

        foreach (config('site.locales') as $locale) {
            $path = public_path("images/og-{$locale}.png");

            $this->draw($locale, $bold, $regular, $path);

            $this->components->info("{$locale}: ".str_replace(public_path(), 'public', $path));
        }

        return self::SUCCESS;
    }

    private function font(string $kind): string
    {
        foreach (self::FONT_CANDIDATES[$kind] as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        throw new RuntimeException("Не знайдено шрифт ({$kind}). Установіть fonts-dejavu-core.");
    }

    /** Найбільший кегль, за якого рядок ще вкладається в задану ширину. */
    private function fitSize(string $text, string $font, int $maxWidth, int $start): int
    {
        for ($size = $start; $size > 12; $size--) {
            $box = imagettfbbox($size, 0, $font, $text);

            if ($box !== false && ($box[2] - $box[0]) <= $maxWidth) {
                return $size;
            }
        }

        return 12;
    }

    private function draw(string $locale, string $bold, string $regular, string $path): void
    {
        $image = imagecreatetruecolor(self::WIDTH, self::HEIGHT);

        // Темно-зелена смуга бренду — та сама, що в шапці й підвалі сайту
        $deep = imagecolorallocate($image, 0x28, 0x40, 0x1F);
        $light = imagecolorallocate($image, 0xF1, 0xF3, 0xEA);
        $accent = imagecolorallocate($image, 0x6E, 0xA7, 0x7C);

        imagefilledrectangle($image, 0, 0, self::WIDTH, self::HEIGHT, $deep);

        $title = $locale === 'ru'
            ? 'Бумажная упаковка для еды'
            : 'Паперова упаковка для їжі';

        $subtitle = $locale === 'ru'
            ? 'Опт от 10 пачек · Доставка по Днепру за 24 часа'
            : 'Опт від 10 пачок · Доставка по Дніпру за 24 години';

        /*
         * Розмір підбирається під ширину, а не задається наперед:
         * російський і український заголовки різної довжини, і фіксований
         * кегль обрізав би один із них. Мовчазна обрізка тут особливо
         * прикра — картинку видно лише в чужій стрічці, де помилку вже
         * не виправити.
         */
        $margin = 90;
        $maxWidth = self::WIDTH - $margin * 2;

        imagettftext($image, $this->fitSize($title, $bold, $maxWidth, 58), 0, $margin, 250, $light, $bold, $title);
        imagettftext($image, $this->fitSize($subtitle, $regular, $maxWidth, 30), 0, $margin, 330, $accent, $regular, $subtitle);
        imagettftext($image, 34, 0, $margin, 520, $light, $bold, config('site.name'));
        imagettftext($image, 22, 0, $margin, 565, $accent, $regular, config('site.tagline'));

        // Акцентна смуга знизу — щоб картинка читалась як картка бренду
        imagefilledrectangle($image, 0, self::HEIGHT - 12, self::WIDTH, self::HEIGHT, $accent);

        imagepng($image, $path, 9);
        imagedestroy($image);
    }
}
