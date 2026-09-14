<?php

namespace App\Support;

/**
 * Побудова адрес сайту.
 *
 * Чому не route() і не url(): генератор URL Laravel зрізає завершальний
 * слеш, а канонічна форма адрес цього сайту — саме зі слешем. Якби
 * посилання в розмітці вели на версію без слеша, кожен внутрішній перехід
 * коштував би зайвий 301, і пошуковий робот обходив би сайт удвічі довше.
 *
 * Мовний префікс теж додається тут, а не в кожному шаблоні: українська
 * версія живе в корені, російська — під /ru.
 */
class Url
{
    /**
     * Внутрішнє посилання з мовним префіксом і завершальним слешем.
     *
     * @param  string  $path  шлях без мовного префікса, наприклад /catalog/
     * @param  string|null  $locale  мова; за замовчуванням — поточна
     */
    public static function to(string $path = '/', ?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        $prefix = $locale === 'ru' ? '/ru' : '';

        return $prefix.self::withSlash($path);
    }

    /**
     * Абсолютна адреса для canonical, hreflang, sitemap і розмітки.
     *
     * Домен береться з SITE_URL і читається під час запиту. У Next-версії
     * він вшивався у збірку, і зміна домену вимагала перезбірки всього
     * сайту — тут достатньо змінити змінну оточення.
     */
    public static function canonical(string $path = '/', ?string $locale = null): string
    {
        return rtrim(config('site.url'), '/').self::to($path, $locale);
    }

    /** Нормалізує шлях до вигляду /щось/ — з провідним і завершальним слешем. */
    public static function withSlash(string $path): string
    {
        if ($path === '' || $path === '/') {
            return '/';
        }

        return '/'.trim($path, '/').'/';
    }
}
