{{--
    Плаваючі контакти: аудиторія часто пише в месенджер, а не дзвонить.
    З'являються після прокрутки, щоб не перекривати перший екран.
--}}
<div class="fixed bottom-4 right-4 z-40 flex flex-col gap-2"
     x-data="{ shown: false }"
     x-init="window.addEventListener('scroll', () => shown = window.scrollY > 400, { passive: true })"
     x-show="shown" x-cloak x-transition.opacity>
    <a href="{{ config('site.telegram') }}" target="_blank" rel="noopener noreferrer"
       class="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-border"
       aria-label="Telegram">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="text-primary">
            <path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9L18 5.7c.4-.3-.1-.5-.6-.2L7.2 12 2.6 10.5c-1-.3-1-1 .2-1.5l18-6.9c.8-.3 1.5.2 1.1 2.2z"/>
        </svg>
    </a>
    <a href="{{ config('site.viber') }}"
       class="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-border"
       aria-label="Viber">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-primary">
            <path d="M12 2a9 9 0 0 0-9 9c0 2 .6 3.8 1.7 5.3L3 22l5.9-1.6A9 9 0 1 0 12 2z"/>
        </svg>
    </a>
    <a href="tel:{{ config('site.phones')[0] }}"
       class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg"
       aria-label="{{ \App\Support\Format::phone(config('site.phones')[0]) }}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>
        </svg>
    </a>
</div>
