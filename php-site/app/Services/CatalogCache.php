<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Скидання кешу після правок у адмінці.
 *
 * У Next-версії роль цього шару грала ревалідація статичних сторінок.
 * Принцип той самий: редактор змінив ціну — сайт має показати її одразу,
 * а не через добу.
 *
 * Інвалідація зроблена через лічильник версії, а не теги кешу. Теги в
 * Laravel підтримують лише Redis і Memcached, а сайту такого розміру
 * жоден із них не потрібен — ставити окремий сервіс заради скидання
 * кешу означало б додати ще одну річ, яка може впасти вночі.
 *
 * Номер версії входить у кожен ключ, тож збільшити його — те саме, що
 * забути весь кеш одразу. Старі записи ніхто не читає, і вони самі
 * зникають за строком життя.
 */
class CatalogCache
{
    private const VERSION_KEY = 'catalog.version';

    /** Поточна версія — частина кожного ключа кешу каталогу. */
    public function version(): int
    {
        return (int) Cache::rememberForever(self::VERSION_KEY, fn (): int => 1);
    }

    /** Ключ із версією: catalog.v3.nav.uk */
    public function key(string $suffix): string
    {
        return 'catalog.v'.$this->version().'.'.$suffix;
    }

    /** Забути все, що залежить від вмісту каталогу. */
    public function flush(): void
    {
        Cache::forever(self::VERSION_KEY, $this->version() + 1);
    }
}
