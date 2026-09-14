<?php

namespace App\Models\Concerns;

/**
 * Двомовні поля каталогу.
 *
 * У базі кожне таке поле лежить двома колонками — nameUk і nameRu. Схема
 * успадкована від Next-версії і навмисно не переробляється: дані переїхали
 * без конвертації, а окремі колонки читаються швидше за таблицю перекладів
 * із джойном на кожен запит.
 *
 * Модель поверх цього дає одну властивість: $product->name віддає потрібну
 * мову за поточною локаллю, тож у шаблонах немає жодного if.
 */
trait HasBilingualFields
{
    /** Суфікс колонки для поточної локалі. */
    protected function langSuffix(): string
    {
        return app()->getLocale() === 'ru' ? 'Ru' : 'Uk';
    }

    /** Значення двомовного поля: localized('name') → nameUk або nameRu. */
    protected function localized(string $base): string
    {
        return (string) ($this->getAttribute($base.$this->langSuffix()) ?? '');
    }

    /**
     * Значення з JSON-структури виду {"uk": "…", "ru": "…"}.
     *
     * Українська — запасний варіант: у імпортованому контенті російський
     * переклад може бути порожнім, і краще показати текст іншою мовою,
     * ніж порожнє місце.
     *
     * @param  array<string, mixed>|null  $pair
     */
    protected function pickLang(?array $pair): string
    {
        if ($pair === null) {
            return '';
        }

        $key = app()->getLocale() === 'ru' ? 'ru' : 'uk';

        return (string) ($pair[$key] ?? $pair['uk'] ?? '');
    }
}
