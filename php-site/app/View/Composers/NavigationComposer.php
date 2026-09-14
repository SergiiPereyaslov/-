<?php

namespace App\View\Composers;

use App\Models\Group;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

/**
 * Структура каталогу для шапки й підвалу.
 *
 * Живе в композері, а не в кожному контролері: меню однакове на всіх
 * сторінках, і передавати його вручну з двох десятків місць означало б
 * рано чи пізно забути.
 */
class NavigationComposer
{
    /** Меню каталогу не змінюється роками; добу тримати безпечно. */
    private const TTL_SECONDS = 86400;

    public function compose(View $view): void
    {
        $view->with('navGroups', $this->tree(app()->getLocale()));
    }

    /**
     * Меню як простий масив, а не колекція моделей.
     *
     * Кешувати моделі тут було б двічі невдало. По-перше, у кеш поїхали б
     * усі jsonb-поля кожної категорії — SEO-тексти, FAQ, визначення
     * фасетів, — тобто десятки кілобайт заради меню з самих назв.
     * По-друге, серіалізована модель при розпакуванні потребує свого
     * класу; варто цьому збігтись невдало — і замість колекції
     * повертається __PHP_Incomplete_Class, а сторінка падає.
     *
     * Масив із двох полів позбавлений обох проблем.
     *
     * @return list<array{slug: string, name: string, categories: list<array{slug: string, name: string}>}>
     */
    private function tree(string $locale): array
    {
        return Cache::remember("nav.{$locale}", self::TTL_SECONDS, function (): array {
            $groups = Group::query()
                ->select(['slug', 'nameUk', 'nameRu', 'sortOrder'])
                ->with(['categories' => fn ($q) => $q
                    ->select(['slug', 'groupSlug', 'nameUk', 'nameRu', 'sortOrder'])
                    ->orderBy('sortOrder')])
                ->orderBy('sortOrder')
                ->get();

            return $groups->map(fn (Group $group): array => [
                'slug' => $group->slug,
                'name' => $group->name,
                'categories' => $group->categories
                    ->map(fn ($category): array => [
                        'slug' => $category->slug,
                        'name' => $category->name,
                    ])
                    ->all(),
            ])->all();
        });
    }
}
