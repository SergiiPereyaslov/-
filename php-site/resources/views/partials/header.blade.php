@php
    use App\Support\Format;
    use App\Support\Url;

    $locale = app()->getLocale();
    $other = $locale === 'uk' ? 'ru' : 'uk';
    $phone = config('site.phones')[0];

    // Той самий шлях іншою мовою — щоб перемикач не скидав відвідувача
    // на головну з середини каталогу.
    $bare = $locale === 'ru' ? (substr(request()->getPathInfo(), 3) ?: '/') : request()->getPathInfo();

    $menu = [
        ['/brenduvannya/', __('site.nav.branding')],
        ['/dostavka-i-oplata/', __('site.nav.delivery')],
        ['/blog/', __('site.nav.blog')],
        ['/pro-nas/', __('site.nav.about')],
        ['/kontakty/', __('site.nav.contacts')],
    ];
@endphp

<header class="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur"
        x-data="{ menuOpen: false, catalogOpen: false }"
        @keydown.escape.window="menuOpen = false; catalogOpen = false">

    {{-- Темно-зелена смуга бренду: телефон, слоган, мова --}}
    <div class="band-deep text-[13px]">
        <div class="container-page flex h-10 items-center justify-between gap-4">
            <a href="tel:{{ $phone }}" class="font-display font-semibold tnum hover:opacity-80">
                {{ Format::phone($phone) }}
            </a>
            <span class="hidden font-display tracking-wide opacity-90 sm:block">{{ config('site.tagline') }}</span>
            <a href="{{ Url::to($bare, $other) }}" hreflang="{{ $other }}"
               class="font-display hover:opacity-80" title="{{ __('site.a11y.langToggle') }}">
                {{ $other === 'uk' ? 'Українська' : 'Русский' }}
            </a>
        </div>
    </div>

    {{-- Адреса й графік — сигнал локальності, головна перевага компанії --}}
    <div class="hidden border-b border-border text-xs text-muted lg:block">
        <div class="container-page flex h-8 items-center">
            <span>{{ config('site.address.city.'.$locale) }}, {{ config('site.address.street.'.$locale) }}
                · {{ config('site.hours.'.$locale) }}</span>
        </div>
    </div>

    <div class="container-page flex h-16 items-center gap-3 lg:gap-6">
        <button type="button" class="btn btn-ghost !min-h-10 !px-2 lg:hidden"
                @click="menuOpen = !menuOpen" :aria-expanded="menuOpen"
                aria-label="{{ __('site.header.menu') }}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path x-show="!menuOpen" d="M3 6h18M3 12h18M3 18h18" />
                <path x-show="menuOpen" x-cloak d="M6 6l12 12M18 6L6 18" />
            </svg>
        </button>

        <a href="{{ Url::to('/') }}" class="flex shrink-0 items-center gap-2.5 text-primary" aria-label="SmartEcoPack">
            <x-logo class="h-11 w-11" />
            <span class="sr-only">SmartEcoPack</span>
        </a>

        <div class="hidden flex-1 md:block">
            @include('partials.search-box', ['id' => 'site-search'])
        </div>

        <div class="ml-auto flex items-center gap-1">
            @include('partials.theme-toggle')
            @include('partials.cart-button')
        </div>
    </div>

    {{--
        Окремий рядок пошуку на мобільному. Ховати поле в бургер не можна:
        аудиторія шукає за конкретним розміром («стакан 340»), і пошук —
        основний спосіб навігації для тих, хто знає, що саме йому треба.
    --}}
    <div class="border-t border-border px-4 pb-3 pt-2 md:hidden">
        @include('partials.search-box', ['id' => 'site-search-mobile'])
    </div>

    {{-- Головна навігація --}}
    <nav aria-label="{{ __('site.a11y.mainNav') }}" class="hidden border-t border-border lg:block">
        <div class="container-page flex h-12 items-center gap-1">
            <div class="relative" @click.outside="catalogOpen = false">
                <button type="button" class="btn btn-ghost !min-h-9 font-semibold"
                        @click="catalogOpen = !catalogOpen" :aria-expanded="catalogOpen">
                    {{ __('site.nav.catalog') }}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                {{-- Мега-меню: уся структура сайту за одне відкриття --}}
                <div x-show="catalogOpen" x-cloak x-transition.opacity.duration.120ms
                     class="absolute left-0 top-full z-50 mt-1 w-[min(1180px,92vw)] rounded-lg border border-border bg-surface p-6 shadow-lg">
                    <div class="grid grid-cols-5 gap-6">
                        @foreach ($navGroups as $group)
                            <div>
                                <a href="{{ Url::to('/catalog/'.$group['slug'].'/') }}"
                                   class="mb-2 block font-display text-sm font-bold hover:text-primary">
                                    {{ $group['name'] }}
                                </a>
                                <ul class="space-y-1.5">
                                    @foreach ($group['categories'] as $category)
                                        <li>
                                            <a href="{{ Url::to('/catalog/'.$category['slug'].'/') }}"
                                               class="text-[13px] leading-snug text-muted hover:text-primary">
                                                {{ $category['name'] }}
                                            </a>
                                        </li>
                                    @endforeach
                                </ul>
                            </div>
                        @endforeach
                    </div>
                    <a href="{{ Url::to('/catalog/') }}"
                       class="mt-5 inline-block border-t border-border pt-4 text-sm font-semibold text-primary">
                        {{ __('site.catalog.allProducts') }} →
                    </a>
                </div>
            </div>

            @foreach ($menu as [$href, $label])
                <a href="{{ Url::to($href) }}" class="btn btn-ghost !min-h-9 font-medium">{{ $label }}</a>
            @endforeach
        </div>
    </nav>

    {{-- Мобільне меню --}}
    <div x-show="menuOpen" x-cloak class="border-t border-border bg-surface lg:hidden">
        <div class="container-page py-4">
            <ul class="space-y-1">
                @foreach ($navGroups as $group)
                    <li>
                        <details class="group">
                            <summary class="flex cursor-pointer items-center justify-between rounded-md px-2 py-2.5 font-semibold marker:content-none">
                                {{ $group['name'] }}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     stroke-width="2.5" class="transition-transform group-open:rotate-180">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </summary>
                            <ul class="mb-2 ml-2 space-y-0.5 border-l border-border pl-3">
                                @foreach ($group['categories'] as $category)
                                    <li>
                                        <a href="{{ Url::to('/catalog/'.$category['slug'].'/') }}"
                                           class="block py-2 text-sm text-muted">{{ $category['name'] }}</a>
                                    </li>
                                @endforeach
                            </ul>
                        </details>
                    </li>
                @endforeach
            </ul>

            <hr class="my-3 border-border">

            <ul class="space-y-0.5">
                @foreach ($menu as [$href, $label])
                    <li><a href="{{ Url::to($href) }}" class="block px-2 py-2.5 font-medium">{{ $label }}</a></li>
                @endforeach
            </ul>

            <hr class="my-3 border-border">

            <div class="flex items-center justify-between px-2">
                <a href="tel:{{ $phone }}" class="font-semibold text-primary">{{ Format::phone($phone) }}</a>
                <a href="{{ Url::to($bare, $other) }}" hreflang="{{ $other }}" class="chip">
                    {{ $other === 'uk' ? 'Українська' : 'Русский' }}
                </a>
            </div>
        </div>
    </div>
</header>
