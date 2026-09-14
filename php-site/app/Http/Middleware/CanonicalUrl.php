<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Канонічна форма адреси й 301 зі старих URL.
 *
 * Порядок кроків тут не випадковий. Редирект зі старого URL застосовується
 * ДО нормалізації завершального слеша: інакше /catalog/stakani-paperovi
 * спершу отримав би 301 на версію зі слешем, а вже потім — 301 на новий
 * слаг. Два хопи замість одного помітно псують і швидкість, і те, як
 * пошукова система переносить вагу сторінки.
 *
 * Мовний префікс знімається перед пошуком у мапі й повертається на місце
 * після: правила однакові для обох мов, тримати їх у двох копіях означало б
 * рано чи пізно розійтись.
 */
class CanonicalUrl
{
    /** Шляхи, яких нормалізація не стосується взагалі. */
    private const SKIP_PREFIXES = ['/api/', '/build/', '/storage/', '/.well-known/'];

    public function handle(Request $request, Closure $next): Response
    {
        $path = '/'.ltrim($request->getPathInfo(), '/');

        if ($this->shouldSkip($path)) {
            return $next($request);
        }

        // Адмінка живе поза мовними деревами: жодних legacy-правил і локалей,
        // лише слеш, щоб адреси лишались стабільними.
        if ($path === '/admin' || str_starts_with($path, '/admin/')) {
            return str_ends_with($path, '/')
                ? $next($request)
                : $this->redirect($request, $path.'/');
        }

        $isRu = $path === '/ru' || str_starts_with($path, '/ru/');
        $isUk = $path === '/uk' || str_starts_with($path, '/uk/');
        $prefix = $isRu ? '/ru' : '';
        $bare = ($isRu || $isUk) ? (substr($path, 3) ?: '/') : $path;

        if ($target = $this->legacyTarget($bare)) {
            return $this->redirect($request, $prefix.$target);
        }

        // /uk/… — технічний шлях: канонічна українська версія живе в корені
        if ($isUk) {
            return $this->redirect($request, str_ends_with($bare, '/') ? $bare : $bare.'/');
        }

        if (! str_ends_with($path, '/')) {
            return $this->redirect($request, $path.'/');
        }

        app()->setLocale($isRu ? 'ru' : 'uk');

        return $next($request);
    }

    private function shouldSkip(string $path): bool
    {
        if (str_contains(basename($path), '.')) {
            return true;
        }

        foreach (self::SKIP_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 301 на вказаний шлях.
     *
     * Адреса збирається вручну, а не через redirect()/url(): генератор URL
     * Laravel зрізає завершальний слеш, і ціль /catalog/fastfud/ поїхала б
     * як /catalog/fastfud — а це вже наступний 301, який знову додає слеш.
     * Старий URL отримав би два хопи замість одного, і сенс мапи редиректів
     * втрачався б саме там, де він найпотрібніший.
     *
     * Рядок запиту зберігається дослівно: getQueryString() переставляє
     * параметри за абеткою, і посилання з рекламного кабінету поверталося б
     * зміненим. Для звірки з логами кампаній адреса має лишатись такою,
     * якою її відкрив відвідувач.
     */
    private function redirect(Request $request, string $path): RedirectResponse
    {
        $query = (string) $request->server->get('QUERY_STRING', '');

        return new RedirectResponse(
            $request->getSchemeAndHttpHost().$path.($query ? '?'.$query : ''),
            301,
        );
    }

    /**
     * Новий шлях для старого або null, якщо правила немає.
     *
     * Правила застосовуються транзитивно — див. коментар про max_hops
     * у config/legacy.php.
     */
    private function legacyTarget(string $path): ?string
    {
        $current = $path;
        $result = null;

        for ($i = 0; $i < config('legacy.max_hops'); $i++) {
            $next = $this->applyOnce($current);

            if ($next === null || $next === $current) {
                break;
            }

            $result = $next;
            $current = $next;
        }

        return $result;
    }

    private function applyOnce(string $path): ?string
    {
        $clean = strlen($path) > 1 ? rtrim($path, '/') : $path;
        // Старий сайт віддавав /catalog/Lanch-box з великої літери
        $lower = mb_strtolower($clean);

        $exact = config('legacy.exact');

        foreach ([$clean, $lower] as $key) {
            if (isset($exact[$key])) {
                return $exact[$key];
            }
        }

        foreach (config('legacy.patterns') as $pattern => $replacement) {
            foreach ([$clean, $lower] as $subject) {
                if (preg_match($pattern, $subject)) {
                    return preg_replace($pattern, $replacement, $subject);
                }
            }
        }

        // Будь-який інший URL із великими літерами — на нижній регістр
        if ($clean !== $lower) {
            return $lower.'/';
        }

        return null;
    }
}
