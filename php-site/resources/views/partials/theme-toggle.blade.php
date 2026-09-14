{{--
    Перемикач теми.

    Три стани, а не два: світла, темна й системна. Вибір пишеться в
    localStorage і застосовується інлайн-скриптом до першого фарбування —
    див. partials/inline-scripts.blade.php.
--}}
<button type="button"
        class="btn btn-ghost !min-h-10 !px-2.5"
        aria-label="{{ __('site.a11y.themeToggle') }}"
        x-data="themeToggle()"
        @click="toggle()">
    <svg x-show="!isDark" width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
    <svg x-show="isDark" x-cloak width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.8">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
</button>
